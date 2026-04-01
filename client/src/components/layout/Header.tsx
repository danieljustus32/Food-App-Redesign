export function Header() {
  return (
    <div className="flex items-center justify-center h-14 px-4 pt-2 bg-background/80 backdrop-blur-xl border-b border-border/30 z-50 absolute top-0 w-full shadow-sm">
      <img
        src="/logo.png"
        alt="Feastly"
        className="w-16 h-16 object-contain"
        style={{ filter: "drop-shadow(0 2px 4px rgba(178,34,34,0.35))" }}
      />
    </div>
  );
}
