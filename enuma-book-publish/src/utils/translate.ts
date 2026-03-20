import type { BookState } from '../types/book';

/** 구글 비공식 번역 API를 사용해 텍스트 번역 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
  const data = await res.json();
  // 응답 형식: [[["번역문","원문",...], ...], ...]
  return (data[0] as [string][]).map(seg => seg[0]).join('');
}

/** 책의 모든 페이지 텍스트를 선택된 언어로 번역 */
export async function translateBookState(state: BookState): Promise<BookState> {
  const targetLang = state.language; // 'ko' | 'en' | 'id'

  const translatedPages = await Promise.all(
    state.pages.map(async page => ({
      ...page,
      text: await translateText(page.text, targetLang),
    }))
  );

  return { ...state, pages: translatedPages };
}
