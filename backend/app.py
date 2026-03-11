from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pytesseract
from PIL import Image
import io
from docx import Document
import Levenshtein
import jellyfish
import nltk
import re
import random

# --- DOWNLOAD DICTIONARY ---
nltk.download('words')
from nltk.corpus import words

# Convert to set for fast lookup O(1)
ENGLISH_DICTIONARY = set(word.lower() for word in words.words())

# Smaller subset used for benchmark comparison (performance)
DICTIONARY_SAMPLE = random.sample(list(ENGLISH_DICTIONARY), 5000)

# Path to Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------
# TEXT CLEANING
# ---------------------------------------------------

def clean_token(word):
    """
    Removes numbers, punctuation, and converts to lowercase
    """
    return re.sub(r'[^a-z]', '', word.lower())


# ---------------------------------------------------
# DISTANCE METRICS
# ---------------------------------------------------

def get_distances(word, benchmark):

    # Hamming Distance
    if len(word) == len(benchmark):
        hamming = sum(c1 != c2 for c1, c2 in zip(word, benchmark))
    else:
        hamming = "N/A"

    # LCS Distance (Dynamic Programming)
    m, n = len(word), len(benchmark)
    dp = [[0]*(n+1) for _ in range(m+1)]

    for i in range(1, m+1):
        for j in range(1, n+1):
            if word[i-1] == benchmark[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    lcs_length = dp[m][n]
    lcs_distance = (m + n) - 2 * lcs_length

    return {
        "hamming": hamming,
        "lcs": lcs_distance,
        "levenshtein": Levenshtein.distance(word, benchmark),
        "jaro": round(jellyfish.jaro_similarity(word, benchmark), 3)
    }


# ---------------------------------------------------
# BENCHMARK SELECTION
# ---------------------------------------------------

def find_benchmark(word):
    """
    Finds closest dictionary word using Levenshtein distance.
    Uses a sampled subset for speed.
    """
    return min(DICTIONARY_SAMPLE, key=lambda x: Levenshtein.distance(word, x))


# ---------------------------------------------------
# BACKOFF SEGMENTATION
# ---------------------------------------------------

def backoff_segment(word):
    """
    Implements prefix backoff segmentation
    Example:
    recordings -> recording + s
    """
    for i in range(len(word), 2, -1):
        prefix = word[:i]
        if prefix in ENGLISH_DICTIONARY:
            return {
                "status": "Partial",
                "correct_part": prefix,
                "wrong_part": word[i:],
                "split_index": i
            }

    return None


# ---------------------------------------------------
# SPELL CHECK API
# ---------------------------------------------------

@app.route('/check-spelling', methods=['POST'])
def check_spelling():

    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data.get('text', '')
    tokens = text.split()

    results = []

    for token in tokens:

        clean_word = clean_token(token)

        if not clean_word:
            continue

        # Default classification
        if clean_word in ENGLISH_DICTIONARY:
            status = "Correct"
            benchmark = clean_word
            partial_info = None

        else:

            # Backoff segmentation
            backoff = backoff_segment(clean_word)

            if backoff:
                status = "Partial"
                benchmark = backoff["correct_part"]
                partial_info = f"Correct: {backoff['correct_part']} | Wrong: {backoff['wrong_part']}"
            else:
                status = "Wrong"
                benchmark = find_benchmark(clean_word)
                partial_info = None

        distances = get_distances(clean_word, benchmark)

        results.append({
            "word": token,
            "clean_word": clean_word,
            "benchmark": benchmark,
            "status": status,
            "partial": partial_info,
            **distances
        })

    return jsonify(results)


# ---------------------------------------------------
# OCR IMAGE PROCESSING
# ---------------------------------------------------

@app.route('/process-image', methods=['POST'])
def process_image():

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    image = Image.open(file.stream)

    # Multilingual OCR
    extracted_text = pytesseract.image_to_string(
        image,
        lang='eng+hin+san+mar+tam+pan+jpn'
    )

    words_list = extracted_text.split()
    sentences = extracted_text.split('.')

    stats = {
        'word_count': len(words_list),
        'sentence_count': len([s for s in sentences if s.strip()]),
        'char_count': len(extracted_text),
        'avg_word_length': round(
            sum(len(w) for w in words_list) / len(words_list),
            2
        ) if words_list else 0
    }

    return jsonify({
        'text': extracted_text,
        'stats': stats
    })


# ---------------------------------------------------
# DOWNLOAD DOCX
# ---------------------------------------------------

@app.route('/download-docx', methods=['POST'])
def download_docx():

    data = request.json

    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data.get('text', '')

    document = Document()
    document.add_heading('OCR Extracted Text', 0)
    document.add_paragraph(text)

    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name='extracted_text.docx',
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )


# ---------------------------------------------------
# RUN SERVER
# ---------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5000)