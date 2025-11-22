// src/components/FileUpload/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

const FileUpload = ({ onFileSelect }) => {
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 32 * 1024 * 1024) {
        setError('File size must be less than 32MB');
      } else {
        setError('Invalid file type. Please upload MP3, WAV, M4A, or FLAC');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
      'audio/flac': ['.flac'],
      'audio/mp4': ['.m4a'],
      'audio/x-wav': ['.wav']
    },
    maxSize: 32 * 1024 * 1024, // 32MB
    multiple: false
  });

  return (
    <div className="file-upload-container">
      <div 
        {...getRootProps()} 
        className={`upload-zone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="upload-content">
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </div>
          
          {isDragActive ? (
            <p className="upload-text">Drop your audio file here...</p>
          ) : isDragReject ? (
            <p className="upload-text error">Invalid file type!</p>
          ) : (
            <>
              <p className="upload-text">
                Drag & drop your audio file here
              </p>
              <p className="upload-subtext">
                or click to browse
              </p>
              <button className="browse-button" type="button">
                Choose File
              </button>
              <p className="upload-formats">
                Supported: MP3, WAV, M4A, FLAC (max 32MB)
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="upload-error">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;