// src/components/FileUpload/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';
import { ReactComponent as AudioUploadIcon } from '../../assets/audio_upload_icon.svg';

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
            <AudioUploadIcon width="64" height="64" />
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