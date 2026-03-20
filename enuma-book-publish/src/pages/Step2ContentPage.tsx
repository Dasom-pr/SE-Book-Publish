import { useState, useRef, useEffect } from 'react';
import { useBook } from '../context/BookContext';
import StepIndicator from '../components/StepIndicator';
import PageEditor from '../components/PageEditor';
import type { VoiceGender, Language } from '../types/book';
import { LANGUAGE_LABELS } from '../types/book';
import { translateText } from '../utils/translate';

interface Props {
  onBack: () => void;
  onPublish: () => void;
  isEdit?: boolean;
  onRevert?: () => void;
}

const voices: { value: VoiceGender; label: string; icon: string }[] = [
  { value: 'male', label: '남성', icon: '👨' },
  { value: 'female', label: '여성', icon: '👩' },
  { value: 'child', label: '아이', icon: '🧒' },
];

const languages: Language[] = ['ko', 'en', 'id'];

export default function Step2ContentPage({ onBack, onPublish, isEdit, onRevert }: Props) {
  const { book, addPage, deletePage, deletePages, updatePage, setVoiceGender, setLanguage, totalCharCount } = useBook();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [speaking, setSpeaking] = useState<VoiceGender | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setAvailableVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deletePages(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleDeletePage = (id: string) => {
    deletePage(id);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  // 선택된 언어 + 성별에 맞는 실제 음성 반환
  const getVoiceForGender = (gender: VoiceGender): SpeechSynthesisVoice | undefined => {
    const langCode = book.language === 'ko' ? 'ko' : book.language === 'id' ? 'id' : 'en';
    const langVoices = availableVoices.filter(v => v.lang.startsWith(langCode));
    if (gender === 'male')
      return langVoices.find(v => v.name.toLowerCase().includes('male')) || langVoices[0];
    if (gender === 'female')
      return langVoices.find(v => v.name.toLowerCase().includes('female')) || langVoices[0];
    return langVoices[0];
  };

  const testVoice = async (gender: VoiceGender) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(gender); // 번역 로딩 표시

    // 첫 번째 페이지 원문을 발간 언어로 번역 후 읽기
    const raw = book.pages[0]?.text?.trim();
    let sample: string;
    if (raw) {
      try { sample = await translateText(raw, book.language); }
      catch { sample = raw; }
    } else {
      if (book.language === 'ko') sample = '안녕하세요! 이 목소리로 책을 읽어드립니다.';
      else if (book.language === 'id') sample = 'Halo! Saya akan membacakan buku ini untuk Anda.';
      else sample = 'Hello! I will read this book for you.';
    }

    const langCode = book.language === 'ko' ? 'ko' : book.language === 'id' ? 'id' : 'en';
    const langFull = book.language === 'ko' ? 'ko-KR' : book.language === 'id' ? 'id-ID' : 'en-US';

    const startTest = (voices: SpeechSynthesisVoice[]) => {
      const utter = new SpeechSynthesisUtterance(sample);
      utter.lang = langFull;

      if (gender === 'male') {
        utter.pitch = 0.8; utter.rate = 0.95;
        const v = voices.find(v => v.lang.startsWith(langCode) && v.name.toLowerCase().includes('male'))
          || voices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      } else if (gender === 'female') {
        utter.pitch = 1.1; utter.rate = 1.0;
        const v = voices.find(v => v.lang.startsWith(langCode) && v.name.toLowerCase().includes('female'))
          || voices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      } else {
        utter.pitch = 1.6; utter.rate = 1.05;
        const v = voices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      }

      utter.onstart = () => setSpeaking(gender);
      utter.onend = () => setSpeaking(null);
      utter.onerror = () => setSpeaking(null);
      speechRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      startTest(voices);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        startTest(window.speechSynthesis.getVoices());
      }, { once: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 px-4 py-6 pb-28">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-orange-700">Enuma Book Publish</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            "{book.meta.title || '제목 없음'}"
          </p>
        </div>

        <StepIndicator currentStep={2} />

        {/* 발간 언어 (맨 위) */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🌏 발간 언어</h3>
          <div className="flex gap-3">
            {languages.map(lang => {
              const { label, flag } = LANGUAGE_LABELS[lang];
              const active = book.language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all font-medium text-sm
                    ${active
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-orange-200'}`}
                >
                  <span className="text-2xl mb-1">{flag}</span>
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addPage}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              + 페이지 추가
            </button>
            <span className="text-gray-200">|</span>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              className={`text-sm font-semibold transition-colors
                ${selectedIds.size > 0 ? 'text-red-500 hover:text-red-600' : 'text-gray-300 cursor-not-allowed'}`}
            >
              선택 페이지 삭제 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
          </div>
          <span className="text-xs text-gray-400">총 {book.pages.length}페이지</span>
        </div>

        {/* 페이지 목록 */}
        <div className="space-y-4 mb-6">
          {book.pages.map(page => (
            <PageEditor
              key={page.id}
              page={page}
              selected={selectedIds.has(page.id)}
              bookTitle={book.meta.title}
              language={book.language}
              onSelect={handleSelect}
              onUpdate={updatePage}
              onDelete={handleDeletePage}
            />
          ))}
        </div>

        {/* 성우 선택 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🎙️ 성우 선택</h3>
          <div className="space-y-2">
            {voices.map(v => {
              const actualVoice = getVoiceForGender(v.value);
              return (
                <div key={v.value} className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer min-w-0">
                    <input
                      type="radio"
                      name="voice"
                      value={v.value}
                      checked={book.voiceGender === v.value}
                      onChange={() => setVoiceGender(v.value)}
                      className="w-4 h-4 accent-orange-500 shrink-0"
                    />
                    <span className="text-lg shrink-0">{v.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-700">{v.label}</span>
                      {availableVoices.length > 0 && (
                        actualVoice
                          ? <p className="text-[10px] text-gray-400 truncate">{actualVoice.name}</p>
                          : <p className="text-[10px] text-red-400">이 언어 음성 없음</p>
                      )}
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => testVoice(v.value)}
                    disabled={speaking !== null || !actualVoice}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-all shrink-0 ml-2
                      ${speaking === v.value
                        ? 'bg-orange-100 border-orange-400 text-orange-600 animate-pulse'
                        : actualVoice
                          ? 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                  >
                    {speaking === v.value ? '▶ 재생 중...' : '▶ 테스트'}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">* 첫 번째 페이지 문구로 목소리를 미리 들어보세요.</p>
        </div>
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3">
        {isEdit ? (
          /* 수정 모드 버튼 */
          <div className="max-w-xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-center">
              <div className="text-xs text-gray-400 text-center">
                총 <span className="font-bold text-gray-600">{totalCharCount.toLocaleString()}</span>자
                <span className="text-gray-300"> (공백 제외)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRevert}
                className="flex-1 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-colors"
              >
                ↩ 이전 설정으로 돌아가기
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={book.pages.every(p => !p.text.trim())}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all
                  ${book.pages.some(p => p.text.trim())
                    ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                ✅ 수정 적용하기
              </button>
            </div>
          </div>
        ) : (
          /* 일반(신규 출판) 버튼 */
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 transition-colors"
            >
              ← 이전
            </button>

            <div className="text-xs text-gray-400 text-center">
              <span className="font-bold text-gray-600">{totalCharCount.toLocaleString()}</span>자
              <br />
              <span className="text-gray-300">(공백 제외)</span>
            </div>

            <button
              type="button"
              onClick={onPublish}
              disabled={book.pages.every(p => !p.text.trim())}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                ${book.pages.some(p => p.text.trim())
                  ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              📚 책 출판하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
