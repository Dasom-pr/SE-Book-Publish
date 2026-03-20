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
  const [, setSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(true);           // 기본값 ON
  const [highlight, setHighlight] = useState<HighlightRange | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => { if (id) setBook(getBook(id)); }, [id]);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) voicesRef.current = v;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  // ── 전체 텍스트 읽기 (어절 boundary 하이라이트) ──
  const readAloud = useCallback((text: string, voiceGender: string, language: string) => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    setHighlight(null);

    const langCode = language === 'ko' ? 'ko' : language === 'id' ? 'id' : 'en';
    const langFull = language === 'ko' ? 'ko-KR' : language === 'id' ? 'id-ID' : 'en-US';
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langFull;
    if (voiceGender === 'child') { utter.pitch = 1.6; utter.rate = 1.05; }
    else if (voiceGender === 'male') { utter.pitch = 0.8; utter.rate = 0.95; }
    else { utter.pitch = 1.1; utter.rate = 1.0; }
    const v = voices.find(v => v.lang.startsWith(langCode));
    if (v) utter.voice = v;

    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
      }
    }, 10000);
    keepAliveRef.current = keepAlive;

    utter.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word') {
        const start = e.charIndex;
        const len = (e as SpeechSynthesisEvent & { charLength?: number }).charLength;
        const end = len != null
          ? start + len
          : (() => { const next = text.indexOf(' ', start); return next === -1 ? text.length : next; })();
        setHighlight({ start, end });
      }
    };
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false); setHighlight(null);
      if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    };
    utter.onerror = (e) => {
      if (e.error === 'interrupted') return;
      setSpeaking(false); setHighlight(null);
      if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    };
    window.speechSynthesis.speak(utter);
  }, []);

  // ── 어절 클릭 읽기 (해당 위치 즉시 하이라이트) ──
  const readWord = useCallback((word: string, wordStart: number, wordEnd: number, voiceGender: string, language: string) => {
    if (!word.trim()) return;
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    // 클릭한 어절 즉시 하이라이트
    setHighlight({ start: wordStart, end: wordEnd });

    const langCode = language === 'ko' ? 'ko' : language === 'id' ? 'id' : 'en';
    const langFull = language === 'ko' ? 'ko-KR' : language === 'id' ? 'id-ID' : 'en-US';
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();

    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = langFull;
    if (voiceGender === 'child') { utter.pitch = 1.6; utter.rate = 1.05; }
    else if (voiceGender === 'male') { utter.pitch = 0.8; utter.rate = 0.95; }
    else { utter.pitch = 1.1; utter.rate = 1.0; }
    const v = voices.find(v => v.lang.startsWith(langCode));
    if (v) utter.voice = v;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); setHighlight(null); };
    utter.onerror = (e) => {
      if (e.error === 'interrupted') return;
      setSpeaking(false); setHighlight(null);
    };
    window.speechSynthesis.speak(utter);
  }, []);

  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false); setHighlight(null);
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  }, []);

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

  // 네비게이션: user gesture 컨텍스트에서 직접 readAloud 호출
  const goNext = () => {
    if (!book) return;
    const next = Math.min(currentPage + 1, book.pages.length);
    stopReading();
    setCurrentPage(next);
    if (autoRead && next > 0) {
      const p = book.pages[next - 1];
      if (p?.text) readAloud(p.text, book.voiceGender, book.language);
    }
  };

  const goPrev = () => {
    if (!book) return;
    const prev = Math.max(currentPage - 1, 0);
    stopReading();
    setCurrentPage(prev);
    if (autoRead && prev > 0) {
      const p = book.pages[prev - 1];
      if (p?.text) readAloud(p.text, book.voiceGender, book.language);
    }
  };

  const goTo = (p: number) => {
    if (!book) return;
    stopReading();
    setCurrentPage(p);
    if (autoRead && p > 0) {
      const pg = book.pages[p - 1];
      if (pg?.text) readAloud(pg.text, book.voiceGender, book.language);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `url('/assets/book/bg.jpg') center/cover` }}>
        <div className="bg-black/60 rounded-2xl p-8 text-center">
          <p className="text-amber-100 mb-4">책을 찾을 수 없어요.</p>
          <button onClick={() => navigate('/')} className="text-amber-300 font-bold">← 책장으로</button>
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `url('/assets/book/bg.jpg') center/cover fixed` }}
    >
      {/* 상단 바 */}
      <div className="bg-black/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => { stopReading(); navigate('/'); }}
          className="text-amber-200 hover:text-white text-sm font-semibold"
        >
          ← 책장
        </button>
        <span className="text-amber-100 font-bold text-sm truncate max-w-[150px]">{book.meta.title}</span>
        <div className="flex items-center gap-3">
          {/* 🎧 유일한 음성 버튼 */}
          <button
            onClick={toggleAutoRead}
            title={autoRead ? '자동 읽기 끄기' : '자동 읽기 켜기'}
            className={`text-xl transition-all rounded-full p-1.5
              ${autoRead
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-amber-300 hover:text-white'}`}
          >
            🎧
          </button>
          <span className="text-amber-300 text-xs min-w-[48px] text-right">
            {isCover ? '표지' : `${currentPage} / ${totalPages}`}
          </span>
        </div>
      </div>

      {/* 책 본문 + 네비게이션 */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-6">
        <div className="relative flex items-center justify-center w-full max-w-sm">

          {/* 이전 화살표 */}
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            className="absolute -left-4 z-10 transition-opacity"
            style={{ opacity: currentPage === 0 ? 0.25 : 1 }}
          >
            <img src="/assets/book/arrow_left.png" alt="이전" className="h-16 w-auto" draggable={false} />
          </button>

          {/* 책 카드 */}
          <div className="w-full rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '3/4' }}>
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
                highlight={highlight}
                onWordClick={(word, start, end) =>
                  readWord(word, start, end, book.voiceGender, book.language)
                }
              />
            )}
          </div>

          {/* 다음 화살표 */}
          <button
            onClick={goNext}
            disabled={currentPage === totalPages}
            className="absolute -right-4 z-10 transition-opacity"
            style={{ opacity: currentPage === totalPages ? 0.25 : 1 }}
          >
            <img src="/assets/book/arrow_right.png" alt="다음" className="h-16 w-auto" draggable={false} />
          </button>
        </div>

        {/* 페이지 진행 점 */}
        <div className="flex gap-2 mt-5 items-center">
          {Array.from({ length: totalPages + 1 }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="transition-transform hover:scale-125">
              <img
                src={i === currentPage ? '/assets/book/progress_dot_current.png' : '/assets/book/progress_dot.png'}
                alt={`page ${i}`}
                className="w-4 h-4"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 표지 ──
function CoverPage({ book, flag, langLabel, difficulty, onStart }: {
  book: StoredBook; flag: string; langLabel: string; difficulty: string; onStart: () => void;
}) {
  const cover = book.pages.find(p => p.imagePreview)?.imagePreview;
  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{ background: `url('/assets/book/cover_bg.jpg') center/cover` }}
    >
      <div className="absolute inset-y-0 left-0 w-3 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />

      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-2" style={{ minHeight: 0 }}>
        <div className="relative w-full h-full">
          <img src="/assets/book/cover_frame.png" alt=""
            className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none" draggable={false} />
          <div className="absolute inset-[6%] overflow-hidden rounded-lg">
            {cover
              ? <img src={cover} alt="cover" className="w-full h-full object-cover" draggable={false} />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: '#e8d9b5' }}>
                  <span className="text-6xl opacity-40">📖</span>
                </div>
            }
          </div>
          <span className="absolute top-2 right-2 text-xl z-20">{flag}</span>
        </div>
      </div>

      <div className="px-5 pb-4 text-center">
        <h1 className="font-bold leading-tight mb-1" style={{ color: '#4F3D18', fontSize: '22px' }}>
          {book.meta.title}
        </h1>
        {book.meta.writtenBy && <p className="text-xs mb-0.5" style={{ color: '#6B5230' }}>글: {book.meta.writtenBy}</p>}
        {book.meta.illustratedBy && <p className="text-xs mb-2" style={{ color: '#6B5230' }}>그림: {book.meta.illustratedBy}</p>}
        <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
          {difficulty && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f0e0b0', color: '#7a5820' }}>{difficulty}</span>}
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#d8ecd0', color: '#3a6b28' }}>{flag} {langLabel}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#e8e0d0', color: '#6B5230' }}>{book.pages.length}p</span>
        </div>
        <button
          onClick={onStart}
          className="w-full py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#c8900a', color: '#fff4d0' }}
        >
          읽기 시작 ▶
        </button>
      </div>
    </div>
  );
}

