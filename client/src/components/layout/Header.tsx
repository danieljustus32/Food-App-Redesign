export function Header() {
  return (
    <div className="flex items-center justify-center h-14 px-4 pt-2 bg-background/80 backdrop-blur-xl border-b border-border/30 z-50 absolute top-0 w-full shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md overflow-hidden">
          <img src="/logo-white.png" alt="Feastly" className="w-6 h-6 object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-serif">
          Feastly
        </h1>
      </div>
    </div>
  );
}
