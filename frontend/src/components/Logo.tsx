import { } from 'react';

type Props = {
  withWordmark?: boolean;
  className?: string;
};

export default function Logo({ withWordmark = true, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#lg)" />
        <path d="M14 30c4-10 16-10 20 0" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="18" cy="20" r="2.8" fill="#fff" />
        <circle cx="30" cy="20" r="2.8" fill="#fff" />
      </svg>
      {withWordmark && (
        <span className="font-semibold text-base tracking-tight">Assessly</span>
      )}
    </div>
  );
}
