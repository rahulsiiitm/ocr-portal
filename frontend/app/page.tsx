// src/app/page.tsx
"use client";

import { useState, DragEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useOCR } from './hooks/useOCR'

export default function Home() {

  const { state, processFile, reset } = useOCR();

  const [dragActive, setDragActive] = useState(false);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleDownload = async () => {
    if (!state.text) return;
    try {
      const response = await axios.post('http://localhost:5000/download-docx', { text: state.text }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converted_text.docx');
      document.body.appendChild(link);
      link.click();
    } catch (err) { console.error(err); }
  };

  const [spellResults, setSpellResults] = useState<any[] | null>(null);

  const handleCheckSpelling = async () => {
    try {
      const res = await axios.post('http://localhost:5000/check-spelling', { text: state.text });
      setSpellResults(res.data);
    } catch (err) {
      console.error("Spell check failed", err);
    }
  };

  const resetWithSpellCheck = () => {
  reset();            // Clears OCR state
  setSpellResults(null); // Clears the table
};

  return (
    <div className="min-h-screen">
      <header className="header">
        <h1 className="logo">OCR Portal</h1>
      </header>

      <main className="main-container">

        {/* VIEW 1: Upload (Shows when Idle OR Error) */}
        {(state.status === 'idle' || state.status === 'error') && (
          <div className="upload-wrapper">
            <h2 className="title">Upload Document</h2>
            <p className="subtitle">Supports Hindi, Sanskrit, Japanese & English</p>

            <div
              className={`drop-zone ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              <input type="file" id="file-upload" onChange={handleUpload} accept="image/*" />
              <label htmlFor="file-upload">
                <span className="icon">+</span>
                <span>Drag & Drop or Click to Browse</span>
              </label>
            </div>

            {state.status === 'error' && <p style={{ color: 'red', marginTop: '10px' }}>{state.errorMessage}</p>}
          </div>
        )}

        {/* VIEW 2: Loading */}
        {state.status === 'uploading' && (
          <div className="processing-container">
            <div className="spinner"></div>
            <h3 className="processing-title">Analyzing Document...</h3>
            <p className="processing-subtitle">Extracting text and calculating statistics</p>
          </div>
        )}

        {/* VIEW 3: Success Workspace */}
        {state.status === 'success' && state.text && state.stats && (
          <div className="workspace-layout">
            <div className="workspace">
              <div className="editor-section">
                <div className="toolbar">
                  <span className="label">Extracted Text</span>
                  <div className="actions">
                    <button onClick={resetWithSpellCheck} className="btn-text">Reset</button>
                    <button onClick={handleDownload} className="btn-primary">Download .DOCX</button>
                    <button onClick={handleCheckSpelling} className="btn-secondary">Check Spelling</button>
                  </div>
                </div>
                <textarea
                  value={state.text}
                  readOnly
                  spellCheck={false}
                />
              </div>

              <div className="stats-sidebar">
                <div className="stat-item">
                  <span className="stat-label">Words</span>
                  <span className="stat-value">{state.stats.word_count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sentences</span>
                  <span className="stat-value">{state.stats.sentence_count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Characters</span>
                  <span className="stat-value">{state.stats.char_count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Length</span>
                  <span className="stat-value">{state.stats.avg_word_length}</span>
                </div>
              </div>
            </div>

            {spellResults && (
              <div className="spell-check-results">
                <table className="spell-table">
                  <thead>
                    <tr>
                      <th>Word</th>
                      <th>Hamming</th>
                      <th>LCS</th>
                      <th>Levenshtein</th>
                      <th>Jaro</th>
                      <th>Benchmark</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spellResults.map((res, i) => (
                      <tr key={i}>
                        <td>{res.word}</td>
                        <td>{res.hamming}</td>
                        <td>{res.lcs}</td>
                        <td>{res.levenshtein}</td>
                        <td>{res.jaro}</td>
                        <td>{res.benchmark}</td>
                        <td className={res.status === "Correct" ? "text-green" : "text-red"}>
                          {res.status}
                          {res.partial && <div className="partial-hint">{res.partial}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}