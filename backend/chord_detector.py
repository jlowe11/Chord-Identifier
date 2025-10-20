import librosa
import numpy as np

def detect_chords(audio_path, beats_per_chord=4):
    
    y, sr = librosa.load(audio_path)
    
    # Separate harmonic component for cleaner chords
    y_harmonic, _ = librosa.effects.hpss(y)
    
    # Get tempo and beats
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    
    chroma = librosa.feature.chroma_stft(y=y_harmonic, sr=sr)

    beat_frames = librosa.time_to_frames(beats, sr=sr)
    chord_progression = []

    for i in range(0, len(beats)-beats_per_chord, beats_per_chord):
        start = beat_frames[i]
        end = beat_frames[min(i + beats_per_chord, len(beat_frames)-1)]

        print(f"Segment {i}: start={start}, end={end}, shape={chroma[:, start:end].shape}")

        if end > start and chroma[:, start:end].shape[1] > 0:
            segment_chroma = np.mean(chroma[:, start:end], axis=1)
            if np.sum(segment_chroma) > 0:
                segment_chroma = segment_chroma / np.sum(segment_chroma)
        else:
            segment_chroma = np.zeros(12)

        print(f"Segment {i}: chroma={segment_chroma}, root={np.argmax(segment_chroma)}")

        chord = detect_chord_quality(segment_chroma)
        chord_progression.append({
            'beat': i,
            'time': beats[i],
            'chord': chord
        })
    
    return chord_progression

def detect_chord_quality(chroma_vector, threshold=0.2):
    root = np.argmax(chroma_vector)
    chord_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    # If the root is weak, return 'N' (no chord)
    if chroma_vector[root] < threshold:
        return 'N'

    major_third = chroma_vector[(root + 4) % 12]
    minor_third = chroma_vector[(root + 3) % 12]
    fifth = chroma_vector[(root + 7) % 12]

    # Require a strong fifth for triad detection
    if fifth < threshold / 2:
        return chord_names[root]

    if major_third > minor_third:
        return chord_names[root]  # Major
    else:
        return chord_names[root] + 'm'  # Minor

if __name__ == "__main__":
    # Test with a sample file
    chords = detect_chords("sample_audio/sampleaudio_1.wav")