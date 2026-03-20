export type Difficulty = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5';
export type Subject = 'animal' | 'nature' | 'number' | 'alphabet' | 'society' | 'science' | 'other';
export type VoiceGender = 'male' | 'female' | 'child';
export type Language = 'ko' | 'en' | 'id';

export interface BookMeta {
  title: string;
  writtenBy: string;
  illustratedBy: string;
  subject: Subject | '';
  difficulty: Difficulty | '';
}

export interface BookPage {
  id: string;
  pageNumber: number;
  text: string;
  imageFile: File | null;
  imagePreview: string;
}

export interface BookState {
  meta: BookMeta;
  pages: BookPage[];
  voiceGender: VoiceGender;
  language: Language;
}

// localStorage에 저장 가능한 직렬화 포맷 (File 객체 제거, base64 이미지만)
export interface StoredPage {
  id: string;
  pageNumber: number;
  text: string;
  imagePreview: string; // base64 data URL
}

export interface StoredBook {
  id: string;
  meta: BookMeta;
  pages: StoredPage[];
  voiceGender: VoiceGender;
  language: Language;
  createdAt: string;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lv1: '입문 Lv.1',
  lv2: '초급 Lv.2',
  lv3: '중급 Lv.3',
  lv4: '고급 Lv.4',
  lv5: '심화 Lv.5',
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  animal: '동물',
  nature: '자연',
  number: '숫자',
  alphabet: '알파벳',
  society: '사회',
  science: '과학',
  other: '기타',
};

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string }> = {
  ko: { label: '한국어', flag: '🇰🇷' },
  en: { label: 'English', flag: '🇺🇸' },
  id: { label: 'Bahasa Indonesia', flag: '🇮🇩' },
};
