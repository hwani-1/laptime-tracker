# run.py

import os
import re
import datetime
import certifi
import boto3
import io
from zoneinfo import ZoneInfo
from flask import Flask, request, jsonify
from pymongo import MongoClient, ASCENDING
from werkzeug.utils import secure_filename
from config import Config
from google.cloud import vision
from flask_cors import CORS

# --- App & DB Setup ---
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# --- AWS S3 Setup ---
s3 = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_S3_REGION')
)
S3_BUCKET_NAME = os.environ.get('AWS_S3_BUCKET_NAME')

try:
    client = MongoClient(app.config['MONGO_URI'], tlsCAFile=certifi.where())
    db = client.get_default_database()
    collection = db['laptimes']
    client.server_info()
    print("✅ MongoDB에 성공적으로 연결되었습니다.")
except Exception as e:
    print(f"❌ MongoDB 연결 실패: {e}")
    client = None

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- S3 Upload Helper Function ---
def upload_content_to_s3(content, bucket_name, object_name, content_type):
    try:
        region = os.environ.get('AWS_S3_REGION')
        url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{object_name}"
        s3.upload_fileobj(
            io.BytesIO(content),
            bucket_name,
            object_name,
            ExtraArgs={'ACL': 'public-read', 'ContentType': content_type}
        )
        return url
    except Exception as e:
        print(f"S3 업로드 에러: {e}")
        return None

# --- AI(OCR) Function ---
def detect_text_from_image(content):
    vision_client = vision.ImageAnnotatorClient()
    image = vision.Image(content=content)
    response = vision_client.text_detection(image=image)
    if response.error.message:
        raise Exception(f"Vision API 에러: {response.error.message}")
    return response.text_annotations[0].description if response.text_annotations else ""

# --- Main API Endpoint ---
@app.route('/api/upload', methods=['POST'])
def upload_and_process_screenshot():
    if 'file' not in request.files:
        return jsonify({"error": "요청에 파일이 없습니다."}), 400
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "파일이 선택되지 않았거나 허용되지 않는 파일 형식입니다."}), 400

    filename = secure_filename(file.filename)
    file_content = file.read()
    screenshot_url = upload_content_to_s3(file_content, S3_BUCKET_NAME, filename, file.content_type)

    if not screenshot_url:
        return jsonify({"error": "S3에 파일을 업로드하지 못했습니다."}), 500
    print(f"✅ S3 업로드 완료: {screenshot_url}")
    
    try:
        full_text = detect_text_from_image(file_content)
        print("--- OCR 분석 결과 ---")
        print(full_text)
        print("---------------------------")
        
        map_name_match = re.search(r"(.+)\n\(.*\)", full_text)
        # FINAL FIX: Use a non-greedy match to find the *next* time after the anchor
        lap_time_match = re.search(r"최단 시간(?:.|\n)*?(\d{1,2}:\d{2}\.\d{2,3})", full_text)
        username_match = re.search(r"(?:Te|\d+)\s+\d+\s+(\S+)", full_text)

        map_name = map_name_match.group(1).strip() if map_name_match else "Unknown"
        lap_time = lap_time_match.group(1) if lap_time_match else "00:00.00"
        username = username_match.group(1).strip() if username_match else "Unknown"

        laptime_data = {
            "username": username,
            "map_name": map_name,
            "lap_time": lap_time,
            "screenshot_url": screenshot_url,
            "uploaded_at":  datetime.datetime.now(ZoneInfo("Asia/Seoul"))
        }
        result = collection.insert_one(laptime_data)
        laptime_data['_id'] = str(result.inserted_id)
        print(f"✅ 데이터베이스에 저장 완료: {laptime_data}")
        return jsonify(laptime_data), 201
    except Exception as e:
        print(f"❌ 분석 또는 DB 저장 실패: {e}")
        return jsonify({"error": f"이미지 처리 중 오류 발생: {e}"}), 500

# --- Ranking API Endpoint ---
@app.route('/api/laptimes', methods=['GET'])
def get_laptimes():
    if client is None:
        return jsonify({"error": "데이터베이스에 연결되지 않았습니다."}), 500
    try:
        map_filter = request.args.get('map')
        query = {}
        if map_filter and map_filter != 'All':
            query['map_name'] = map_filter
        laptimes = list(collection.find(query, {'_id': 0}).sort("lap_time", ASCENDING))
        for lap in laptimes:
            if 'uploaded_at' in lap and isinstance(lap['uploaded_at'], datetime.datetime):
                lap['uploaded_at'] = lap['uploaded_at'].isoformat()
        return jsonify(laptimes), 200
    except Exception as e:
        print(f"❌ 데이터 조회 실패: {e}")
        return jsonify({"error": "데이터를 조회하는 데 실패했습니다."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)