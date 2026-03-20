import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BookState, BookMeta, BookPage, VoiceGender, Language } from '../types/book';

interface BookContextValue {
  book: BookState;
  setMeta: (meta: BookMeta) => void;
  setPages: (pages: BookPage[]) => void;
  addPage: () => void;
  deletePage: (id: string) => void;
  deletePages: (ids: string[]) => void;
  updatePage: (id: string, updates: Partial<BookPage>) => void;
  setVoiceGender: (gender: VoiceGender) => void;
  setLanguage: (lang: Language) => void;
  totalCharCount: number;
}

const BookContext = createContext<BookContextValue | null>(null);

const defaultPage = (): BookPage => ({
  id: crypto.randomUUID(),
  pageNumber: 1,
  text: '',
  imageFile: null,
  imagePreview: '',
});

const initialState: BookState = {
  meta: {
    title: '',
    writtenBy: '',
    illustratedBy: '',
    subject: '',
    difficulty: '',
  },
  pages: [defaultPage()],
  voiceGender: 'female',
  language: 'en',
};

export function BookProvider({ children, init }: { children: ReactNode; init?: BookState }) {
  const [book, setBook] = useState<BookState>(init ?? initialState);

  const setMeta = (meta: BookMeta) => setBook(b => ({ ...b, meta }));

  const setPages = (pages: BookPage[]) =>
    setBook(b => ({ ...b, pages: pages.map((p, i) => ({ ...p, pageNumber: i + 1 })) }));

  const addPage = () =>
    setBook(b => ({
      ...b,
      pages: [...b.pages, { ...defaultPage(), pageNumber: b.pages.length + 1 }],
    }));

  const deletePage = (id: string) =>
    setBook(b => ({
      ...b,
      pages: b.pages
        .filter(p => p.id !== id)
        .map((p, i) => ({ ...p, pageNumber: i + 1 })),
    }));

  const deletePages = (ids: string[]) =>
    setBook(b => ({
      ...b,
      pages: b.pages
        .filter(p => !ids.includes(p.id))
        .map((p, i) => ({ ...p, pageNumber: i + 1 })),
    }));

  const updatePage = (id: string, updates: Partial<BookPage>) =>
    setBook(b => ({
      ...b,
      pages: b.pages.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));

  const setVoiceGender = (voiceGender: VoiceGender) => setBook(b => ({ ...b, voiceGender }));
  const setLanguage = (language: Language) => setBook(b => ({ ...b, language }));

  const totalCharCount = book.pages
    .reduce((sum, p) => sum + p.text.replace(/\s/g, '').length, 0);

  return (
    <BookContext.Provider value={{
      book, setMeta, setPages, addPage, deletePage, deletePages,
      updatePage, setVoiceGender, setLanguage, totalCharCount,
    }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBook() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook must be used inside BookProvider');
  return ctx;
}
