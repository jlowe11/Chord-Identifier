// src/components/ChordList/ChordList.jsx
import React from 'react';
import './ChordList.css';

const ChordList = ({ chords, currentTime, onChordClick, showMeasureInfo = true }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const exportToText = () => {
    let text = "Root Progression Analysis\n";
    text += "========================\n\n";
    
    let currentMeasure = 0;
    chords.forEach(chord => {
      if (chord.measure !== currentMeasure) {
        currentMeasure = chord.measure;
        text += `\nMeasure ${currentMeasure}:\n`;
      }
      text += `  Beat ${chord.beat_in_measure}: ${chord.root} (${formatTime(chord.time)})\n`;
    });
    
    // Download as text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chord_progression.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      analysis_date: new Date().toISOString(),
      roots: chords
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chord_progression.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chord-list">
      <div className="chord-list-header">
        <h3>Root List</h3>
        <div className="export-buttons">
          <button onClick={exportToText} className="export-btn">
            Export TXT
          </button>
          <button onClick={exportToJSON} className="export-btn">
            Export JSON
          </button>
        </div>
      </div>
      
      <div className="chord-items">
        <div className="chord-items-header">
          <span>Measure</span>
          <span>Beat</span>
          <span>Root</span>
          <span>Time</span>
          <span>Confidence</span>
        </div>
        
        {chords.map((chord, index) => {
          const isActive = currentTime >= chord.time && 
                          currentTime < chord.time + chord.duration;
          
          return (
            <div
              key={index}
              className={`chord-item ${isActive ? 'active' : ''} ${chord.is_downbeat ? 'downbeat' : ''}`}
              onClick={() => onChordClick(chord)}
            >
              <span className="measure-num">M{chord.measure}</span>
              <span className="beat-num">
                {chord.is_downbeat && '↓'} {chord.beat_in_measure}
              </span>
              <span className="chord-name">{chord.root}</span>
              <span className="chord-time">{formatTime(chord.time)}</span>
              <span className="chord-confidence">
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${chord.confidence * 100}%` }}
                  />
                </div>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordList;