// frontend/src/components/UploadForm.js

import React, { useState } from 'react';

// The component now receives the 'onUploadSuccess' function as a prop.
function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('파일을 먼저 선택해주세요!');
      return;
    }

    setMessage('업로드 및 분석 중...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '업로드 실패');
      }

      setMessage(`성공! ${data.username}님의 ${data.map_name} 랩타임이 기록되었습니다.`);
      
      // Instead of reloading the page, it calls the function from App.js.
      onUploadSuccess();
      
    } catch (error) {
      setMessage(`에러: ${error.message}`);
    }
  };

  return (
    <div className="upload-container">
      <h2>스크린샷 업로드</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" />
        <button type="submit">업로드</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UploadForm;