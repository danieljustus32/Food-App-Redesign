export function Fire() {
  const swatches = [
    { name: "Ember", hex: "#FF4500", role: "Primary / CTA" },
    { name: "Firebrick", hex: "#B22222", role: "Accent / Active" },
    { name: "Flame", hex: "#E25822", role: "Secondary Action" },
    { name: "Brick", hex: "#8B3A2A", role: "Hover States" },
    { name: "Cast Iron", hex: "#2C2C2C", role: "Background / Text" },
    { name: "Forge", hex: "#1A1A1A", role: "Deep Background" },
    { name: "Soot", hex: "#3D3D3D", role: "Surface / Card" },
    { name: "Ash", hex: "#C0A090", role: "Muted Text" },
    { name: "Ember Glow", hex: "#F5C07A", role: "Highlight / Tag" },
    { name: "Smoke", hex: "#F5EDE8", role: "Light Background" },
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#1A1A1A" }}>
      <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #FF4500, #B22222, #E25822, #8B3A2A)" }} />

      <div className="px-8 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, #F5C07A, #FF4500, #B22222)" }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#C0A090" }}>Feastly Color Palette</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight" style={{ color: "#F5EDE8" }}>Fire, Brick</h1>
        <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: "#FF4500" }}>&amp; Cast Iron</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#C0A090" }}>
          Raw heat meets industrial texture. Bold flavors and hearth-fired cooking — for recipes that demand respect.
        </p>
      </div>

      <div className="px-8 pb-6">
        <div className="rounded-2xl overflow-hidden mb-6" style={{ height: 100, background: "linear-gradient(135deg, #1A1A1A 0%, #2C2C2C 40%, #B22222 70%, #FF4500 100%)" }}>
          <div className="h-full flex items-end p-4">
            <span className="text-xs font-mono" style={{ color: "#F5C07A" }}>Hero Gradient</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {swatches.map((s) => (
            <div key={s.hex} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#2C2C2C" }}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 shadow-md" style={{ background: s.hex }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#F5EDE8" }}>{s.name}</div>
                <div className="text-xs font-mono" style={{ color: "#C0A090" }}>{s.hex}</div>
                <div className="text-xs" style={{ color: "#8B3A2A" }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#2C2C2C", border: "1px solid #3D3D3D" }}>
          <div className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#C0A090" }}>Sample UI</div>
          <div className="rounded-xl overflow-hidden mb-3" style={{ background: "#1A1A1A", border: "1px solid #3D3D3D" }}>
            <div className="h-24" style={{ background: "linear-gradient(135deg, #B22222, #FF4500)" }} />
            <div className="p-3">
              <div className="text-sm font-bold mb-1" style={{ color: "#F5EDE8" }}>Spiced Lamb Flatbread</div>
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#3D3D3D", color: "#F5C07A" }}>35 min</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#3D3D3D", color: "#C0A090" }}>Medium</span>
              </div>
              <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#FF4500", color: "#F5EDE8" }}>
                Save Recipe →
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#B22222", color: "#F5EDE8" }}>Like</button>
            <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#3D3D3D", color: "#C0A090" }}>Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
