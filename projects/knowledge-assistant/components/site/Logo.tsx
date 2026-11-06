export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><circle cx="32" cy="32" r="17" fill="none" stroke="#7dd3fc" strokeWidth="4" /><path d="M38 26l-4 10-10 4 4-10z" fill="#ca8a04" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Compass</span>
    </span>
  );
}
