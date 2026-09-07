// HeroBackground.jsx — 4-layer animated hero background
// Layers: mesh gradient → waveform → particles → parallax interaction
// Rendered as first child inside a position:relative hero container

function HeroBackground() {
  const parallaxRef = useRef(null);

  // LAYER 4 — Lightweight parallax on mouse move
  // Listener is attached to the PARENT by the consuming component,
  // so we expose the ref for the parallax-able layers.
  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;

    const parent = el.closest('.hero-section');
    if (!parent) return;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Move wave + particles opposite to cursor (max ±6px)
      const layers = el.querySelectorAll('.hero-bg__parallax-layer');
      layers.forEach((layer) => {
        layer.style.transform = `translate(${-x * 6}px, ${-y * 6}px)`;
      });
    };

    parent.addEventListener('mousemove', handleMouseMove);
    return () => parent.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // SVG waveform: gentle sine with 3 soft peaks, doubled for seamless loop
  const wavePath = `
    M0,40
    C80,10 160,70 240,40
    C320,10 400,70 480,40
    C560,10 640,70 720,40
    C800,10 880,70 960,40
    C1040,10 1120,70 1200,40
    C1280,10 1360,70 1440,40
  `;

  const wavePathAccent = `
    M0,50
    C90,20 170,80 260,50
    C350,20 430,80 520,50
    C610,20 690,80 780,50
    C870,20 950,80 1040,50
    C1130,20 1210,80 1300,50
    C1390,20 1440,50 1440,50
  `;

  return (
    <div className="hero-bg" ref={parallaxRef} aria-hidden="true">

      {/* LAYER 1 — Animated mesh gradient */}
      <div className="hero-bg__gradient"></div>

      {/* LAYER 2 — Signature waveform */}
      <div className="hero-bg__wave-wrap hero-bg__parallax-layer">
        <svg
          className="hero-bg__wave-svg"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path className="hero-bg__wave-path" d={wavePath} />
          <path className="hero-bg__wave-path--accent" d={wavePathAccent} />
        </svg>
      </div>

      {/* LAYER 3 — Floating particles / network nodes */}
      <div className="hero-bg__particles hero-bg__parallax-layer">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <div key={n} className={`hero-particle hero-particle--${n}`}></div>
        ))}

        {/* Subtle connector lines between nearby node pairs */}
        <div className="hero-connector hero-connector--1"></div>
        <div className="hero-connector hero-connector--2"></div>
        <div className="hero-connector hero-connector--3"></div>
      </div>
    </div>
  );
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroBackground;
}
