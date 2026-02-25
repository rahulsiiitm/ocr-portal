from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pytesseract
from PIL import Image
import io
from docx import Document

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    image = Image.open(file.stream)
    
    # OCR PROCESS
    extracted_text = pytesseract.image_to_string(image, lang='eng+hin+san+mar+tam+pan+jpn')    
    
    # STATISTICS CALCULATION
    words = extracted_text.split()
    sentences = extracted_text.split('.')
    char_count = len(extracted_text)
    avg_word_len = sum(len(word) for word in words) / len(words) if words else 0
    
    stats = {
        'word_count': len(words),
        'sentence_count': len([s for s in sentences if s.strip()]),
        'char_count': char_count,
        'avg_word_length': round(avg_word_len, 2)
    }
    
    return jsonify({'text': extracted_text, 'stats': stats})

@app.route('/download-docx', methods=['POST'])
def download_docx():
    data = request.json
    if data is None:
        return jsonify({'error': 'No JSON data provided'}), 400
    text = data.get('text', '')
    
    document = Document()
    document.add_heading('OCR Extracted Text', 0)
    document.add_paragraph(text)
    
    f = io.BytesIO()
    document.save(f)
    f.seek(0)
    
    return send_file(f, as_attachment=True, download_name='extracted_text.docx', mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

if __name__ == '__main__':
    app.run(debug=True, port=5000)