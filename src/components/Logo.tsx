import Link from 'next/link';

export default function Logo({ size = 'default' }: { size?: 'small' | 'default' }) {
  const height = size === 'small' ? 32 : 48;
  
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 80" fill="none" style={{ height: `${height}px`, width: 'auto' }}>
        <rect x="4" y="14" width="62" height="44" rx="12" fill="#ffffff"/>
        <rect x="20" y="4" width="20" height="14" rx="4" fill="#cccccc"/>
        <circle cx="35" cy="36" r="15" fill="#0a0a0a" stroke="#ffffff" strokeWidth="2"/>
        <circle cx="35" cy="36" r="9" fill="#1a1a1a" stroke="#ffffff" strokeWidth="1.2"/>
        <circle cx="30" cy="31" r="3" fill="#ffffff" opacity="0.08"/>
        <rect x="52" y="19" width="7" height="5" rx="2" fill="#ffffff" opacity="0.4"/>
        <circle cx="49" cy="10" r="3.5" fill="#ffffff"/>
        <circle cx="49" cy="10" r="2" fill="#0a0a0a"/>
        <text x="78" y="48" fill="#ffffff" fontFamily="'Syne',sans-serif" fontWeight="800" fontSize="38" letterSpacing="-1">BecoToy</text>
      </svg>
    </Link>
  );
}
