# config.py

import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수를 로드합니다.
load_dotenv()

class Config:
    # .env 파일에 정의된 MONGO_URI를 불러옵니다. 없으면 None이 됩니다.
    MONGO_URI = os.environ.get('MONGO_URI')
    
    # 스크린샷을 업로드할 폴더를 지정합니다.
    UPLOAD_FOLDER = 'uploads'