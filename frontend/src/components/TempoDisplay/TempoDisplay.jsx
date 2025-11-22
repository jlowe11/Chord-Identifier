// src/components/TempoDisplay/TempoDisplay.jsx
import React from 'react';
import './TempoDisplay.css';

const TempoDisplay = ({ 
  tempo, 
  timeSignature, 
  currentMeasure, 
  currentBeat, 
  totalMeasures 
}) => {
  return (
    <div className="tempo-display">
      <div className="tempo-info">
        <div className="tempo-item">
          <span className="tempo-label">Tempo</span>
          <span className="tempo-value">{tempo?.toFixed(1)} BPM</span>
        </div>
        
        <div className="tempo-item">
          <span className="tempo-label">Time</span>
          <span className="tempo-value">{timeSignature}</span>
        </div>
        
        <div className="tempo-item">
          <span className="tempo-label">Measure</span>
          <span className="tempo-value">
            {currentMeasure} / {totalMeasures}
          </span>
        </div>
        
        <div className="tempo-item">
          <span className="tempo-label">Beat</span>
          <span className="tempo-value beat-indicator">
            {currentBeat}
          </span>
        </div>
      </div>
      
      <div className="beat-visualization">
        {[...Array(parseInt(timeSignature.split('/')[0]))].map((_, i) => (
          <div 
            key={i}
            className={`beat-dot ${i + 1 === currentBeat ? 'active' : ''} ${i === 0 ? 'downbeat' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TempoDisplay;