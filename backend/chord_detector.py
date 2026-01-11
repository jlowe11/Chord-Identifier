
import librosa
import numpy as np
from scipy import signal
from scipy.signal import medfilt

# Note names
CHORD_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Time signature definitions
def parse_time_signature(time_signature):
    """
    Parse time signature string and return beats per measure
    Handles any custom time signature like 13/8, 9/16, etc.
    """
    try:
        parts = time_signature.split('/')
        if len(parts) == 2:
            numerator = int(parts[0])
            denominator = int(parts[1])
            return {
                'beats_per_measure': numerator,
                'beat_value': denominator,
                'time_signature': time_signature
            }
    except:
        pass
    
    # Default to 4/4 if parsing fails
    return {
        'beats_per_measure': 4,
        'beat_value': 4,
        'time_signature': '4/4'
    }


def detect_chords(audio_path, time_signature='4/4', roots_per_measure=1):
    """
    Detect root notes based on tempo, beats, and time signature
    
    Args:
        audio_path: Path to audio file
        time_signature: Time signature (e.g., '4/4', '3/4', '6/8')
        roots_per_measure: How many root changes per measure (1, 2, or 4)
    
    Returns:
        Dictionary with tempo info, measures, and detected roots
    """
    print(f"\n=== Analyzing: {audio_path} ===")
    print(f"Time Signature: {time_signature}, Roots per measure: {roots_per_measure}")
    
    # Load audio
    y, sr = librosa.load(audio_path)
    duration = len(y) / sr
    
    # Get tempo and beat analysis
    tempo_info = estimate_tempo_and_beats(y, sr)
    
    # Calculate measures
    time_sig = parse_time_signature(time_signature)
    beats_per_measure = time_sig['beats_per_measure']
    
    measure_info = calculate_measures(
        duration, 
        tempo_info['tempo'], 
        beats_per_measure
    )
    
    # Extract bass frequencies for root detection
    y_bass = extract_bass_frequencies(y, sr)
    
    # Get bass chroma
    bass_chroma = librosa.feature.chroma_cqt(
        y=y_bass, 
        sr=sr, 
        hop_length=512,
        fmin=librosa.note_to_hz('C1'),
        bins_per_octave=12
    )
    
    # Apply median filtering
    for i in range(12):
        bass_chroma[i, :] = medfilt(bass_chroma[i, :], kernel_size=5)
    
    # Detect roots aligned to measures
    roots = detect_roots_by_measure(
        bass_chroma, 
        tempo_info['beats'], 
        sr,
        beats_per_measure,
        roots_per_measure
    )
    
    # Create comprehensive result
    result = {
        'tempo': tempo_info['tempo'],
        'time_signature': time_signature,
        'beats_per_measure': beats_per_measure,
        'total_beats': len(tempo_info['beats']),
        'total_measures': measure_info['total_measures'],
        'measure_duration': measure_info['measure_duration'],
        'roots': roots,
        'duration': duration
    }
    
    print(f"\nResults:")
    print(f"  Tempo: {result['tempo']:.1f} BPM")
    print(f"  Total Measures: {result['total_measures']:.1f}")
    print(f"  Measure Duration: {result['measure_duration']:.2f} seconds")
    print(f"  Detected {len(roots)} root segments")
    
    return result


def estimate_tempo_and_beats(y, sr):
    """
    Estimates tempo (BPM) and beat times from audio
    
    Args:
        y: Audio signal
        sr: Sample rate
    
    Returns:
        Dictionary with tempo and beat information
    """
    try:
        # Separate percussive component for better beat tracking
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        # Get tempo and beats
        tempo, beat_frames = librosa.beat.beat_track(
            y=y_percussive, 
            sr=sr,
            trim=False
        )
        
        # Convert to time
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)
        
        # Handle numpy array tempo
        if isinstance(tempo, np.ndarray):
            tempo = float(tempo[0]) if tempo.size > 0 else 120.0
        else:
            tempo = float(tempo)
        
        # Refine tempo estimate using onset detection
        onset_env = librosa.onset.onset_strength(y=y_percussive, sr=sr)
        tempo_refined = librosa.feature.tempo(
            onset_envelope=onset_env, 
            sr=sr,
            aggregate=None
        )
        
        # Use refined tempo if available and reasonable
        if tempo_refined.size > 0:
            median_tempo = np.median(tempo_refined)
            if 40 <= median_tempo <= 240:  # Reasonable tempo range
                tempo = float(median_tempo)
        
        return {
            'tempo': tempo,
            'beats': beat_times,
            'beat_frames': beat_frames
        }
        
    except Exception as e:
        print(f"Error during tempo estimation: {e}")
        # Fallback to 120 BPM
        return {
            'tempo': 120.0,
            'beats': np.array([]),
            'beat_frames': np.array([])
        }


