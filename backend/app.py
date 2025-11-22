from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from chord_detector import detect_chords

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 16MB max

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def hello():
    return "Chord Detection API is running!"

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['audio']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get parameters from request
        time_signature = request.form.get('time_signature', '4/4')
        roots_per_measure = int(request.form.get('roots_per_measure', 1))
        
        try:
            # Detect chords/roots with time signature
            result = detect_chords(filepath, time_signature, roots_per_measure)
            
            # Format response
            response = {
                'tempo': result['tempo'],
                'time_signature': result['time_signature'],
                'beats_per_measure': result['beats_per_measure'],
                'total_measures': result['total_measures'],
                'measure_duration': result['measure_duration'],
                'duration': result['duration'],
                'roots': result['roots'][:200],  # Limit to 200 for response size
                'total_roots': len(result['roots'])
            }
            
        except Exception as e:
            print(f"Error detecting chords: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to process audio'}), 500
        finally:
            # Clean up
            if os.path.exists(filepath):
                os.remove(filepath)
        
        return jsonify(response)
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/analyze', methods=['POST'])
def analyze_tempo():
    """Endpoint to just get tempo and time analysis without full chord detection"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['audio']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            from chord_detector import get_audio_duration, estimate_tempo_and_beats, calculate_measures
            
            # Load and analyze
            import librosa
            y, sr = librosa.load(filepath)
            duration = len(y) / sr
            
            # Get tempo and beats
            tempo_info = estimate_tempo_and_beats(y, sr)
            
            # Calculate measures for different time signatures
            time_sigs = ['4/4', '3/4', '6/8', '2/4']
            measure_info = {}
            
            for ts in time_sigs:
                beats_per_measure = int(ts.split('/')[0])
                measures = calculate_measures(duration, tempo_info['tempo'], beats_per_measure)
                measure_info[ts] = {
                    'total_measures': measures['total_measures'],
                    'measure_duration': measures['measure_duration']
                }
            
            response = {
                'tempo': tempo_info['tempo'],
                'duration': duration,
                'total_beats': len(tempo_info['beats']),
                'time_signatures': measure_info,
                'suggested_time_signature': '4/4'  # Default, could add detection logic
            }
            
        except Exception as e:
            print(f"Error analyzing tempo: {e}")
            return jsonify({'error': 'Failed to analyze audio'}), 500
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
        
        return jsonify(response)
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)