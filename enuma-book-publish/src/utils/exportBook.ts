import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { BookState } from '../types/book';
import { DIFFICULTY_LABELS, SUBJECT_LABELS } from '../types/book';

function generateBookId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
  const ts = Date.now().toString(36);
  return `custom_${slug}_${ts}`;
}

function generateBookinfoCsv(book: BookState, bookId: string): string {
  const lines: string[] = [];
  lines.push(`title,${book.meta.title},,${bookId}_page_0,landscape,audio,`);

  for (const page of book.pages) {
    lines.push(`page,${page.pageNumber},${bookId}_page_${page.pageNumber},wordwrap,`);
    lines.push('paragraph');

    const sentences = page.text.split(/[.!?。！？\n]+/).filter(s => s.trim());
    if (sentences.length === 0) {
      lines.push(`sentence,,0,`);
      lines.push(`word,0,0,${page.text.trim()},,0,`);
    } else {
      for (const sentence of sentences) {
        lines.push(`sentence,,0,`);
        const words = sentence.trim().split(/\s+/);
        for (const word of words) {
          if (word) lines.push(`word,0,0,${word},,0,`);
        }
      }
    }
  }

  return lines.join('\n');
}

function generateCreditTxt(book: BookState, bookId: string): string {
  const lines = ['#credit'];
  if (book.meta.writtenBy) lines.push(`Written by: ${book.meta.writtenBy}`);
  if (book.meta.illustratedBy) lines.push(`Illustrated by: ${book.meta.illustratedBy}`);
  lines.push('');
  lines.push('#difficulty');
  lines.push(DIFFICULTY_LABELS[book.meta.difficulty as keyof typeof DIFFICULTY_LABELS] || '');
  lines.push('');
  lines.push('#license');
  lines.push(`"${book.meta.title}" is created with Enuma Book Publish.`);
  lines.push(`Language: ${book.language} | Voice: ${book.voiceGender}`);
  lines.push(`Book ID: ${bookId}`);
  return lines.join('\n');
}

function generateLibraryEntry(book: BookState, bookId: string): object {
  return {
    id: bookId,
    category: `cate_${book.meta.subject}`,
    categoryName: SUBJECT_LABELS[book.meta.subject as keyof typeof SUBJECT_LABELS] || book.meta.subject,
    title: book.meta.title,
    author: [
      book.meta.writtenBy ? `Written by: ${book.meta.writtenBy}` : '',
      book.meta.illustratedBy ? `Illustrated by: ${book.meta.illustratedBy}` : '',
    ].filter(Boolean).join(' '),
    thumbnail: `/assets/library/${bookId}_thumbnail.png`,
    foldername: bookId,
    difficulty: book.meta.difficulty,
    language: book.language,
    voice: book.voiceGender,
    totalChars: book.pages.reduce((sum, p) => sum + p.text.replace(/\s/g, '').length, 0),
    pageCount: book.pages.length,
    createdAt: new Date().toISOString(),
  };
}

export async function exportBook(book: BookState): Promise<void> {
  const bookId = generateBookId(book.meta.title);
  const zip = new JSZip();
  const folder = zip.folder(bookId)!;
  const pageFolder = folder.folder('page')!;

  folder.file('bookinfo.csv', generateBookinfoCsv(book, bookId));
  folder.file('credit.txt', generateCreditTxt(book, bookId));
  folder.file('library_entry.json', JSON.stringify(generateLibraryEntry(book, bookId), null, 2));

  for (const page of book.pages) {
    if (page.imageFile) {
      const arrayBuf = await page.imageFile.arrayBuffer();
      const ext = page.imageFile.name.split('.').pop() || 'png';
      pageFolder.file(`${bookId}_page_${page.pageNumber}.${ext}`, arrayBuf);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${bookId}.zip`);
}
