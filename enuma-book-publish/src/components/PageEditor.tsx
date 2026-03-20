import { useState } from 'react';
import ImageUploader from './ImageUploader';
import type { BookPage, Language } from '../types/book';
import { LANGUAGE_LABELS } from '../types/book';
import { translateText } from '../utils/translate';

interface PageEditorProps {
  page: BookPage;
  selected: boolean;
  bookTitle: string;
  language: Language;
  onSelect: (id: string, checked: boolean) => void;
  onUpdate: (id: string, updates: Partial<BookPage>) => void;
  onDelete: (id: string) => void;
}

export default function PageEditor({ page, selected, bookTitle, language, onSelect, onUpdate, onDelete }: PageEditorProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!page.text.trim()) return;
    setTranslating(true);
    try {
      const result = await translateText(page.text, language);
      setPreview(result);
    } catch {
      setPreview('번역 실패. 다시 시도해주세요.');
    } finally {
      setTranslating(false);
    }
  };

  const { label: langLabel, flag } = LANGUAGE_LABELS[language];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all p-4
      ${selected ? 'border-orange-400' : 'border-transparent'}`}>

      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(page.id, e.target.checked)}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            Page {page.pageNumber}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(page.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
          title="이 페이지 삭제"
        >
          ✕
        </button>
      </div>

      {/* 이미지 업로더 */}
      <ImageUploader
        preview={page.imagePreview}
        bookTitle={bookTitle}
        onUpload={(file, preview) => onUpdate(page.id, { imageFile: file, imagePreview: preview })}
      />

      {/* 텍스트 입력 */}
      <textarea
        placeholder={`Page ${page.pageNumber} 내용을 입력하세요...`}
        value={page.text}
        onChange={e => { onUpdate(page.id, { text: e.target.value }); setPreview(null); }}
        rows={3}
        className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* 번역 미리보기 버튼 */}
      <button
        type="button"
        onClick={handleTranslate}
        disabled={translating || !page.text.trim()}
        className={`mt-2 text-xs px-3 py-1.5 rounded-full border font-medium transition-all
          ${translating
            ? 'border-blue-200 text-blue-400 animate-pulse cursor-wait'
            : page.text.trim()
              ? 'border-blue-300 text-blue-600 hover:bg-blue-50'
              : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
      >
        {translating ? '번역 중...' : `🌐 ${flag} ${langLabel}로 미리보기`}
      </button>

      {/* 번역 결과 */}
      {preview !== null && (
        <div className="mt-2 px-3 py-2.5 rounded-xl text-sm leading-relaxed"
          style={{ background: '#f0f7ff', color: '#1e4d80', borderLeft: '3px solid #93c5fd' }}>
          <p className="text-[10px] text-blue-400 mb-1 font-semibold">{flag} {langLabel} 번역 미리보기</p>
          <p className="whitespace-pre-wrap">{preview}</p>
        </div>
      )}
    </div>
  );
}
