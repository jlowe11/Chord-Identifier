// src/App.js - Updated with time signature support
import React, { useState, useRef } from 'react';
import './app.css';
import FileUpload from './components/FileUpload/FileUpload';
import AudioPlayer from './components/AudioPlayer/AudioPlayer';
import ChordDisplay from './components/ChordDisplay/ChordDisplay';
import ChordList from './components/ChordList/ChordList';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import TempoDisplay from './components/TempoDisplay/TempoDisplay';
import { uploadAudio, analyzeAudio } from './services/api';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roots, setRoots] = useState([]);
  const [tempoInfo, setTempoInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [rootsPerMeasure, setRootsPerMeasure] = useState(1);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const handleFileSelect = async (file) => {
    setError(null);
    setAudioFile(file);
    
    // Create URL for audio playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // First, analyze tempo
    setIsLoading(true);
    try {
      const analysis = await analyzeAudio(file);
      setTempoInfo(analysis);
      
      // Then detect roots with selected settings
      const result = await uploadAudio(file, timeSignature, rootsPerMeasure);
      setRoots(result.roots || []);
      
      // Update tempo info with actual detection results
      setTempoInfo(prev => ({
        ...prev,
        tempo: result.tempo,
        total_measures: result.total_measures,
        measure_duration: result.measure_duration
      }));
      
      console.log(`Detected ${result.total_roots} roots at ${result.tempo.toFixed(1)} BPM`);
    } catch (err) {
      console.error('Error analyzing audio:', err);
      setError('Failed to analyze audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleChordClick = (root) => {
    if (audioRef.current) {
      audioRef.current.currentTime = root.time;
      setCurrentTime(root.time);
    }
  };

  const handleTimeSignatureChange = async (newTimeSignature) => {
    setTimeSignature(newTimeSignature);
    // Re-analyze if file exists
    if (audioFile && !isLoading) {
      await reanalyzeWithSettings(newTimeSignature, rootsPerMeasure);
    }
  };

  const handleRootsPerMeasureChange = async (newRootsPerMeasure) => {
    setRootsPerMeasure(newRootsPerMeasure);
    // Re-analyze if file exists
    if (audioFile && !isLoading) {
      await reanalyzeWithSettings(timeSignature, newRootsPerMeasure);
    }
  };

  const reanalyzeWithSettings = async (timeSig, rootsPerM) => {
    setIsLoading(true);
    try {
      const result = await uploadAudio(audioFile, timeSig, rootsPerM);
      setRoots(result.roots || []);
      setTempoInfo(prev => ({
        ...prev,
        tempo: result.tempo,
        total_measures: result.total_measures,
        measure_duration: result.measure_duration
      }));
    } catch (err) {
      console.error('Error re-analyzing:', err);
      setError('Failed to re-analyze with new settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMeasure = () => {
    if (!tempoInfo || !currentTime) return 1;
    return Math.floor(currentTime / tempoInfo.measure_duration) + 1;
  };

  const getCurrentBeat = () => {
    if (!tempoInfo || !currentTime) return 1;
    const measureProgress = (currentTime % tempoInfo.measure_duration) / tempoInfo.measure_duration;
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    return Math.floor(measureProgress * beatsPerMeasure) + 1;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Chord Root Detector</h1>
        <p>Tempo-based root detection with time signature support</p>
      </header>

      <main className="App-main">
        {!audioFile ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <>
            <div className="controls-section">
              <div className="file-info">
                <span className="file-name">{audioFile.name}</span>
                <button 
                  className="new-file-btn"
                  onClick={() => {
                    setAudioFile(null);
                    setAudioUrl(null);
                    setRoots([]);
                    setTempoInfo(null);
                    setError(null);
                  }}
                >
                  New File
                </button>
              </div>

              <div className="timing-controls">
                <div className="control-group">
                  <label>Time Signature:</label>
                  <div className="time-signature-input">
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={timeSignature.split('/')[0]}
                      onChange={(e) => {
                        const numerator = e.target.value;
                        const denominator = timeSignature.split('/')[1];
                        setTimeSignature(`${numerator}/${denominator}`);
                      }}
                      disabled={isLoading}
                      className="time-sig-number"
                      placeholder="4"
                    />
                    <span className="time-sig-slash">/</span>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      step="1"
                      value={timeSignature.split('/')[1]}
                      onChange={(e) => {
                        const numerator = timeSignature.split('/')[0];
                        const denominator = e.target.value;
                        setTimeSignature(`${numerator}/${denominator}`);
                      }}
                      disabled={isLoading}
                      className="time-sig-number"
                      placeholder="4"
                    />
                  </div>
                  <button
                    className="apply-time-sig-btn"
                    onClick={() => handleTimeSignatureChange(timeSignature)}
                    disabled={isLoading}
                  >
                    Apply
                  </button>
                  <span className="time-sig-hint">e.g., 4/4, 3/4, 6/8, 7/8</span>
                </div>

                <div className="control-group">
                  <label>Roots per Measure:</label>
                  <select 
                    value={rootsPerMeasure} 
                    onChange={(e) => handleRootsPerMeasureChange(parseInt(e.target.value))}
                    disabled={isLoading}
                  >
                    <option value={1}>1 (Whole notes)</option>
                    <option value={2}>2 (Half notes)</option>
                    <option value={4}>4 (Quarter notes)</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {tempoInfo && (
              <TempoDisplay 
                tempo={tempoInfo.tempo}
                timeSignature={timeSignature}
                currentMeasure={getCurrentMeasure()}
                currentBeat={getCurrentBeat()}
                totalMeasures={Math.ceil(tempoInfo.total_measures)}
              />
            )}

            {isLoading ? (
              <LoadingSpinner message="Analyzing tempo and detecting roots..." />
            ) : (
              <>
                <AudioPlayer
                  audioUrl={audioUrl}
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                />

                {roots.length > 0 && (
                  <>
                    <ChordDisplay
                      chords={roots}
                      currentTime={currentTime}
                      duration={audioRef.current?.duration || tempoInfo?.duration || 0}
                      onChordClick={handleChordClick}
                      timeSignature={timeSignature}
                      measureDuration={tempoInfo?.measure_duration}
                    />

                    <ChordList
                      chords={roots}
                      currentTime={currentTime}
                      onChordClick={handleChordClick}
                      showMeasureInfo={true}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>Supported formats: MP3, WAV, M4A, FLAC • Max size: 32MB • Tempo-based analysis</p>
      </footer>
    </div>
  );
}

export default App;