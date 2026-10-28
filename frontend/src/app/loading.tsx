// Branded loading screen — shown by Next.js while page loads
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-brand-green flex items-center justify-center flex-col gap-6">
      {/* Animated Logo Mark */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div
          className="w-20 h-20 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin"
          style={{ animationDuration: "1.2s" }}
        />
        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-brand-gold/20 animate-pulse" />
        </div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-brand-gold" />
        </div>
      </div>

      {/* Brand Name */}
      <div className="text-center">
        <p className="font-display text-2xl font-bold tracking-widest text-brand-cream">
          DRIDHA CRAFTS
        </p>
        <p className="font-accent text-brand-gold text-sm mt-1 animate-pulse">
          Handmade in the Kashmir Valley
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-gold/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
