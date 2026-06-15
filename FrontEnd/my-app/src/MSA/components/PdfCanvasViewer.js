// src/MSA/components/PdfCanvasViewer.js
// Renders PDF pages as canvas elements so fields can overlay properly (no z-index issues)
// Loads PDF.js from CDN - no npm install needed

import React, { useRef, useEffect, useState } from 'react';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let loadPromise = null;

function ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS_CDN;
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN;
      resolve(window.pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return loadPromise;
}

export default function PdfCanvasViewer({ url, width = 850, onLoaded }) {
  const ref = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        setStatus('loading');
        const lib = await ensurePdfJs();
        if (cancelled) return;

        const pdf = await lib.getDocument(url).promise;
        if (cancelled) return;

        const container = ref.current;
        if (!container) return;
        container.innerHTML = '';

        let totalH = 0;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = width / page.getViewport({ scale: 1 }).width;
          const vp = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.display = 'block';
          canvas.style.width = width + 'px';
          canvas.style.height = Math.round(vp.height) + 'px';
          container.appendChild(canvas);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
          totalH += Math.round(vp.height);
          if (cancelled) return;
        }

        setStatus('ready');
        if (onLoaded) onLoaded({ pages: pdf.numPages, height: totalH });
      } catch (err) {
        console.error('PDF render error:', err);
        if (!cancelled) setStatus('fallback');
      }
    })();

    return () => { cancelled = true; };
  }, [url, width, onLoaded]);

  // Fallback to iframe if PDF.js fails (for non-PDF files)
  if (status === 'fallback') {
    return (
      <iframe
        src={url}
        style={{ width, minHeight: 1100, border: 'none', display: 'block' }}
        title="Document"
      />
    );
  }

  return (
    <div>
      {status === 'loading' && (
        <div style={{
          padding: 60, textAlign: 'center', color: '#6b7280',
          fontSize: 14, background: 'white'
        }}>
          ⏳ Rendering document pages...
        </div>
      )}
      <div ref={ref} style={{ width, background: 'white' }} />
    </div>
  );
}
