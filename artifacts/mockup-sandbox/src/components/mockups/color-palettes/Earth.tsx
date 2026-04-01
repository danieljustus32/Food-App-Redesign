export function Earth() {
  const swatches = [
    { name: "Canopy", hex: "#2D6A4F", role: "Primary / CTA" },
    { name: "Sprout", hex: "#52B788", role: "Accent / Active" },
    { name: "Seedling", hex: "#95D5B2", role: "Highlight / Tag" },
    { name: "Soil", hex: "#6B4226", role: "Deep Background" },
    { name: "Clay", hex: "#A0522D", role: "Secondary Action" },
    { name: "Harvest", hex: "#E9C46A", role: "Highlight / Energy" },
    { name: "Husk", hex: "#F4E3B2", role: "Light Background" },
    { name: "Bark", hex: "#3D2B1F", role: "Background / Text" },
    { name: "Sage", hex: "#B7D9C2", role: "Surface / Card" },
    { name: "Parchment", hex: "#FAF3E0", role: "Pale Surface" },
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#3D2B1F" }}>
      <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #E9C46A, #52B788, #2D6A4F, #6B4226)" }} />

      <div className="px-8 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #E9C46A, #52B788, #2D6A4F)" }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#B7D9C2" }}>Feastly Color Palette</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight" style={{ color: "#FAF3E0" }}>Freshness,</h1>
        <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: "#52B788" }}>Produce &amp; Earth</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#B7D9C2" }}>
          Garden-to-table richness. Sun-warmed produce, damp soil, and living green — for recipes rooted in nature.
        </p>
      </div>

      <div className="px-8 pb-6">
        <div className="rounded-2xl overflow-hidden mb-6" style={{ height: 100, background: "linear-gradient(135deg, #3D2B1F 0%, #6B4226 30%, #2D6A4F 65%, #E9C46A 100%)" }}>
          <div className="h-full flex items-end p-4">
            <span className="text-xs font-mono" style={{ color: "#FAF3E0" }}>Hero Gradient</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {swatches.map((s) => (
            <div key={s.hex} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#6B4226" }}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 shadow-md" style={{ background: s.hex }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#FAF3E0" }}>{s.name}</div>
                <div className="text-xs font-mono" style={{ color: "#B7D9C2" }}>{s.hex}</div>
                <div className="text-xs" style={{ color: "#95D5B2" }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#6B4226", border: "1px solid #A0522D" }}>
          <div className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#B7D9C2" }}>Sample UI</div>
          <div className="rounded-xl overflow-hidden mb-3" style={{ background: "#3D2B1F", border: "1px solid #A0522D" }}>
            <div className="h-24" style={{ background: "linear-gradient(135deg, #2D6A4F, #E9C46A)" }} />
            <div className="p-3">
              <div className="text-sm font-bold mb-1" style={{ color: "#FAF3E0" }}>Roasted Beet &amp; Walnut Salad</div>
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#3D2B1F", color: "#E9C46A" }}>20 min</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#3D2B1F", color: "#B7D9C2" }}>Easy</span>
              </div>
              <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#2D6A4F", color: "#FAF3E0" }}>
                Save Recipe →
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#52B788", color: "#3D2B1F" }}>Like</button>
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#A0522D", color: "#FAF3E0" }}>Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
