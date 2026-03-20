import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook } from '../utils/bookStorage';
import type { StoredBook } from '../types/book';
import { DIFFICULTY_LABELS, LANGUAGE_LABELS } from '../types/book';

interface HighlightRange { start: number; end: number; }

export default function BookViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<StoredBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0);       // 0 = 표지
  const [speaking, setSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);          // 🎧 헤드폰 토글
  const [highlight, setHighlight] = useState<HighlightRange | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (id) setBook(getBook(id)); }, [id]);
  useEffect(() => () => {
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
  }, []);

  const readAloud = useCallback((text: string, voiceGender: string, language: string) => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    setHighlight(null);

    const langCode = language === 'ko' ? 'ko' : language === 'id' ? 'id' : 'en';
    const langFull = language === 'ko' ? 'ko-KR' : language === 'id' ? 'id-ID' : 'en-US';

    const startSpeech = (voices: SpeechSynthesisVoice[]) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = langFull;

      if (voiceGender === 'child') { utter.pitch = 1.6; utter.rate = 1.05; }
      else if (voiceGender === 'male') { utter.pitch = 0.8; utter.rate = 0.95; }
      else { utter.pitch = 1.1; utter.rate = 1.0; }

      const v = voices.find(v => v.lang.startsWith(langCode));
      if (v) utter.voice = v;

      // Chrome에서 긴 텍스트가 멈추는 버그 우회: 10초마다 pause→resume
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive);
        }
      }, 10000);
      keepAliveRef.current = keepAlive;

      // 어절 단위 하이라이트
      utter.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === 'word') {
          const start = e.charIndex;
          const len = (e as SpeechSynthesisEvent & { charLength?: number }).charLength;
          const end = len != null
            ? start + len
            : (() => {
                const next = text.indexOf(' ', start);
                return next === -1 ? text.length : next;
              })();
          setHighlight({ start, end });
        }
      };
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => {
        setSpeaking(false);
        setHighlight(null);
        if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      };
      utter.onerror = () => {
        setSpeaking(false);
        setHighlight(null);
        if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
      };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    // 음성 목록이 아직 로드되지 않은 경우 voiceschanged 이벤트 대기
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      startSpeech(voices);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        startSpeech(window.speechSynthesis.getVoices());
      }, { once: true });
    }
  }, []);

  // autoRead ON 상태에서 페이지 이동 시 자동 재생
  useEffect(() => {
    if (!autoRead || !book || currentPage === 0) return;
    const page = book.pages[currentPage - 1];
    if (page?.text) readAloud(page.text, book.voiceGender, book.language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, autoRead]);

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setHighlight(null);
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  };

  const toggleAutoRead = () => {
    const next = !autoRead;
    setAutoRead(next);
    if (!next) {
      stopReading();
    } else if (book && currentPage > 0) {
      const page = book.pages[currentPage - 1];
      if (page?.text) readAloud(page.text, book.voiceGender, book.language);
    }
  };

  const goNext = () => {
    stopReading();
    setCurrentPage(p => Math.min(p + 1, book?.pages.length ?? 0));
  };
  const goPrev = () => {
    stopReading();
    setCurrentPage(p => Math.max(p - 1, 0));
  };
  const goTo = (p: number) => { stopReading(); setCurrentPage(p); };

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
  const { flag, label: langLabel } = LANGUAGE_LABELS[book.language];
  const difficulty = DIFFICULTY_LABELS[book.meta.difficulty as keyof typeof DIFFICULTY_LABELS] ?? '';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 상단 바 */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => { stopReading(); navigate('/'); }}
          className="text-gray-300 hover:text-white text-sm"
        >
          ← 책장
        </button>
        <span className="text-white font-bold text-sm truncate max-w-[160px]">{book.meta.title}</span>

        <div className="flex items-center gap-3">
          {/* 🎧 헤드폰 토글 */}
          <button
            onClick={toggleAutoRead}
            title={autoRead ? '자동 읽기 끄기' : '자동 읽기 켜기'}
            className={`text-xl transition-all rounded-full p-1.5
              ${autoRead
                ? 'bg-orange-500 text-white shadow-md shadow-orange-900/40'
                : 'text-gray-400 hover:text-gray-200'}`}
          >
            🎧
          </button>
          <span className="text-gray-400 text-xs">
            {isCover ? '표지' : `${currentPage} / ${totalPages}`}
          </span>
        </div>
      </div>

      {/* 책 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
          {isCover ? (
            <CoverPage
              book={book}
              flag={flag}
              langLabel={langLabel}
              difficulty={difficulty}
              onStart={goNext}
            />
          ) : (
            <ContentPage
              page={page!}
              speaking={speaking}
              highlight={highlight}
              onReadAloud={() => readAloud(page!.text, book.voiceGender, book.language)}
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

        <div className="flex gap-1.5 overflow-x-auto max-w-[180px] py-1">
          {Array.from({ length: totalPages + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
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
  book: StoredBook; flag: string; langLabel: string; difficulty: string; onStart: () => void;
}) {
  const cover = book.pages.find(p => p.imagePreview)?.imagePreview;
  return (
    <div className="flex flex-col">
      <div className="relative bg-gradient-to-br from-orange-300 to-amber-400" style={{ paddingTop: '60%' }}>
        {cover
          ? <img src={cover} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><span className="text-8xl">📖</span></div>
        }
        <span className="absolute top-3 right-3 text-2xl">{flag}</span>
      </div>
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{book.meta.title}</h1>
        {book.meta.writtenBy && <p className="text-sm text-gray-500 mb-1">글: {book.meta.writtenBy}</p>}
        {book.meta.illustratedBy && <p className="text-sm text-gray-400 mb-3">그림: {book.meta.illustratedBy}</p>}
        <div className="flex justify-center gap-2 mb-6">
          {difficulty && <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{difficulty}</span>}
          <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{flag} {langLabel}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{book.pages.length}페이지</span>
        </div>
        <button
          onClick={onStart}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded-2xl hover:bg-orange-600 transition-colors shadow-md"
        >
          읽기 시작 📖
        </button>
      </div>
    </div>
  );
}

function ContentPage({ page, speaking, highlight, onReadAloud, onStop }: {
  page: { pageNumber: number; text: string; imagePreview: string };
  speaking: boolean;
  highlight: HighlightRange | null;
  onReadAloud: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-col">
      {page.imagePreview ? (
        <img src={page.imagePreview} alt={`page ${page.pageNumber}`} className="w-full object-cover" style={{ maxHeight: 280 }} />
      ) : (
        <div className="w-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center" style={{ height: 180 }}>
          <span className="text-5xl opacity-30">🖼️</span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-3 gap-3">
          <span className="text-xs text-orange-400 font-bold bg-orange-50 px-2 py-0.5 rounded-full">
            Page {page.pageNumber}
          </span>
          {/* 🎧 페이지별 읽기 버튼 */}
          <button
            onClick={speaking ? onStop : onReadAloud}
            disabled={!page.text.trim()}
            title={speaking ? '읽기 중지' : '읽어주기'}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all border-2
              ${speaking
                ? 'bg-orange-100 border-orange-400 animate-pulse'
                : page.text.trim()
                  ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  : 'border-gray-100 opacity-30 cursor-not-allowed'}`}
          >
            🎧
          </button>
        </div>

        {/* 하이라이트 텍스트 */}
        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap min-h-[80px]">
          {page.text
            ? <HighlightedText text={page.text} range={highlight} />
            : <span className="text-gray-300 italic">내용 없음</span>
          }
        </p>
      </div>
    </div>
  );
}

function HighlightedText({ text, range }: { text: string; range: HighlightRange | null }) {
  if (!range || range.start >= range.end) return <>{text}</>;
  const before = text.slice(0, range.start);
  const word = text.slice(range.start, range.end);
  const after = text.slice(range.end);
  return (
    <>
      {before}
      <mark className="bg-yellow-300 rounded px-0.5 text-gray-800">{word}</mark>
      {after}
    </>
  );
}
