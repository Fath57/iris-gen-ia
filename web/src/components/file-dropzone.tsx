import { UploadCloud } from "lucide-react";
import { useState, useRef } from "react";

interface FileDropzoneProps {
  onFileUpload: (file: File) => void;
}

export function FileDropzone({ onFileUpload }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      // Reset so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Interrogez vos documents
            </span>
          </h1>
          <p className="text-white/40">
            Importez un PDF, Word ou TXT pour commencer l'analyse.
          </p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-violet-500 bg-violet-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-violet-500/20" : "bg-white/5"}`}>
              <UploadCloud className={`w-8 h-8 ${isDragging ? "text-violet-400" : "text-white/40"}`} />
            </div>
            <p className="mb-2 text-sm text-white/60">
              <span className="font-semibold text-violet-400">Cliquez pour importer</span> ou glissez-déposez
            </p>
            <p className="text-xs text-white/30">PDF, DOCX, TXT (Max 50MB)</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </div>
  );
}