// frontend/src/components/UploadForm.js
import React, { useState } from 'react';

function UploadForm({ onUploadSuccess }) {
  // ... (useState hooks are the same)
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file first!');
      return;
    }

    setMessage('Uploading and analyzing...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the environment variable for the URL
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      // ... (rest of the function is the same)
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      setMessage(`Success! Lap time for ${data.username} on ${data.map_name} was recorded.`);
      onUploadSuccess();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    // ... (the JSX part remains the same)
    <div className="upload-container">
      <h2>Upload Screenshot</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UploadForm;