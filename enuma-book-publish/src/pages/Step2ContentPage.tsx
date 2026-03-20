import { useState, useRef } from 'react';
import { useBook } from '../context/BookContext';
import StepIndicator from '../components/StepIndicator';
import PageEditor from '../components/PageEditor';
import type { VoiceGender, Language } from '../types/book';
import { LANGUAGE_LABELS } from '../types/book';

interface Props {
  onBack: () => void;
  onPublish: () => void;
}

const voices: { value: VoiceGender; label: string; icon: string }[] = [
  { value: 'male', label: '남성', icon: '👨' },
  { value: 'female', label: '여성', icon: '👩' },
  { value: 'child', label: '아이', icon: '🧒' },
];

const languages: Language[] = ['ko', 'en', 'id'];

export default function Step2ContentPage({ onBack, onPublish }: Props) {
  const { book, addPage, deletePage, deletePages, updatePage, setVoiceGender, setLanguage, totalCharCount } = useBook();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [speaking, setSpeaking] = useState<VoiceGender | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const getSampleText = () => {
    const firstText = book.pages[0]?.text?.trim();
    return firstText || '안녕하세요! 이 목소리로 책을 읽어드립니다.';
  };

  const testVoice = (gender: VoiceGender) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(getSampleText());
      const allVoices = window.speechSynthesis.getVoices();

      const langCode = book.language === 'ko' ? 'ko' : book.language === 'id' ? 'id' : 'en';

      if (gender === 'male') {
        utter.pitch = 0.8;
        utter.rate = 0.95;
        const v = allVoices.find(v => v.lang.startsWith(langCode) && v.name.toLowerCase().includes('male'))
          || allVoices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      } else if (gender === 'female') {
        utter.pitch = 1.1;
        utter.rate = 1.0;
        const v = allVoices.find(v => v.lang.startsWith(langCode) && v.name.toLowerCase().includes('female'))
          || allVoices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      } else {
        utter.pitch = 1.6;
        utter.rate = 1.05;
        const v = allVoices.find(v => v.lang.startsWith(langCode));
        if (v) utter.voice = v;
      }

      utter.onstart = () => setSpeaking(gender);
      utter.onend = () => setSpeaking(null);
      utter.onerror = () => setSpeaking(null);
      speechRef.current = utter;
      window.speechSynthesis.speak(utter);
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
            {voices.map(v => (
              <div key={v.value} className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="voice"
                    value={v.value}
                    checked={book.voiceGender === v.value}
                    onChange={() => setVoiceGender(v.value)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-lg">{v.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{v.label}</span>
                </label>
                <button
                  type="button"
                  onClick={() => testVoice(v.value)}
                  disabled={speaking !== null}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-all
                    ${speaking === v.value
                      ? 'bg-orange-100 border-orange-400 text-orange-600 animate-pulse'
                      : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500'}`}
                >
                  {speaking === v.value ? '▶ 재생 중...' : '▶ 테스트'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">* 첫 번째 페이지 문구로 목소리를 미리 들어보세요.</p>
        </div>

        {/* 발간 언어 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
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
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3">
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
      </div>
    </div>
  );
}
