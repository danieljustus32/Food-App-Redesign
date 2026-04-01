export function AppPalette() {
  const sections = [
    {
      label: "Brand Core",
      description: "Primary brand colors — used for logo, CTAs, active states and key UI elements.",
      swatches: [
        { name: "Firebrick", hex: "#B22222", usage: "Primary / Logo / Active / Ring" },
        { name: "Ember", hex: "#FF4500", usage: "Secondary / CTA" },
        { name: "Ember Glow", hex: "#E8A96A", usage: "Accent / Warm Highlight" },
        { name: "Forge", hex: "#1A1A1A", usage: "Foreground / Deep Background" },
        { name: "Cast Iron", hex: "#2C2C2C", usage: "Surface Text / Help Icon" },
      ],
    },
    {
      label: "Surfaces",
      description: "Background and card surfaces — warm ash tones that define the app's visual warmth.",
      swatches: [
        { name: "Pale Ash", hex: "#EAE1DB", usage: "App Background" },
        { name: "Card", hex: "#F2EDE9", usage: "Card Surfaces / Inputs" },
        { name: "Muted", hex: "#D3C5BF", usage: "Muted Surfaces / Dividers" },
        { name: "Smoke", hex: "#F5EDE8", usage: "Lightest Warm Surface" },
        { name: "Border", hex: "#CEBFB8", usage: "Borders / Inputs" },
      ],
    },
    {
      label: "Icon Accents",
      description: "Colors used for profile page section icons — drawn from the full Feastly palette collection.",
      swatches: [
        { name: "Surge", hex: "#0077B6", usage: "Preferences Icon" },
        { name: "Dark Gold", hex: "#C07A00", usage: "Push Notifications Icon" },
        { name: "Amethyst", hex: "#A855F7", usage: "Privacy & Security Icon" },
        { name: "Cast Iron", hex: "#2C2C2C", usage: "Help & Support Icon" },
      ],
    },
    {
      label: "Semantic / Status",
      description: "Functional colors for feedback, status indicators, and alerts.",
      swatches: [
        { name: "Success", hex: "#16A34A", usage: "Verified / Like Button" },
        { name: "Warning", hex: "#F59E0B", usage: "Allergen Warning / Unverified Email" },
        { name: "Destructive", hex: "#D42020", usage: "Errors / Logout" },
        { name: "Muted FG", hex: "#6B5850", usage: "Secondary Text / Labels" },
      ],
    },
  ];

  return (
    <div
      className="min-h-screen font-['Inter'] pb-12"
      style={{ background: "#EAE1DB" }}
    >
      <div
        className="h-2 w-full"
        style={{ background: "linear-gradient(to right, #B22222, #FF4500, #E8A96A, #0077B6, #16A34A)" }}
      />

      <div className="px-8 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ background: "radial-gradient(circle at 40% 40%, #E8A96A, #FF4500, #B22222)" }}
          />
          <span
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: "#6B5850" }}
          >
            Feastly — App-Wide Color Reference
          </span>
        </div>
        <h1 className="text-4xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
          Complete
        </h1>
        <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: "#B22222" }}>
          Color Palette
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#6B5850" }}>
          Every color used across the Feastly app — brand core, surfaces, icon accents, and semantic states.
        </p>
      </div>

      <div className="px-8 space-y-8">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mb-3">
              <h2 className="text-base font-bold" style={{ color: "#1A1A1A" }}>
                {section.label}
              </h2>
              <p className="text-xs" style={{ color: "#6B5850" }}>
                {section.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {section.swatches.map((s) => (
                <div
                  key={s.hex + s.name}
                  className="flex items-center gap-4 rounded-2xl p-3"
                  style={{ background: "#F2EDE9", border: "1px solid #CEBFB8" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 shadow-sm"
                    style={{ background: s.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                      {s.name}
                    </div>
                    <div className="text-xs font-mono" style={{ color: "#B22222" }}>
                      {s.hex}
                    </div>
                    <div className="text-xs" style={{ color: "#6B5850" }}>
                      {s.usage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          className="rounded-2xl p-5 mt-4"
          style={{ background: "#1A1A1A" }}
        >
          <div
            className="text-xs uppercase tracking-widest font-semibold mb-4"
            style={{ color: "#E8A96A" }}
          >
            Brand Gradient
          </div>
          <div
            className="rounded-xl h-16 mb-3"
            style={{ background: "linear-gradient(135deg, #B22222, #FF4500, #E8A96A)" }}
          />
          <div
            className="text-xs font-mono"
            style={{ color: "#6B5850" }}
          >
            Firebrick → Ember → Ember Glow
          </div>
        </div>
      </div>
    </div>
  );
}
