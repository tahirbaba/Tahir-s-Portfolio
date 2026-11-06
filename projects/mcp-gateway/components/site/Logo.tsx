export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><path d="M32 12l16 6v12c0 10-7 18-16 22-9-4-16-12-16-22V18z" fill="none" stroke="#a5b4fc" strokeWidth="5" strokeLinejoin="round" /><circle cx="32" cy="31" r="5" fill="#e11d48" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Gatekeeper</span>
    </span>
  );
}
