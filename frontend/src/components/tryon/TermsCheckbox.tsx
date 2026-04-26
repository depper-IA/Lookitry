'use client';

interface TermsCheckboxProps {
  onAccepted: () => void;
  isAccepted: boolean;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
}

export function TermsCheckbox({
  onAccepted,
  isAccepted,
  primaryColor,
  textColor,
  mutedColor,
}: TermsCheckboxProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {/* Custom checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isAccepted}
        onClick={onAccepted}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
        style={{
          backgroundColor: isAccepted ? primaryColor : 'transparent',
          borderColor: isAccepted ? primaryColor : mutedColor,
        }}
      >
        {isAccepted && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Label text */}
      <div className="flex-1 text-left">
        <span className="text-xs leading-relaxed" style={{ color: mutedColor }}>
          Acepto usar esta tecnología de forma responsable.{' '}
          <button
            type="button"
            onClick={onAccepted}
            className="font-medium underline hover:no-underline transition-all"
            style={{ color: primaryColor }}
          >
            Términos de uso
          </button>
        </span>
      </div>
    </div>
  );
}