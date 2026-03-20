import ImageUploader from './ImageUploader';
import type { BookPage } from '../types/book';

interface PageEditorProps {
  page: BookPage;
  selected: boolean;
  bookTitle: string;
  onSelect: (id: string, checked: boolean) => void;
  onUpdate: (id: string, updates: Partial<BookPage>) => void;
  onDelete: (id: string) => void;
}

export default function PageEditor({ page, selected, bookTitle, onSelect, onUpdate, onDelete }: PageEditorProps) {
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
        onChange={e => onUpdate(page.id, { text: e.target.value })}
        rows={3}
        className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </div>
  );
}
