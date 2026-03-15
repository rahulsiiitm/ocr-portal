"use client";

import { useState, DragEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useOCR } from './hooks/useOCR';

export default function Home() {
  const { state, processFile, reset } = useOCR();
  const [dragActive, setDragActive] = useState(false);
  const [spellResults, setSpellResults] = useState<any[] | null>(null);

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
      const res = await axios.post('http://localhost:5000/download-docx', { text: state.text }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'extracted_text.docx');
      link.click();
    } catch (err) { console.error(err); }
  };

  const checkSpelling = async () => {
    if (!state.text) return;
    try {
      const res = await axios.post('http://localhost:5000/check-spelling', { text: state.text });
      setSpellResults(res.data);
    } catch (err) { console.error(err); }
  };

  const resetAll = () => {
    reset();
    setSpellResults(null);
  };

  return (
    <div className="min-h-screen">
      <header className="header">
        <h1 className="logo">OCR Portal</h1>
      </header>

      <main className="main-container">
        {/* Upload State */}
        {(state.status === 'idle' || state.status === 'error') && (
          <div className="upload-wrapper">
            <h2 className="title">Upload Document</h2>
            <p className="subtitle">Supports Hindi, Sanskrit & English OCR with Spell-Check</p>
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
            {state.status === 'error' && <p className="text-red">{state.errorMessage}</p>}
          </div>
        )}

        {/* Loading State */}
        {state.status === 'uploading' && (
          <div className="processing-container">
            <div className="spinner"></div>
            <h3 className="processing-title">Analyzing Document...</h3>
          </div>
        )}

        {/* Results Workspace */}
        {state.status === 'success' && state.text && state.stats && (
          <div className="workspace-layout">
            <div className="workspace">
              <div className="editor-section">
                <div className="toolbar">
                  <span className="label">Extracted Text</span>
                  <div className="actions">
                    <button onClick={resetAll} className="btn-text">Reset</button>
                    <button onClick={handleDownload} className="btn-primary">Download .DOCX</button>
                    <button onClick={checkSpelling} className="btn-secondary">Check Spelling</button>
                  </div>
                </div>
                <textarea value={state.text} readOnly spellCheck={false} />
              </div>

              <div className="stats-sidebar">
                <h3 className="label">Statistics</h3>
                <div className="stat-item"><span>Words</span><strong>{state.stats.word_count}</strong></div>
                <div className="stat-item"><span>Sentences</span><strong>{state.stats.sentence_count}</strong></div>
                <div className="stat-item"><span>Characters</span><strong>{state.stats.char_count}</strong></div>
                <div className="stat-item"><span>Avg Length</span><strong>{state.stats.avg_word_length}</strong></div>
              </div>
            </div>

            {/* Spell Results Table */}
            {spellResults && (
              <div className="spell-check-results">
                <h3 className="label" style={{marginBottom: '20px'}}>Spell Checker Analysis</h3>
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
                        <td style={{fontWeight: '500'}}>{res.word}</td>
                        <td>{res.hamming}</td>
                        <td>{res.lcs}</td>
                        <td>{res.levenshtein}</td>
                        <td>{res.jaro}</td>
                        <td>{res.benchmark}</td>
                        <td className={res.status === "Correct" ? "text-green" : res.status === "Partial" ? "text-amber" : "text-red"}>
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