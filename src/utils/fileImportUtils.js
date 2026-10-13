/**
 * Utility functions for importing Image and PDF files into DeskFlow Notes
 */

// Dynamically load PDF.js from cdnjs if not already present
let pdfjsGlobal = null;

async function getPdfJs() {
  if (pdfjsGlobal) return pdfjsGlobal;
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    pdfjsGlobal = window.pdfjsLib;
    return pdfjsGlobal;
  }

  try {
    // Try node_modules import if available
    const pdfjs = await import('pdfjs-dist');
    pdfjsGlobal = pdfjs;
    if (pdfjsGlobal.GlobalWorkerOptions) {
      pdfjsGlobal.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
    return pdfjsGlobal;
  } catch (err) {
    // Fallback: Load PDF.js from CDN script tag dynamically
    return new Promise((resolve, reject) => {
      if (document.getElementById('pdfjs-cdn-script')) {
        const check = setInterval(() => {
          if (window.pdfjsLib) {
            clearInterval(check);
            pdfjsGlobal = window.pdfjsLib;
            resolve(pdfjsGlobal);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'pdfjs-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          pdfjsGlobal = window.pdfjsLib;
          resolve(pdfjsGlobal);
        } else {
          reject(new Error('PDF.js failed to load from CDN'));
        }
      };
      script.onerror = () => reject(new Error('Could not load PDF renderer script'));
      document.head.appendChild(script);
    });
  }
}

/**
 * Reads an image File object and returns a Note Page object
 */
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          timestamp: Date.now(),
          strokes: [],
          redoStack: [],
          sourceName: file.name,
        });
      };
      img.onerror = () => {
        resolve({
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          width: 1920,
          height: 1080,
          timestamp: Date.now(),
          strokes: [],
          redoStack: [],
          sourceName: file.name,
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a PDF File object and renders each page into Note Page objects
 */
export async function readPdfFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await getPdfJs();

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pageObjects = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    // Render at scale 2.0 for high resolution rendering
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');

    pageObjects.push({
      id: `page-${Date.now()}-p${i}-${Math.random().toString(36).slice(2, 7)}`,
      dataUrl,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      timestamp: Date.now(),
      strokes: [],
      redoStack: [],
      sourceName: `${file.name} (Pg ${i}/${numPages})`,
    });
  }

  return pageObjects;
}

/**
 * Main import handler: processes a list of File objects (Images or PDFs)
 */
export async function processImportedFiles(files) {
  const newPages = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);

    if (isPdf) {
      const pdfPages = await readPdfFile(file);
      newPages.push(...pdfPages);
    } else if (isImage) {
      const imgPage = await readImageFile(file);
      newPages.push(imgPage);
    } else {
      // Fallback: try reading as image data URL
      try {
        const fallbackPage = await readImageFile(file);
        newPages.push(fallbackPage);
      } catch (e) {
        console.warn('Unsupported file format:', file.name);
      }
    }
  }

  return newPages;
}
