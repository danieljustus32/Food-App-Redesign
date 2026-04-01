export function Water() {
  const swatches = [
    { name: "Surge", hex: "#0077B6", role: "Primary / CTA" },
    { name: "Aqua Jet", hex: "#00B4D8", role: "Accent / Active" },
    { name: "Electra", hex: "#00F5D4", role: "Highlight / Energy" },
    { name: "Deep Dive", hex: "#03045E", role: "Deep Background" },
    { name: "Current", hex: "#023E8A", role: "Background / Text" },
    { name: "Ripple", hex: "#90E0EF", role: "Surface / Card" },
    { name: "Mist", hex: "#CAF0F8", role: "Light Background" },
    { name: "Froth", hex: "#E0F7FA", role: "Pale Surface" },
    { name: "Tide", hex: "#48CAE4", role: "Secondary Action" },
    { name: "Splash", hex: "#ADE8F4", role: "Muted Text" },
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#03045E" }}>
      <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #00F5D4, #00B4D8, #0077B6, #023E8A)" }} />

      <div className="px-8 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #CAF0F8, #00B4D8, #0077B6)" }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#90E0EF" }}>Feastly Color Palette</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight" style={{ color: "#CAF0F8" }}>Water, Refresh</h1>
        <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: "#00F5D4" }}>&amp; Energy</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#90E0EF" }}>
          Crisp, vital, and electric. Hydrating flavors and light cuisine — for recipes that invigorate and restore.
        </p>
      </div>

      <div className="px-8 pb-6">
        <div className="rounded-2xl overflow-hidden mb-6" style={{ height: 100, background: "linear-gradient(135deg, #03045E 0%, #023E8A 35%, #0077B6 65%, #00F5D4 100%)" }}>
          <div className="h-full flex items-end p-4">
            <span className="text-xs font-mono" style={{ color: "#CAF0F8" }}>Hero Gradient</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {swatches.map((s) => (
            <div key={s.hex} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#023E8A" }}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 shadow-md" style={{ background: s.hex }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#CAF0F8" }}>{s.name}</div>
                <div className="text-xs font-mono" style={{ color: "#90E0EF" }}>{s.hex}</div>
                <div className="text-xs" style={{ color: "#48CAE4" }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#023E8A", border: "1px solid #0077B6" }}>
          <div className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#90E0EF" }}>Sample UI</div>
          <div className="rounded-xl overflow-hidden mb-3" style={{ background: "#03045E", border: "1px solid #0077B6" }}>
            <div className="h-24" style={{ background: "linear-gradient(135deg, #0077B6, #00F5D4)" }} />
            <div className="p-3">
              <div className="text-sm font-bold mb-1" style={{ color: "#CAF0F8" }}>Mango Yuzu Smoothie Bowl</div>
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#023E8A", color: "#00F5D4" }}>10 min</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#023E8A", color: "#90E0EF" }}>Easy</span>
              </div>
              <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#00B4D8", color: "#03045E" }}>
                Save Recipe →
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#00F5D4", color: "#03045E" }}>Like</button>
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#0077B6", color: "#CAF0F8" }}>Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
