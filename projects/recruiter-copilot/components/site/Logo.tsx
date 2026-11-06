export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><circle cx="28" cy="28" r="12" fill="none" stroke="#67e8f9" strokeWidth="5" /><path d="M37 37l11 11" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" /><path d="M23 28l4 4 7-8" stroke="#db2777" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Verity</span>
    </span>
  );
}