// ── 내용 페이지 (읽기 버튼 없음, 어절 클릭만) ──
function ContentPage({ page, highlight, onWordClick }: {
  page: { pageNumber: number; text: string; imagePreview: string };
  highlight: HighlightRange | null;
  onWordClick: (word: string, start: number, end: number) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FFFEF7' }}>
      {/* 이미지 영역 상단 58% */}
      <div className="flex-shrink-0" style={{ height: '58%' }}>
        {page.imagePreview
          ? <img src={page.imagePreview} alt={`page ${page.pageNumber}`} className="w-full h-full object-cover" draggable={false} />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: '#f5ead0' }}>
              <span className="text-5xl opacity-25">🖼️</span>
            </div>
        }
      </div>

      {/* 텍스트 영역 하단 42% */}
      <div className="flex-1 px-5 py-3 flex flex-col min-h-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start mb-2"
          style={{ background: '#f0e4c0', color: '#7a5820' }}>
          Page {page.pageNumber}
        </span>
        <p className="overflow-y-auto leading-relaxed flex-1 select-none"
          style={{ color: '#4F3D18', fontSize: '16px', lineHeight: '1.7' }}>
          {page.text
            ? <ClickableText text={page.text} range={highlight} onWordClick={onWordClick} />
            : <span style={{ color: '#c0b090', fontStyle: 'italic' }}>내용 없음</span>
          }
        </p>
      </div>
    </div>
  );
}

