export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><path d="M14 40l10-10 8 8 18-18" stroke="#93c5fd" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="50" cy="20" r="6" fill="#f97316" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Leadline</span>
    </span>
  );
}
