import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBooks, deleteBook } from '../utils/bookStorage';
import type { StoredBook } from '../types/book';
import { DIFFICULTY_LABELS, SUBJECT_LABELS, LANGUAGE_LABELS } from '../types/book';

const SHELF_SIZE = 4; // 한 선반에 놓이는 최대 책 수

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

  // 책을 선반 단위로 나눔
  const shelves: StoredBook[][] = [];
  for (let i = 0; i < books.length; i += SHELF_SIZE) {
    shelves.push(books.slice(i, i + SHELF_SIZE));
  }

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
            className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow hover:bg-orange-400 active:scale-95 transition-all"
          >
            + 새 책 만들기
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 타이틀 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">내 책장</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {books.length > 0 ? `총 ${books.length}권의 책` : '아직 만든 책이 없어요'}
          </p>
        </div>

        {books.length === 0 ? (
          /* 빈 책장 */
          <Shelf empty>
            <div className="flex flex-col items-center justify-center py-10 text-center w-full">
              <span className="text-5xl mb-3 opacity-40">📖</span>
              <p className="text-sm font-bold text-amber-600 mb-1">첫 번째 책을 만들어보세요!</p>
              <p className="text-xs text-amber-800 mb-4">나만의 이야기로 책을 출판할 수 있어요.</p>
              <button
                onClick={() => navigate('/create')}
                className="bg-orange-500 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-orange-400 transition-colors"
              >
                + 새 책 만들기
              </button>
            </div>
          </Shelf>
        ) : (
          <div className="space-y-2">
            {shelves.map((shelf, si) => (
              <Shelf key={si}>
                {shelf.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onRead={() => navigate(`/book/${book.id}`)}
                    onEdit={() => navigate(`/edit/${book.id}`)}
                    onDelete={() => setConfirmDelete(book.id)}
                  />
                ))}
                {/* 빈 슬롯으로 선반 채우기 */}
                {Array.from({ length: SHELF_SIZE - shelf.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1" />
                ))}
              </Shelf>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
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

/** 나무 선반 컴포넌트 */
function Shelf({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="relative">
      {/* 선반 위 공간 (책들) */}
      <div className={`flex gap-3 px-4 pt-4 pb-1 items-end min-h-[200px] ${empty ? 'justify-center' : ''}`}>
        {children}
      </div>
      {/* 선반 판자 */}
      <div
        className="w-full rounded"
        style={{
          height: 18,
          background: 'linear-gradient(180deg, #c8853a 0%, #a0622a 40%, #7a4a20 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
        }}
      />
      {/* 선반 하단 그림자 */}
      <div className="w-full h-2" style={{ background: 'rgba(0,0,0,0.25)' }} />
    </div>
  );
}

/** 책 카드 */
function BookCard({
  book,
  onRead,
  onEdit,
  onDelete,
}: {
  book: StoredBook;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cover = book.pages.find(p => p.imagePreview)?.imagePreview;
  const difficulty = DIFFICULTY_LABELS[book.meta.difficulty as keyof typeof DIFFICULTY_LABELS];
  const subject = SUBJECT_LABELS[book.meta.subject as keyof typeof SUBJECT_LABELS];
  const { flag } = LANGUAGE_LABELS[book.language];

  // 책마다 고유 색상 (제목 해시 기반)
  const hue = [...book.meta.title].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const spineColor = `hsl(${hue}, 55%, 45%)`;

  return (
    <div className="flex-1 flex flex-col" style={{ maxWidth: `calc(25% - 9px)`, minWidth: 0 }}>
      {/* 책 표지 카드 */}
      <div
        className="relative rounded-t-sm cursor-pointer group"
        style={{
          background: cover ? 'transparent' : spineColor,
          boxShadow: '3px 0 8px rgba(0,0,0,0.5)',
          aspectRatio: '2/3',
        }}
        onClick={onRead}
      >
        {cover ? (
          <img src={cover} alt={book.meta.title} className="w-full h-full object-cover rounded-t-sm" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded-t-sm"
            style={{ background: spineColor }}>
            <span className="text-white text-xs font-bold text-center leading-tight line-clamp-4 [writing-mode:vertical-rl]">
              {book.meta.title}
            </span>
          </div>
        )}
        {/* 언어 배지 */}
        <span className="absolute top-1 right-1 text-sm leading-none">{flag}</span>
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-t-sm transition-all" />
      </div>

      {/* 책 정보 + 버튼 (선반 위 말풍선처럼) */}
      <div className="mt-1 px-0.5">
        <p className="text-amber-100 text-xs font-bold line-clamp-1 leading-tight">{book.meta.title}</p>
        <div className="flex flex-wrap gap-0.5 mt-0.5 mb-1.5">
          {subject && <span className="text-amber-400 text-[10px]">{subject}</span>}
          {difficulty && <span className="text-amber-600 text-[10px]">· {difficulty}</span>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onRead}
            className="flex-1 bg-orange-500 text-white text-[10px] font-bold py-1 rounded-md hover:bg-orange-400 transition-colors"
          >
            읽기
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-amber-700 text-amber-100 text-[10px] font-bold py-1 rounded-md hover:bg-amber-600 transition-colors"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="px-1.5 py-1 rounded-md bg-transparent border border-amber-800 text-amber-600 text-[10px] hover:text-red-400 hover:border-red-400 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
