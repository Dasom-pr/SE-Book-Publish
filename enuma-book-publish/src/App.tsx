import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import LibraryPage from './pages/LibraryPage';
import BookViewerPage from './pages/BookViewerPage';
import Step1MetaPage from './pages/Step1MetaPage';
import Step2ContentPage from './pages/Step2ContentPage';
import { bookStateToStored, saveBook } from './utils/bookStorage';
import { useBook } from './context/BookContext';

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
      </Routes>
    </BrowserRouter>
  );
}
