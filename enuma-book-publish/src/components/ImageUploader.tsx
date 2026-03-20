import { useRef, useState } from 'react';

interface ImageUploaderProps {
  preview: string;
  onUpload: (file: File, preview: string) => void;
  bookTitle?: string;
}

export default function ImageUploader({ preview, onUpload, bookTitle }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onUpload(file, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAutoGenerate = () => {
    showToast(`"${bookTitle || '책'}" 주제에 맞는 이미지 자동생성은 AI 연동 후 지원됩니다.`);
  };

  return (
    <div className="relative">
      {toast && (
        <div className="absolute -top-10 left-0 right-0 z-10 bg-orange-100 border border-orange-300 text-orange-700 text-xs rounded-lg px-3 py-2 text-center">
          {toast}
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors
          ${dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300 bg-gray-50'}`}
        style={{ minHeight: 140 }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="page" className="w-full h-full object-cover" style={{ maxHeight: 200 }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-6 text-gray-400">
            <span className="text-3xl">🖼️</span>
            <span className="text-sm">이미지를 끌어다 놓거나 클릭하여 업로드</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); handleAutoGenerate(); }}
        className="mt-2 w-full text-xs text-orange-500 border border-orange-200 rounded-lg py-1.5 hover:bg-orange-50 transition-colors"
      >
        ✨ 어울리는 이미지 자동생성
      </button>
    </div>
  );
}
