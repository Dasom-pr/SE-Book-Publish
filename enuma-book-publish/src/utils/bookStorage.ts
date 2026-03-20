import type { StoredBook, BookState, StoredPage, BookPage } from '../types/book';

const STORAGE_KEY = 'enuma_books';

export function getAllBooks(): StoredBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getBook(id: string): StoredBook | null {
  return getAllBooks().find(b => b.id === id) ?? null;
}

export function saveBook(book: StoredBook): void {
  const books = getAllBooks().filter(b => b.id !== book.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([book, ...books]));
}

export function deleteBook(id: string): void {
  const books = getAllBooks().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/** StoredBook → BookState 변환 (수정 모드 초기값으로 사용) */
export function storedToBookState(stored: StoredBook): BookState {
  const pages: BookPage[] = stored.pages.map(p => ({
    id: p.id,
    pageNumber: p.pageNumber,
    text: p.text,
    imageFile: null,        // File 객체는 복원 불가
    imagePreview: p.imagePreview,
  }));
  return {
    meta: { ...stored.meta },
    pages,
    voiceGender: stored.voiceGender,
    language: stored.language,
  };
}

export function bookStateToStored(state: BookState): StoredBook {
  const pages: StoredPage[] = state.pages.map(p => ({
    id: p.id,
    pageNumber: p.pageNumber,
    text: p.text,
    imagePreview: p.imagePreview,
  }));

  const slug = state.meta.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  return {
    id: `book_${slug}_${Date.now().toString(36)}`,
    meta: { ...state.meta },
    pages,
    voiceGender: state.voiceGender,
    language: state.language,
    createdAt: new Date().toISOString(),
  };
}