def calculate_measures(duration_sec, tempo_bpm, beats_per_measure=4):
    """
    Calculate measure-related information
    
    Args:
        duration_sec: Audio duration in seconds
        tempo_bpm: Tempo in BPM
        beats_per_measure: Beats per measure (from time signature)
    
    Returns:
        Dictionary with measure information
    """
    if duration_sec is None or tempo_bpm is None:
        return {
            'total_measures': 0,
            'measure_duration': 0,
            'beat_duration': 0
        }
    
    # Calculate beat duration in seconds
    beat_duration = 60.0 / tempo_bpm
    
    # Calculate measure duration in seconds
    measure_duration = beat_duration * beats_per_measure
    
    # Calculate total beats
    total_beats = (tempo_bpm / 60.0) * duration_sec
    
    # Calculate total measures
    total_measures = total_beats / beats_per_measure
    
    return {
        'total_measures': total_measures,
        'measure_duration': measure_duration,
        'beat_duration': beat_duration,
        'total_beats': total_beats
    }


def extract_bass_frequencies(y, sr, cutoff=200):
    """
    Extract bass frequencies from audio
    
    Args:
        y: Audio signal
        sr: Sample rate
        cutoff: Low-pass filter cutoff frequency (Hz)
    
    Returns:
        Filtered audio containing only bass frequencies
    """
    nyquist = sr / 2
    normal_cutoff = cutoff / nyquist
    
    # 5th order butterworth filter
    b, a = signal.butter(5, normal_cutoff, btype='low', analog=False)
    
    # Apply filter
    y_bass = signal.filtfilt(b, a, y)
    
    return y_bass


