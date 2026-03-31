interface ChapteredLogoProps {
  size?: number;
  className?: string;
  /** 'full' = icon + wordmark, 'icon' = icon only */
  variant?: 'full' | 'icon';
}

export default function ChapteredLogo({ size = 36, className = '', variant = 'icon' }: ChapteredLogoProps) {
  const id = `clogo-${Math.random().toString(36).slice(2, 7)}`;

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === 'icon' ? className : ''}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`${id}-spine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="40" height="40" rx="10" fill={`url(#${id}-bg)`} />

      {/* Left page */}
      <path
        d="M20 10 C20 10 11 11.5 11 16 L11 30 C11 30 15 29 20 30 L20 10Z"
        fill="white"
        opacity="0.95"
      />
      {/* Right page */}
      <path
        d="M20 10 C20 10 29 11.5 29 16 L29 30 C29 30 25 29 20 30 L20 10Z"
        fill="white"
        opacity="0.75"
      />

      {/* Spine line */}
      <line x1="20" y1="10" x2="20" y2="30" stroke={`url(#${id}-spine)`} strokeWidth="1.5" strokeLinecap="round" />

      {/* Chapter bookmark ribbons — left page */}
      <rect x="13" y="7" width="4" height="9" rx="1" fill="#FBBF24" opacity="0.95" />
      <polygon points="13,16 15,14 17,16" fill="#FBBF24" opacity="0.95" />

      {/* Chapter lines — right page */}
      <line x1="22" y1="16" x2="27" y2="16" stroke="#FF6B9D" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="22" y1="20" x2="26" y2="20" stroke="#FF6B9D" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="24" x2="27" y2="24" stroke="#FF6B9D" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );

  if (variant === 'icon') return icon;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      <span
        className="font-black text-white tracking-tight"
        style={{ fontSize: size * 0.55, lineHeight: 1 }}
      >
        Chaptered
      </span>
    </div>
  );
}
