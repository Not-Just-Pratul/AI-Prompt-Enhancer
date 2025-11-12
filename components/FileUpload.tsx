

import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FileIcon } from './icons/FileIcon';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface FileUploadProps {
  files: UploadedFile[];
  // Fix: Update type to be a React state dispatcher, which allows passing a function.
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

interface ProcessingFile {
    id: string;
    name: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 30;
const ACCEPTED_FILE_TYPES = "image/*,text/plain,.docx,.xlsx,.xls,.pdf";

// Helper to safely encode unicode strings to base64
const toBase64 = (str: string): string => {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        console.error("Base64 encoding failed", e);
        return "";
    }
}

const createTextPreview = (text: string, maxLength: number = 120): string => {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText.length <= maxLength) {
        return cleanedText;
    }
    return cleanedText.substring(0, maxLength).trim() + '...';
};

const processImageOrTextFile = (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve({ name: file.name, type: file.type, data: base64Data, preview: undefined });
        };
        reader.onerror = (error) => reject(error);
    });
};

const processDocxFile = async (file: File): Promise<UploadedFile | null> => {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    const base64data = toBase64(value);
    if (base64data) {
        return { 
            name: file.name, 
            type: 'text/plain', 
            data: base64data,
            preview: createTextPreview(value) 
        };
    }
    return null;
};

const processXlsxFile = async (file: File): Promise<UploadedFile | null> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_txt(worksheet) + '\n\n';
    });
    const base64data = toBase64(text);
    if (base64data) {
        return { 
            name: file.name, 
            type: 'text/plain', 
            data: base64data,
            preview: createTextPreview(text)
        };
    }
    return null;
};

const processPdfFile = async (file: File): Promise<UploadedFile | null> => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .filter(Boolean)
                .join(' ');
            text += pageText + '\n\n';
        }

        const base64data = toBase64(text);
        if (base64data) {
            return {
                name: file.name,
                type: 'text/plain',
                data: base64data,
                preview: createTextPreview(text)
            };
        }
        return null;
    } catch(error) {
        console.error("Error processing PDF file:", error);
        alert(`Could not extract text from PDF file ${file.name}. It might be an image-only PDF or corrupted.`);
        return null;
    }
};


const processFile = async (file: File): Promise<UploadedFile | null> => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (file.type.startsWith('image/') || file.type === 'text/plain') {
        return processImageOrTextFile(file);
    }

    if (extension === 'docx') {
        return processDocxFile(file);
    }

    if (extension === 'xlsx' || extension === 'xls') {
        return processXlsxFile(file);
    }

    if (extension === 'pdf') {
        return processPdfFile(file);
    }
    
    // Unsupported
    alert(`File type of '${file.name}' is not supported for content extraction. Please use images, .txt, .docx, .xlsx, or .pdf files.`);
    return null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    
    const filesToProcess: File[] = [];
    const newProcessingEntries: ProcessingFile[] = [];

    // Filter and collect valid files to process
    // Fix: Replaced for...of loop with a traditional for loop to fix TypeScript type inference issues with FileList.
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (files.length + processingFiles.length + filesToProcess.length >= MAX_FILES) {
            alert(`You can only upload a maximum of ${MAX_FILES} files.`);
            break;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            alert(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            continue;
        }

        const id = `${file.name}-${file.lastModified}-${file.size}`;
        // Check for duplicates before adding
        if (!files.some(f => f.name === file.name) && !processingFiles.some(p => p.id === id)) {
            filesToProcess.push(file);
            newProcessingEntries.push({ id, name: file.name });
        }
    }

    if (newProcessingEntries.length === 0) {
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }
    
    setProcessingFiles(prev => [...prev, ...newProcessingEntries]);

    // Process all files in parallel
    filesToProcess.forEach(async (file, index) => {
        const id = newProcessingEntries[index].id;
        try {
            const processed = await processFile(file);
            if (processed) {
                setFiles(prev => [...prev, processed]);
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert(`Could not process file ${file.name}.`);
        } finally {
            setProcessingFiles(prev => prev.filter(p => p.id !== id));
        }
    });
    
    // Clear input to allow re-uploading the same file
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-800 rounded-lg p-6 sm:p-8 md:p-10 text-center cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition duration-200"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept={ACCEPTED_FILE_TYPES}
        />
        <div className="flex flex-col items-center">
            <UploadIcon />
            <p className="mt-2 text-xs sm:text-sm text-gray-400">
            <span className="font-semibold text-gray-300">Click to upload</span> or drag and drop
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">Images, TXT, DOCX, XLSX, PDF (Max {MAX_FILE_SIZE_MB}MB)</p>
        </div>
      </div>
      {(files.length > 0 || processingFiles.length > 0) && (
        <div className="mt-4 sm:mt-6 space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-800/80 p-3 sm:p-4 rounded-lg"
            >
                <div className="flex items-center gap-3 overflow-hidden flex-grow min-w-0">
                    <div className="flex-shrink-0">
                        {file.type.startsWith('image/') && file.data ? (
                            <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                            <FileIcon />
                        )}
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <span className="text-sm text-gray-300 truncate block">{file.name}</span>
                        {file.preview && (
                             <p className="text-xs text-gray-400 truncate italic mt-1">
                                "{file.preview}"
                             </p>
                        )}
                    </div>
                </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-gray-200 p-1 rounded-full flex-shrink-0 ml-2"
                aria-label={`Remove ${file.name}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          {processingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-gray-800/60 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden flex-grow min-w-0">
                    <div className="flex-shrink-0"><FileIcon /></div>
                    <div className="flex-grow overflow-hidden">
                        <span className="text-sm text-gray-400 truncate block">{file.name}</span>
                        <p className="text-xs text-gray-500 italic mt-1">Processing...</p>
                    </div>
                </div>
                <div className="flex-shrink-0 ml-2" aria-label={`Processing ${file.name}`}>
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
