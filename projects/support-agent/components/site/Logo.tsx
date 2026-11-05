export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor" /><path d="M18 22h20a8 8 0 0 1 0 16H30l-8 8v-8h-4z" fill="#5eead4" /><circle cx="44" cy="22" r="6" fill="#ff6b4a" /></svg>
      <span className="font-display text-[19px] font-bold tracking-tight">Relay</span>
    </span>
  );
}
