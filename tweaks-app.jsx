// MenuSafe — Tweaks panel. Mounts an isolated React root and syncs
// choices to CSS variables / body attributes on the (vanilla) page.

const MS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#D4A017",
  "fontPair": "cormorant",
  "hero": "split"
}/*EDITMODE-END*/;

const MS_FONT_PAIRS = {
  cormorant: { display: '"Cormorant Garamond", Georgia, serif', body: '"Hanken Grotesk", system-ui, sans-serif', label: "Cormorant · Hanken" },
  playfair:  { display: '"Playfair Display", Georgia, serif',   body: '"Work Sans", system-ui, sans-serif',     label: "Playfair · Work Sans" },
  fraunces:  { display: '"Fraunces", Georgia, serif',           body: '"Hanken Grotesk", system-ui, sans-serif', label: "Fraunces · Hanken" }
};

// text colour to sit on top of an accent button
function inkForAccent(hex) {
  return hex.toLowerCase() === "#d4a017" ? "#3a2c00" : "#ffffff";
}

function MenuSafeTweaks() {
  const [t, setTweak] = useTweaks(MS_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-ink", inkForAccent(t.accent));
    const pair = MS_FONT_PAIRS[t.fontPair] || MS_FONT_PAIRS.cormorant;
    root.style.setProperty("--font-display", pair.display);
    root.style.setProperty("--font-body", pair.body);
    document.body.setAttribute("data-hero", t.hero);
  }, [t.accent, t.fontPair, t.hero]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand accent" />
      <TweakColor
        label="CTA colour"
        value={t.accent}
        options={["#D4A017", "#52B788", "#2D6A4F"]}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakSection label="Typography" />
      <TweakSelect
        label="Font pairing"
        value={t.fontPair}
        options={Object.keys(MS_FONT_PAIRS).map((k) => ({ value: k, label: MS_FONT_PAIRS[k].label }))}
        onChange={(v) => setTweak("fontPair", v)}
      />
      <TweakSection label="Hero layout" />
      <TweakRadio
        label="Arrangement"
        value={t.hero}
        options={["split", "center"]}
        onChange={(v) => setTweak("hero", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<MenuSafeTweaks />);
