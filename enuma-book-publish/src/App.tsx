import { useState } from 'react';
import { BookProvider } from './context/BookContext';
import Step1MetaPage from './pages/Step1MetaPage';
import Step2ContentPage from './pages/Step2ContentPage';
import { exportBook } from './utils/exportBook';
import { useBook } from './context/BookContext';

function AppContent() {
  const [step, setStep] = useState<1 | 2>(1);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const { book } = useBook();

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await exportBook(book);
      setPublished(true);
      setTimeout(() => setPublished(false), 4000);
    } finally {
      setPublishing(false);
    }
  };

  if (publishing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-lg font-bold text-orange-700">책을 출판하는 중...</p>
          <p className="text-sm text-gray-400 mt-1">ZIP 파일을 생성하고 있습니다</p>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">출판 완료!</h2>
          <p className="text-sm text-gray-500 mb-6">
            "{book.meta.title}" ZIP 파일이 다운로드되었습니다.
          </p>
          <button
            onClick={() => { setPublished(false); setStep(1); }}
            className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-colors"
          >
            새 책 만들기
          </button>
        </div>
      </div>
    );
  }

  return step === 1
    ? <Step1MetaPage onNext={() => setStep(2)} />
    : <Step2ContentPage onBack={() => setStep(1)} onPublish={handlePublish} />;
}

export default function App() {
  return (
    <BookProvider>
      <AppContent />
    </BookProvider>
  );
}
