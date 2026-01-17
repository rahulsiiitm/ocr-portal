// src/hooks/useOCR.ts
import { useState } from 'react';
import axios from 'axios';

// 1. Define Types strictly
export interface Stats {
  word_count: number;
  sentence_count: number;
  char_count: number;
  avg_word_length: number;
}

export interface OCRState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  text: string | null;
  stats: Stats | null;
  errorMessage: string | null;
}

// 2. The Hook
export function useOCR() {
  const [state, setState] = useState<OCRState>({
    status: 'idle',
    text: null,
    stats: null,
    errorMessage: null,
  });

  const processFile = async (file: File) => {
    // Reset state to loading
    setState(prev => ({ ...prev, status: 'uploading', errorMessage: null }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/process-image', formData);
      
      // Update success state
      setState({
        status: 'success',
        text: res.data.text,
        stats: res.data.stats,
        errorMessage: null
      });
    } catch (err) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: 'Failed to process image. Is the backend running?' 
      }));
    }
  };

  const reset = () => {
    setState({
      status: 'idle',
      text: null,
      stats: null,
      errorMessage: null
    });
  };

  return { state, processFile, reset };
}