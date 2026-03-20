interface StepIndicatorProps {
  currentStep: 1 | 2;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <StepBubble num={1} label="기본 정보" active={currentStep === 1} done={currentStep > 1} />
      <div className={`h-1 w-16 rounded-full transition-colors ${currentStep > 1 ? 'bg-orange-400' : 'bg-gray-200'}`} />
      <StepBubble num={2} label="내용 편집" active={currentStep === 2} done={false} />
    </div>
  );
}

function StepBubble({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors
        ${done ? 'bg-orange-400 text-white' : active ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-xs font-medium ${active || done ? 'text-orange-600' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
