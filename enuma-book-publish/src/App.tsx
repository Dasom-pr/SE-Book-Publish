import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import LibraryPage from './pages/LibraryPage';
import BookViewerPage from './pages/BookViewerPage';
import Step1MetaPage from './pages/Step1MetaPage';
import Step2ContentPage from './pages/Step2ContentPage';
import { bookStateToStored, saveBook, getBook, storedToBookState } from './utils/bookStorage';
import { translateBookState } from './utils/translate';
import { useBook } from './context/BookContext';
import type { BookState } from './types/book';
import { LANGUAGE_LABELS } from './types/book';

/** 번역 중 로딩 화면 */
function TranslatingScreen({ language }: { language: string }) {
  const lang = LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS];
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="text-center px-6">
        <div className="text-6xl mb-4 animate-bounce">🌐</div>
        <p className="text-lg font-bold text-orange-700 mb-1">번역 중...</p>
        <p className="text-sm text-gray-400">
          {lang ? `${lang.flag} ${lang.label}` : language}로 번역하고 있어요
        </p>
      </div>
    </div>
  );
}

/** 신규 책 만들기 플로우 */
function CreateFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [translating, setTranslating] = useState(false);
  const { book } = useBook();
  const navigate = useNavigate();

  const handlePublish = async () => {
    setTranslating(true);
    try {
      const translated = await translateBookState(book);
      const stored = bookStateToStored(translated);
      saveBook(stored);
      navigate(`/book/${stored.id}`);
    } catch {
      // 번역 실패 시 원본 텍스트 그대로 저장
      const stored = bookStateToStored(book);
      saveBook(stored);
      navigate(`/book/${stored.id}`);
    } finally {
      setTranslating(false);
    }
  };

  if (translating) return <TranslatingScreen language={book.language} />;

  return step === 1
    ? <Step1MetaPage onNext={() => setStep(2)} />
    : <Step2ContentPage onBack={() => setStep(1)} onPublish={handlePublish} />;
}

/** 기존 책 수정 플로우 */
function EditFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const original = id ? getBook(id) : null;

  if (!original) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-gray-400 mb-4">책을 찾을 수 없어요.</p>
          <button onClick={() => navigate('/')} className="text-orange-500 font-bold">← 책장으로</button>
        </div>
      </div>
    );
  }

  const initState: BookState = storedToBookState(original);

  return (
    <BookProvider init={initState}>
      <EditFlowInner originalId={original.id} originalState={initState} />
    </BookProvider>
  );
}

function EditFlowInner({ originalId, originalState }: { originalId: string; originalState: BookState }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [translating, setTranslating] = useState(false);
  const { book, setMeta, setPages, setVoiceGender, setLanguage } = useBook();
  const navigate = useNavigate();

  const handleApply = async () => {
    setTranslating(true);
    try {
      const translated = await translateBookState(book);
      const updated = bookStateToStored(translated);
      saveBook({ ...updated, id: originalId });
      navigate(`/book/${originalId}`);
    } catch {
      const updated = bookStateToStored(book);
      saveBook({ ...updated, id: originalId });
      navigate(`/book/${originalId}`);
    } finally {
      setTranslating(false);
    }
  };

  const handleRevert = () => {
    setMeta(originalState.meta);
    setPages(originalState.pages);
    setVoiceGender(originalState.voiceGender);
    setLanguage(originalState.language);
    navigate(`/book/${originalId}`);
  };

  if (translating) return <TranslatingScreen language={book.language} />;

  return step === 1
    ? <Step1MetaPage onNext={() => setStep(2)} />
    : (
      <Step2ContentPage
        onBack={() => setStep(1)}
        onPublish={handleApply}
        isEdit
        onRevert={handleRevert}
      />
    );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/book/:id" element={<BookViewerPage />} />
        <Route
          path="/create"
          element={
            <BookProvider>
              <CreateFlow />
            </BookProvider>
          }
        />
        <Route path="/edit/:id" element={<EditFlow />} />
      </Routes>
    </BrowserRouter>
  );
}
