import { useState } from 'react';
import { useBook } from '../context/BookContext';
import StepIndicator from '../components/StepIndicator';
import type { Difficulty, Subject } from '../types/book';
import { DIFFICULTY_LABELS, SUBJECT_LABELS } from '../types/book';

interface Props {
  onNext: () => void;
}

const difficulties: Difficulty[] = ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'];
const subjects: Subject[] = ['animal', 'nature', 'number', 'alphabet', 'society', 'science', 'other'];

const difficultyColors: Record<Difficulty, string> = {
  lv1: 'bg-green-100 border-green-400 text-green-700',
  lv2: 'bg-lime-100 border-lime-400 text-lime-700',
  lv3: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  lv4: 'bg-orange-100 border-orange-400 text-orange-700',
  lv5: 'bg-red-100 border-red-400 text-red-700',
};

export default function Step1MetaPage({ onNext }: Props) {
  const { book, setMeta } = useBook();
  const [form, setForm] = useState(book.meta);

  const isValid =
    form.title.trim() &&
    form.writtenBy.trim() &&
    form.subject !== '' &&
    form.difficulty !== '';

  const handleNext = () => {
    setMeta(form);
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 px-4 py-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-orange-700">Enuma Book Publish</h1>
          <p className="text-sm text-gray-500 mt-1">나만의 책을 만들어 보세요</p>
        </div>

        <StepIndicator currentStep={1} />

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-700">책 기본 정보</h2>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              ① 책 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 동물 친구들"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* 저자 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              ② 저자 <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="글: Written by (예: 홍길동)"
                value={form.writtenBy}
                onChange={e => setForm(f => ({ ...f, writtenBy: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input
                type="text"
                placeholder="그림: Illustrated by (선택)"
                value={form.illustratedBy}
                onChange={e => setForm(f => ({ ...f, illustratedBy: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* 주제 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              ③ 책 주제 <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, subject: s }))}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-all
                    ${form.subject === s
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300'}`}
                >
                  {SUBJECT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              ④ 책 난이도 <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                    ${form.difficulty === d
                      ? difficultyColors[d] + ' shadow-sm scale-105'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 다음 버튼 */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!isValid}
          className={`mt-6 w-full py-3.5 rounded-2xl font-bold text-base transition-all
            ${isValid
              ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
