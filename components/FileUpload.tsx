import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface FileUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

interface ProcessingFile { id: string; name: string; }

const MAX_FILES = 5;
const MAX_MB = 30;
const ACCEPT = "image/*,text/plain,.docx,.xlsx,.xls,.pdf";

const toBase64 = (str: string) => {
  try { return btoa(unescape(encodeURIComponent(str))); }
  catch { return ''; }
};

const mkPreview = (text: string, max = 100) => {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max).trim() + '…';
};

const readImageOrText = (file: File): Promise<UploadedFile> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res({ name: file.name, type: file.type, data: (r.result as string).split(',')[1] });
    r.onerror = rej;
  });

const readDocx = async (file: File): Promise<UploadedFile | null> => {
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const data = toBase64(value);
  return data ? { name: file.name, type: 'text/plain', data, preview: mkPreview(value) } : null;
};

const readXlsx = async (file: File): Promise<UploadedFile | null> => {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const text = wb.SheetNames.map(n => XLSX.utils.sheet_to_txt(wb.Sheets[n])).join('\n\n');
  const data = toBase64(text);
  return data ? { name: file.name, type: 'text/plain', data, preview: mkPreview(text) } : null;
};

const readPdf = async (file: File): Promise<UploadedFile | null> => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((x: any) => x.str).filter(Boolean).join(' ') + '\n\n';
    }
    const data = toBase64(text);
    return data ? { name: file.name, type: 'text/plain', data, preview: mkPreview(text) } : null;
  } catch {
    alert(`Could not extract text from ${file.name}.`);
    return null;
  }
};

const processFile = (file: File): Promise<UploadedFile | null> => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (file.type.startsWith('image/') || file.type === 'text/plain') return readImageOrText(file);
  if (ext === 'docx') return readDocx(file);
  if (ext === 'xlsx' || ext === 'xls') return readXlsx(file);
  if (ext === 'pdf') return readPdf(file);
  alert(`Unsupported file type: ${file.name}`);
  return Promise.resolve(null);
};

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const toProcess: File[] = [];
    const entries: ProcessingFile[] = [];

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (files.length + processing.length + toProcess.length >= MAX_FILES) {
        alert(`Max ${MAX_FILES} files.`); break;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`${file.name} exceeds ${MAX_MB}MB.`); continue;
      }
      const id = `${file.name}-${file.lastModified}-${file.size}`;
      if (!files.some(f => f.name === file.name) && !processing.some(p => p.id === id)) {
        toProcess.push(file);
        entries.push({ id, name: file.name });
      }
    }

    if (!entries.length) { if (inputRef.current) inputRef.current.value = ''; return; }
    setProcessing(prev => [...prev, ...entries]);

    toProcess.forEach(async (file, idx) => {
      const id = entries[idx].id;
      try {
        const result = await processFile(file);
        if (result) setFiles(prev => [...prev, result]);
      } catch { alert(`Could not process ${file.name}.`); }
      finally { setProcessing(prev => prev.filter(p => p.id !== id)); }
    });

    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-white/[0.08] hover:border-white/[0.16] rounded-lg p-5 text-center cursor-pointer hover:bg-white/[0.02] transition-all duration-200"
      >
        <input ref={inputRef} type="file" className="hidden" multiple accept={ACCEPT} onChange={handleChange} />
        <svg className="w-5 h-5 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-xs text-gray-500"><span className="text-gray-300">Click to upload</span> or drag & drop</p>
        <p className="text-[11px] text-gray-600 mt-0.5">Images, TXT, DOCX, XLSX, PDF · Max {MAX_MB}MB</p>
      </div>

      {(files.length > 0 || processing.length > 0) && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] p-2.5 rounded-lg">
              <div className="flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="h-7 w-7 rounded object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded bg-white/[0.05] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs text-gray-300 truncate">{file.name}</p>
                {file.preview && <p className="text-[11px] text-gray-600 truncate mt-0.5">{file.preview}</p>}
              </div>
              <button
                onClick={() => setFiles(f => f.filter((_, j) => j !== i))}
                className="flex-shrink-0 p-1 text-gray-600 hover:text-gray-300 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {processing.map(f => (
            <div key={f.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg">
              <div className="h-7 w-7 rounded bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <svg className="animate-spin w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs text-gray-500 truncate">{f.name}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Processing…</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
