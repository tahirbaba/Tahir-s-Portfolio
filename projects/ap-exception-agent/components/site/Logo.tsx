export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><rect x="18" y="12" width="28" height="40" rx="4" fill="none" stroke="#86efac" strokeWidth="4" /><path d="M25 24h14M25 32h14M25 40h8" stroke="#86efac" strokeWidth="4" strokeLinecap="round" /><circle cx="46" cy="46" r="7" fill="#c2410c" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Ledger</span>
    </span>
  );
}
