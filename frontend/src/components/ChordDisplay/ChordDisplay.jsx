// src/components/ChordDisplay/ChordDisplay.jsx
import React from 'react';
import './ChordDisplay.css';

const ChordDisplay = ({ 
  chords, 
  currentTime, 
  duration, 
  onChordClick,
  timeSignature,
  measureDuration 
}) => {
  // Group chords by measure
  const measureGroups = {};
  chords.forEach(chord => {
    const measure = chord.measure || Math.floor(chord.time / measureDuration) + 1;
    if (!measureGroups[measure]) {
      measureGroups[measure] = [];
    }
    measureGroups[measure].push(chord);
  });

  return (
    <div className="chord-display">
      <h3>Root Progression</h3>
      
      <div className="chord-timeline">
        <div className="timeline-ruler">
          {Object.keys(measureGroups).slice(0, 20).map(measure => (
            <div 
              key={measure}
              className="measure-marker"
              style={{
                left: `${(measureGroups[measure][0].time / duration) * 100}%`
              }}
            >
              M{measure}
            </div>
          ))}
        </div>
        
        <div className="chord-track">
          {chords.map((chord, index) => {
            const width = (chord.duration / duration) * 100;
            const left = (chord.time / duration) * 100;
            const isActive = currentTime >= chord.time && 
                            currentTime < chord.time + chord.duration;
            
            // Color based on confidence
            const opacity = 0.3 + (chord.confidence * 0.7);
            const backgroundColor = chord.is_downbeat 
              ? `rgba(99, 102, 241, ${opacity})`  // Primary color for downbeats
              : `rgba(107, 114, 128, ${opacity})`; // Gray for other beats
            
            return (
              <div
                key={index}
                className={`chord-block ${isActive ? 'active' : ''} ${chord.is_downbeat ? 'downbeat' : ''}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor,
                  borderLeft: chord.is_downbeat ? '2px solid var(--primary-color)' : 'none'
                }}
                onClick={() => onChordClick(chord)}
                title={`${chord.root} - M${chord.measure}:${chord.beat_in_measure} (${chord.confidence.toFixed(2)} conf)`}
              >
                <span className="chord-text">{chord.root}</span>
                {chord.is_downbeat && <span className="downbeat-indicator">↓</span>}
              </div>
            );
          })}
        </div>
        
        <div className="timeline-playhead" 
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color downbeat-color"></div>
          <span>Downbeat</span>
        </div>
        <div className="legend-item">
          <div className="legend-color regular-color"></div>
          <span>Other beats</span>
        </div>
        <div className="legend-item">
          <span>Opacity = Confidence</span>
        </div>
      </div>
    </div>
  );
};

export default ChordDisplay;