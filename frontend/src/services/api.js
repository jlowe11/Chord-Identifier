// src/services/api.js - Updated with time signature support
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const uploadAudio = async (file, timeSignature = '4/4', rootsPerMeasure = 1, onProgress = null) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('time_signature', timeSignature);
  formData.append('roots_per_measure', rootsPerMeasure);
  
  try {
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.response) {
      throw new Error(error.response.data.error || 'Server error occurred');
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please check if backend is running.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

export const analyzeAudio = async (file) => {
  const formData = new FormData();
  formData.append('audio', file);
  
  try {
    const response = await axios.post(`${API_BASE}/analyze`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Analyze error:', error);
    
    if (error.response) {
      throw new Error(error.response.data.error || 'Analysis failed');
    } else if (error.request) {
      throw new Error('Cannot connect to server');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE}/`);
    return response.status === 200;
  } catch {
    return false;
  }
};