// ── 어절 클릭 + 하이라이트 텍스트 ──
function ClickableText({ text, range, onWordClick }: {
  text: string;
  range: HighlightRange | null;
  onWordClick: (word: string, start: number, end: number) => void;
}) {
  // 공백/줄바꿈과 단어 토큰으로 분리
  const tokens: { text: string; start: number; isWord: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === ' ' || text[i] === '\n') {
      let j = i;
      while (j < text.length && (text[j] === ' ' || text[j] === '\n')) j++;
      tokens.push({ text: text.slice(i, j), start: i, isWord: false });
      i = j;
    } else {
      let j = i;
      while (j < text.length && text[j] !== ' ' && text[j] !== '\n') j++;
      tokens.push({ text: text.slice(i, j), start: i, isWord: true });
      i = j;
    }
  }

  return (
    <>
      {tokens.map((token, idx) => {
        if (!token.isWord) {
          return <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>{token.text}</span>;
        }
        const tokenEnd = token.start + token.text.length;
        const isHighlighted = range != null && range.start < tokenEnd && range.end > token.start;
        return (
          <span
            key={idx}
            onClick={() => onWordClick(token.text, token.start, tokenEnd)}
            className="cursor-pointer rounded transition-colors"
            style={{
              background: isHighlighted ? '#FDE047' : 'transparent',
              color: '#4F3D18',
              padding: isHighlighted ? '0 2px' : undefined,
            }}
          >
            {token.text}
          </span>
        );
      })}
    </>
  );
}
