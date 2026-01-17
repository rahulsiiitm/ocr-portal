"use client";

import { useState, DragEvent, ChangeEvent } from 'react';
import axios from 'axios';

interface Stats {
  word_count: number;
  sentence_count: number;
  char_count: number;
  avg_word_length: number;
}

interface OCRResponse {
  text: string;
  stats: Stats;
}

export default function Home() {
  const [text, setText] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // --- Logic remains identical to before ---
  const processFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await axios.post<OCRResponse>('http://localhost:5000/process-image', formData);
      setText(res.data.text);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    }
    setLoading(false);
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.post('http://localhost:5000/download-docx', { text }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converted_text.docx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setText('');
    setStats(null);
  };

  return (
    <div className="min-h-screen">
      {/* minimalist header */}
      <header className="header">
        <h1 className="logo">OCR-Portal</h1>
      </header>

      <main className="main-container">

        {/* State 1: Upload (Visible only when no text) */}
        {!text && (
          <div className="upload-wrapper">
            <h2 className="title">Upload Document</h2>
            <p className="subtitle">
              Supports JPG, PNG in English, Hindi, Sanskrit, Marathi, Tamil, Punjabi & Japanese
            </p>

            <div
              className={`drop-zone ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" onChange={handleUpload} accept="image/*" />
              <label htmlFor="file-upload">
                <span className="icon">+</span>
                <span>Drag & Drop or Click to Browse</span>
              </label>
            </div>
            {loading && <p className="loading-text">Analyzing text...</p>}
          </div>
        )}

        {/* State 2: Results Workspace */}
        {text && stats && (
          <div className="workspace">

            {/* Left: Editor */}
            <div className="editor-section">
              <div className="toolbar">
                <span className="label">Extracted Text</span>
                <div className="actions">
                  <button onClick={handleReset} className="btn-text">Reset</button>
                  <button onClick={handleDownload} className="btn-primary">Download .DOCX</button>
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Right: Minimal Stats */}
            <div className="stats-sidebar">
              <div className="stat-item">
                <span className="stat-label">Words</span>
                <span className="stat-value">{stats.word_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sentences</span>
                <span className="stat-value">{stats.sentence_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Characters</span>
                <span className="stat-value">{stats.char_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Length</span>
                <span className="stat-value">{stats.avg_word_length}</span>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}