import requests

# Test the upload endpoint
with open('sample_audio/test.mp3', 'rb') as f:
    files = {'audio': f}
    response = requests.post('http://localhost:5000/upload', files=files)
    print(response.json())