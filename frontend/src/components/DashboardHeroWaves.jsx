// DashboardHeroWaves.jsx — Multi-layer animated flowing SVG waves + ECG Heartbeat line + Parallax
import React, { useEffect, useRef } from 'react';

export default function DashboardHeroWaves() {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const parent = el.closest('.dashboard-hero-banner');
    if (!parent) return;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const layers = el.querySelectorAll('.dashboard-waves-parallax');
      layers.forEach((layer) => {
        layer.style.transform = `translate3d(${-x * 12}px, ${-y * 8}px, 0)`;
      });
    };

    const handleMouseLeave = () => {
      const layers = el.querySelectorAll('.dashboard-waves-parallax');
      layers.forEach((layer) => {
        layer.style.transform = 'translate3d(0, 0, 0)';
      });
    };

    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="dashboard-hero-waves-container" ref={parallaxRef} aria-hidden="true">
      {/* Ambient Pulsing Glow Orbs */}
      <div className="dashboard-hero-glow-1"></div>
      <div className="dashboard-hero-glow-2"></div>

      <div className="dashboard-waves-parallax">
        {/* Layer 1: Deep rolling sine wave */}
        <svg className="dashboard-wave-svg dashboard-wave-layer-1" viewBox="0 0 2400 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dhWaveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            fill="url(#dhWaveGrad1)"
            d="M 0,90 C 150,45 300,135 450,90 C 600,45 750,135 900,90 C 1050,45 1200,90 1200,90 C 1350,45 1500,135 1650,90 C 1800,45 1950,135 2100,90 C 2250,45 2400,90 2400,90 L 2400,180 L 0,180 Z"
          />
          <path
            fill="none"
            stroke="rgba(94, 234, 212, 0.55)"
            strokeWidth="1.6"
            d="M 0,90 C 150,45 300,135 450,90 C 600,45 750,135 900,90 C 1050,45 1200,90 1200,90 C 1350,45 1500,135 1650,90 C 1800,45 1950,135 2100,90 C 2250,45 2400,90 2400,90"
          />
        </svg>

        {/* Layer 2: Mid counter-flowing emerald wave */}
        <svg className="dashboard-wave-svg dashboard-wave-layer-2" viewBox="0 0 2400 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dhWaveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.10" />
            </linearGradient>
          </defs>
          <path
            fill="url(#dhWaveGrad2)"
            d="M 0,110 C 200,60 400,150 600,110 C 800,70 1000,150 1200,110 C 1400,60 1600,150 1800,110 C 2000,70 2200,150 2400,110 L 2400,180 L 0,180 Z"
          />
          <path
            fill="none"
            stroke="rgba(167, 243, 208, 0.65)"
            strokeWidth="2"
            d="M 0,110 C 200,60 400,150 600,110 C 800,70 1000,150 1200,110 C 1400,60 1600,150 1800,110 C 2000,70 2200,150 2400,110"
          />
        </svg>

        {/* Layer 3: Foreground ripple crest wave */}
        <svg className="dashboard-wave-svg dashboard-wave-layer-3" viewBox="0 0 2400 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dhWaveGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            fill="url(#dhWaveGrad3)"
            d="M 0,125 C 100,95 200,155 300,125 C 400,95 500,155 600,125 C 700,95 800,155 900,125 C 1000,95 1100,155 1200,125 C 1300,95 1400,155 1500,125 C 1600,95 1700,155 1800,125 C 1900,95 2000,155 2100,125 C 2200,95 2300,155 2400,125 L 2400,180 L 0,180 Z"
          />
          <path
            fill="none"
            stroke="rgba(204, 251, 241, 0.85)"
            strokeWidth="2.2"
            d="M 0,125 C 100,95 200,155 300,125 C 400,95 500,155 600,125 C 700,95 800,155 900,125 C 1000,95 1100,155 1200,125 C 1300,95 1400,155 1500,125 C 1600,95 1700,155 1800,125 C 1900,95 2000,155 2100,125 C 2200,95 2300,155 2400,125"
          />
        </svg>

        {/* Layer 4: Signature ECG Biometric Heartbeat Line */}
        <svg className="dashboard-wave-layer-ecg" viewBox="0 0 2400 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            className="dashboard-ecg-path"
            d="M 0,48 L 180,48 L 195,43 L 205,53 L 218,12 L 232,82 L 244,43 L 254,51 L 268,48 L 440,48 L 460,40 C 475,40 485,48 500,48 L 600,48 L 780,48 L 795,43 L 805,53 L 818,12 L 832,82 L 844,43 L 854,51 L 868,48 L 1040,48 L 1060,40 C 1075,40 1085,48 1100,48 L 1200,48 L 1380,48 L 1395,43 L 1405,53 L 1418,12 L 1432,82 L 1444,43 L 1454,51 L 1468,48 L 1640,48 L 1660,40 C 1675,40 1685,48 1700,48 L 1800,48 L 1980,48 L 1995,43 L 2005,53 L 2018,12 L 2032,82 L 2044,43 L 2054,51 L 2068,48 L 2240,48 L 2260,40 C 2275,40 2285,48 2300,48 L 2400,48"
          />
          <circle cx="218" cy="12" r="4" className="dashboard-ecg-glow-dot" />
          <circle cx="818" cy="12" r="4" className="dashboard-ecg-glow-dot" />
          <circle cx="1418" cy="12" r="4" className="dashboard-ecg-glow-dot" />
          <circle cx="2018" cy="12" r="4" className="dashboard-ecg-glow-dot" />
        </svg>
      </div>

      {/* Floating Biometric Particles */}
      <div className="dashboard-hero-particles">
        <div className="dh-particle dh-particle--1"></div>
        <div className="dh-particle dh-particle--2"></div>
        <div className="dh-particle dh-particle--3"></div>
        <div className="dh-particle dh-particle--4"></div>
        <div className="dh-particle dh-particle--5"></div>
        <div className="dh-particle dh-particle--6"></div>
      </div>
    </div>
  );
}