def detect_roots_by_measure(bass_chroma, beat_times, sr, beats_per_measure, roots_per_measure):
    """
    Detect roots aligned to musical measures
    
    Args:
        bass_chroma: Chroma features from bass frequencies
        beat_times: Array of beat times in seconds
        sr: Sample rate
        beats_per_measure: Number of beats in a measure
        roots_per_measure: How many root changes per measure (1, 2, or 4)
    
    Returns:
        List of detected roots with timing aligned to measures
    """
    roots = []
    
    # Calculate beats per root segment
    if roots_per_measure == 1:
        beats_per_segment = beats_per_measure
    elif roots_per_measure == 2:
        beats_per_segment = max(1, beats_per_measure // 2)
    elif roots_per_measure == 4:
        beats_per_segment = max(1, beats_per_measure // 4)
    else:
        beats_per_segment = beats_per_measure
    
    print(f"  Beats per root segment: {beats_per_segment}")
    
    # Convert beat times to frames
    beat_frames = librosa.time_to_frames(beat_times, sr=sr, hop_length=512)
    
    # Process each segment
    measure_count = 0
    for i in range(0, len(beat_times) - beats_per_segment, beats_per_segment):
        # Check if we're at a new measure
        if i % beats_per_measure == 0:
            measure_count += 1
        
        start_frame = beat_frames[i]
        end_frame = beat_frames[min(i + beats_per_segment, len(beat_frames) - 1)]
        
        if end_frame > start_frame and end_frame <= bass_chroma.shape[1]:
            # Get bass chroma for this segment
            segment_chroma = bass_chroma[:, start_frame:end_frame]
            
            # Focus on the first beat of the segment (most important)
            first_beat_frame = beat_frames[i]
            window = 10  # frames around the beat
            beat_start = max(0, first_beat_frame - window)
            beat_end = min(bass_chroma.shape[1], first_beat_frame + window)
            
            if beat_end > beat_start:
                beat_chroma = bass_chroma[:, beat_start:beat_end]
                root, confidence = detect_root_from_bass(beat_chroma)
            else:
                root, confidence = detect_root_from_bass(segment_chroma)
            
            # Calculate position in measure
            beat_in_measure = i % beats_per_measure
            
            roots.append({
                'time': float(beat_times[i]),
                'duration': float(beat_times[min(i + beats_per_segment, len(beat_times) - 1)] - beat_times[i]),
                'root': CHORD_NAMES[root],
                'confidence': float(confidence),
                'measure': measure_count,
                'beat_in_measure': beat_in_measure + 1,  # 1-indexed for musicians
                'is_downbeat': beat_in_measure == 0
            })
    
    return roots


def detect_root_from_bass(bass_chroma_segment):
    """
    Detect the root note from a bass chroma segment
    
    Args:
        bass_chroma_segment: Chroma values for a time segment
    
    Returns:
        Tuple of (root_pitch_class, confidence)
    """
    # Average across time if needed
    if bass_chroma_segment.ndim > 1:
        bass_weights = np.mean(bass_chroma_segment, axis=1)
    else:
        bass_weights = bass_chroma_segment
    
    # Normalize
    if np.sum(bass_weights) > 0:
        bass_weights = bass_weights / np.sum(bass_weights)
    else:
        return 0, 0.0
    
    # Find the strongest pitch class
    root = np.argmax(bass_weights)
    confidence = bass_weights[root]
    
    # Boost confidence if root is significantly stronger
    if confidence > 0.25:
        sorted_weights = np.sort(bass_weights)[::-1]
        if sorted_weights[0] > sorted_weights[1] * 1.5:
            confidence = min(confidence * 1.2, 1.0)
    
    return root, confidence


def get_audio_duration(file_path):
    """Get duration of audio file in seconds"""
    try:
        y, sr = librosa.load(file_path, duration=None)
        duration = len(y) / sr
        return duration
    except Exception as e:
        print(f"Error getting audio duration: {e}")
        return None


if __name__ == "__main__":
    # Test the detector
    import os
    import json
    
    test_file = "../sample_audio/sampleaudio_1.wav"
    
    if os.path.exists(test_file):
        print("="*60)
        print("CHORD ROOT DETECTION - TEMPO & TIME SIGNATURE BASED")
        print("="*60)
        
        # Test different time signatures and root densities
        test_configs = [
            ('4/4', 1),  # One root per measure (whole notes)
            ('4/4', 2),  # Two roots per measure (half notes)
            ('4/4', 4),  # Four roots per measure (quarter notes)
            ('3/4', 1),  # Waltz time
            ('6/8', 2),  # Compound time
        ]
        
        for time_sig, roots_per_measure in test_configs:
            print(f"\n{'='*40}")
            print(f"Testing: {time_sig} with {roots_per_measure} root(s) per measure")
            print(f"{'='*40}")
            
            result = detect_chords(test_file, time_sig, roots_per_measure)
            
            # Show first few roots
            print("\nFirst 8 root changes:")
            for i, root_info in enumerate(result['roots'][:8], 1):
                time = root_info['time']
                root = root_info['root']
                measure = root_info['measure']
                beat = root_info['beat_in_measure']
                conf = root_info['confidence']
                downbeat = "↓" if root_info['is_downbeat'] else " "
                
                print(f"{i:2d}. M{measure:02d}:{beat} {downbeat} {time:6.2f}s: {root:2s} (conf: {conf:.2f})")
            
            # Save one example to JSON
            if time_sig == '4/4' and roots_per_measure == 1:
                with open('tempo_based_roots.json', 'w') as f:
                    json.dump(result, f, indent=2)
                print("\nFull results saved to tempo_based_roots.json")
    else:
        print(f"Test file not found: {test_file}")