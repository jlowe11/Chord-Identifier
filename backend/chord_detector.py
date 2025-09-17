import librosa
import numpy as np

def detect_chords(audio_path):
    y, sr = librosa.load(audio_path)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    
    # Simple chord detection logic (placeholder)
    chord_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    chords = []
    for i in range(chroma.shape[1]):
        chord_idx = np.argmax(chroma[:, i])
        chords.append(chord_names[chord_idx])
    
    return chords
    

if __name__ == "__main__":
    # Test with a sample file
    chords = detect_chords("sample_audio/sampleaudio.wav")
    print(chords[:10])  # First 10 detected chords