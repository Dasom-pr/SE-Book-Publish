import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import LibraryPage from './pages/LibraryPage';
import BookViewerPage from './pages/BookViewerPage';
import Step1MetaPage from './pages/Step1MetaPage';
import Step2ContentPage from './pages/Step2ContentPage';
import { bookStateToStored, saveBook, getBook, storedToBookState } from './utils/bookStorage';
import { useBook } from './context/BookContext';
import type { BookState } from './types/book';

/** 신규 책 만들기 플로우 */
function CreateFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const { book } = useBook();
  const navigate = useNavigate();

  const handlePublish = () => {
    const stored = bookStateToStored(book);
    saveBook(stored);
    navigate(`/book/${stored.id}`);
  };

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
  const { book, setMeta, setPages, setVoiceGender, setLanguage } = useBook();
  const navigate = useNavigate();

  const handleApply = () => {
    // 기존 id 유지하면서 덮어쓰기
    const updated = bookStateToStored(book);
    saveBook({ ...updated, id: originalId });
    navigate(`/book/${originalId}`);
  };

  const handleRevert = () => {
    // 원래 상태로 복원
    setMeta(originalState.meta);
    setPages(originalState.pages);
    setVoiceGender(originalState.voiceGender);
    setLanguage(originalState.language);
    navigate(`/book/${originalId}`);
  };

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
