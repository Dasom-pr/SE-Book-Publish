import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBooks, deleteBook } from '../utils/bookStorage';
import type { StoredBook } from '../types/book';
import { DIFFICULTY_LABELS, SUBJECT_LABELS, LANGUAGE_LABELS } from '../types/book';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<StoredBook[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setBooks(getAllBooks());
  }, []);

  const handleDelete = (id: string) => {
    deleteBook(id);
    setBooks(getAllBooks());
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-orange-700 text-lg">Enuma Book Publish</span>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow hover:bg-orange-600 active:scale-95 transition-all"
          >
            + 새 책 만들기
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 타이틀 */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">내 책장</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {books.length > 0 ? `총 ${books.length}권의 책` : '아직 만든 책이 없어요'}
          </p>
        </div>

        {books.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-7xl mb-4">📖</div>
            <p className="text-lg font-bold text-gray-500 mb-2">첫 번째 책을 만들어보세요!</p>
            <p className="text-sm text-gray-400 mb-6">나만의 이야기로 책을 출판할 수 있어요.</p>
            <button
              onClick={() => navigate('/create')}
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:bg-orange-600 transition-colors"
            >
              + 새 책 만들기
            </button>
          </div>
        ) : (
          /* 책 그리드 */
          <div className="grid grid-cols-2 gap-4">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onRead={() => navigate(`/book/${book.id}`)}
                onDelete={() => setConfirmDelete(book.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <p className="font-bold text-gray-800 text-center mb-1">책을 삭제할까요?</p>
            <p className="text-sm text-gray-400 text-center mb-5">삭제하면 복구할 수 없어요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookCard({
  book,
  onRead,
  onDelete,
}: {
  book: StoredBook;
  onRead: () => void;
  onDelete: () => void;
}) {
  const cover = book.pages.find(p => p.imagePreview)?.imagePreview;
  const difficulty = DIFFICULTY_LABELS[book.meta.difficulty as keyof typeof DIFFICULTY_LABELS];
  const subject = SUBJECT_LABELS[book.meta.subject as keyof typeof SUBJECT_LABELS];
  const { flag } = LANGUAGE_LABELS[book.language];
  const createdDate = new Date(book.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* 표지 이미지 */}
      <div
        className="relative cursor-pointer"
        style={{ paddingTop: '68%' }}
        onClick={onRead}
      >
        {cover ? (
          <img
            src={cover}
            alt={book.meta.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-200 flex flex-col items-center justify-center p-3">
            <span className="text-4xl mb-1">📖</span>
            <span className="text-xs text-orange-700 font-semibold text-center leading-tight line-clamp-2">
              {book.meta.title}
            </span>
          </div>
        )}
        {/* 언어 배지 */}
        <span className="absolute top-2 right-2 text-base">{flag}</span>
      </div>

      {/* 책 정보 */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3
          className="font-bold text-gray-800 text-sm line-clamp-1 cursor-pointer hover:text-orange-600"
          onClick={onRead}
        >
          {book.meta.title}
        </h3>
        {book.meta.writtenBy && (
          <p className="text-xs text-gray-400 line-clamp-1">{book.meta.writtenBy}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {subject && (
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{subject}</span>
          )}
          {difficulty && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{difficulty}</span>
          )}
        </div>
        <p className="text-xs text-gray-300 mt-0.5">{createdDate} · {book.pages.length}페이지</p>

        {/* 버튼 */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onRead}
            className="flex-1 bg-orange-500 text-white text-xs font-bold py-2 rounded-xl hover:bg-orange-600 transition-colors"
          >
            읽기 📖
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 text-xs hover:text-red-400 hover:border-red-200 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
