# OCR Portal

A minimalist and responsive Optical Character Recognition (OCR) web portal that extracts text from images across multiple languages — including Indian regional languages — with export, analytics, and a clean greyscale UI.

## Features

- **Multi-Language OCR**
  - Supports: English, Hindi, Sanskrit, Marathi, Tamil, Punjabi & Japanese
- **Drag & Drop Upload**
  - Intuitive and modern file upload experience
- **Real-time Stats**
  - Computes:
    - Word Count
    - Sentence Count
    - Character Count
    - Avg. Word Length
- **Export to DOCX**
  - Download extracted text as a Microsoft Word document
- **Responsive UI**
  - Works smoothly on both desktop & mobile
- **Minimal UI**
  - Clean greyscale theme without external UI libraries

## Tech Stack

### Frontend
- Next.js 14/15 (App Router)
- TypeScript
- CSS Modules / Standard CSS
- Axios

### Backend
- Python (Flask)
- Tesseract OCR
- Pytesseract
- Pillow (Image Handling)
- python-docx (DOCX Generation)

## Prerequisites

Ensure the following are installed:

1. Node.js (v18+)
2. Python (v3.9+)
3. Tesseract OCR Engine

## Installing Tesseract (Windows)

1. Download installer (UB Mannheim builds recommended)
2. During installation, enable additional language data:
   > Hindi, Sanskrit, Tamil, Punjabi, Marathi, Japanese
3. Default path is typically:

```
C:\Program Files\Tesseract-OCR
```

## Installation & Setup

### 1. Backend Setup (Flask)

```bash
cd backend
pip install flask flask-cors pytesseract pillow python-docx
```

Configure `app.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

Run backend:

```bash
python app.py
```

Backend runs at:

```
http://127.0.0.1:5000
```

### 2. Frontend Setup (Next.js)

```bash
npm install
# or
yarn install
```

Start dev server:

```bash
npm run dev
```

Frontend opens at:

```
http://localhost:3000
```

## Project Structure

```
ocr-portal/
├── backend/
│   └── app.py                # Flask OCR API
├── frontend/ or src/
│   ├── app/
│   │   ├── page.tsx          # Main UI
│   │   ├── layout.tsx        # Layout Handler
│   │   ├── globals.css       # Global Styles
│   │   └── page.module.css   # Component Styles
│   └── hooks/
│       └── useOCR.ts         # Custom OCR Hook
├── public/
└── package.json
```

## Troubleshooting

| Issue | Possible Fix |
|---|---|
| Network Error / Upload Fails | Ensure Flask backend is running & language data exists |
| TesseractNotFoundError | Check `tesseract_cmd` path in `app.py` |
| Language Crash | Test with `lang='eng'` to verify base OCR works |
| No DOCX Output | Ensure `python-docx` is installed |

## Author

**Rahul (B.Tech CSE, 2023-2027)**  
IIIT Manipur
