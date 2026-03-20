import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook } from '../utils/bookStorage';
import type { StoredBook } from '../types/book';
import { DIFFICULTY_LABELS, LANGUAGE_LABELS } from '../types/book';

export default function BookViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<StoredBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 0 = 표지
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (id) setBook(getBook(id));
  }, [id]);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-gray-400 mb-4">책을 찾을 수 없어요.</p>
          <button onClick={() => navigate('/')} className="text-orange-500 font-bold">← 책장으로</button>
        </div>
      </div>
    );
  }

  const totalPages = book.pages.length;
  const isCover = currentPage === 0;
  const page = isCover ? null : book.pages[currentPage - 1];

  const goNext = () => { window.speechSynthesis.cancel(); setSpeaking(false); setCurrentPage(p => Math.min(p + 1, totalPages)); };
  const goPrev = () => { window.speechSynthesis.cancel(); setSpeaking(false); setCurrentPage(p => Math.max(p - 1, 0)); };

  const readAloud = () => {
    if (!page?.text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(page.text);
    const voices = window.speechSynthesis.getVoices();
    const langCode = book.language === 'ko' ? 'ko' : book.language === 'id' ? 'id' : 'en';

    if (book.voiceGender === 'child') { utter.pitch = 1.6; utter.rate = 1.05; }
    else if (book.voiceGender === 'male') { utter.pitch = 0.8; utter.rate = 0.95; }
    else { utter.pitch = 1.1; utter.rate = 1.0; }

    const v = voices.find(v => v.lang.startsWith(langCode));
    if (v) utter.voice = v;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const stopReading = () => { window.speechSynthesis.cancel(); setSpeaking(false); };

  const { flag, label: langLabel } = LANGUAGE_LABELS[book.language];
  const difficulty = DIFFICULTY_LABELS[book.meta.difficulty as keyof typeof DIFFICULTY_LABELS] ?? '';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 상단 바 */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => { window.speechSynthesis.cancel(); navigate('/'); }}
          className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
        >
          ← 책장
        </button>
        <span className="text-white font-bold text-sm truncate max-w-[200px]">{book.meta.title}</span>
        <span className="text-gray-400 text-xs">
          {isCover ? '표지' : `${currentPage} / ${totalPages}`}
        </span>
      </div>

      {/* 책 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">

          {isCover ? (
            /* 표지 */
            <CoverPage book={book} flag={flag} langLabel={langLabel} difficulty={difficulty} onStart={goNext} />
          ) : (
            /* 내용 페이지 */
            <ContentPage
              page={page!}
              speaking={speaking}
              onReadAloud={readAloud}
              onStop={stopReading}
            />
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all
            ${currentPage === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
        >
          ‹ 이전
        </button>

        {/* 페이지 점 인디케이터 */}
        <div className="flex gap-1.5 overflow-x-auto max-w-[180px] py-1">
          {Array.from({ length: totalPages + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); setCurrentPage(i); }}
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-all
                ${i === currentPage ? 'bg-orange-400 w-4' : 'bg-gray-600 hover:bg-gray-400'}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentPage === totalPages}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all
            ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-400'}`}
        >
          다음 ›
        </button>
      </div>
    </div>
  );
}

function CoverPage({ book, flag, langLabel, difficulty, onStart }: {
  book: StoredBook;
  flag: string;
  langLabel: string;
  difficulty: string;
  onStart: () => void;
}) {
  const cover = book.pages.find(p => p.imagePreview)?.imagePreview;

  return (
    <div className="flex flex-col">
      {/* 커버 이미지 */}
      <div className="relative bg-gradient-to-br from-orange-300 to-amber-400" style={{ paddingTop: '60%' }}>
        {cover ? (
          <img src={cover} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl">📖</span>
          </div>
        )}
        <span className="absolute top-3 right-3 text-2xl">{flag}</span>
      </div>

      {/* 책 정보 */}
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{book.meta.title}</h1>
        {book.meta.writtenBy && (
          <p className="text-sm text-gray-500 mb-3">글: {book.meta.writtenBy}</p>
        )}
        {book.meta.illustratedBy && (
          <p className="text-sm text-gray-400 mb-3">그림: {book.meta.illustratedBy}</p>
        )}
        <div className="flex justify-center gap-2 mb-6">
          {difficulty && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">{difficulty}</span>
          )}
          <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">{flag} {langLabel}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{book.pages.length}페이지</span>
        </div>
        <button
          onClick={onStart}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded-2xl text-base hover:bg-orange-600 transition-colors shadow-md"
        >
          읽기 시작 📖
        </button>
      </div>
    </div>
  );
}

function ContentPage({ page, speaking, onReadAloud, onStop }: {
  page: { pageNumber: number; text: string; imagePreview: string };
  speaking: boolean;
  onReadAloud: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-col">
      {/* 페이지 이미지 */}
      {page.imagePreview ? (
        <img
          src={page.imagePreview}
          alt={`page ${page.pageNumber}`}
          className="w-full object-cover"
          style={{ maxHeight: 280 }}
        />
      ) : (
        <div
          className="w-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center"
          style={{ height: 180 }}
        >
          <span className="text-5xl opacity-30">🖼️</span>
        </div>
      )}

      {/* 텍스트 + 읽어주기 버튼 */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3 gap-3">
          <span className="text-xs text-orange-400 font-bold bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
            Page {page.pageNumber}
          </span>
          <button
            onClick={speaking ? onStop : onReadAloud}
            disabled={!page.text.trim()}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-all flex-shrink-0
              ${speaking
                ? 'bg-orange-100 border-orange-400 text-orange-600 animate-pulse'
                : page.text.trim()
                  ? 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500'
                  : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            {speaking ? '⏹ 중지' : '▶ 읽어주기'}
          </button>
        </div>
        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap min-h-[80px]">
          {page.text || <span className="text-gray-300 italic">내용 없음</span>}
        </p>
      </div>
    </div>
  );
}
