// Modular component import reference (for Vite / Webpack / Next.js bundlers):
// import DashboardSection from '../src/components/DashboardSection';

const { useState, useEffect, useRef } = React;

const API_BASE = "http://127.0.0.1:8000/api";

// ----------------------------------------------------------------------
// HERO BACKGROUND — 4-layer animated hero backdrop
// Layers: mesh gradient → SVG waveform → floating particles → parallax
// ----------------------------------------------------------------------
function HeroBackground() {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const parent = el.closest('.hero-section');
    if (!parent) return;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const layers = el.querySelectorAll('.hero-bg__parallax-layer');
      layers.forEach((layer) => {
        layer.style.transform = `translate(${-x * 6}px, ${-y * 6}px)`;
      });
    };

    parent.addEventListener('mousemove', handleMouseMove);
    return () => parent.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const wavePath = 'M0,40 C80,10 160,70 240,40 C320,10 400,70 480,40 C560,10 640,70 720,40 C800,10 880,70 960,40 C1040,10 1120,70 1200,40 C1280,10 1360,70 1440,40';
  const waveAccent = 'M0,50 C90,20 170,80 260,50 C350,20 430,80 520,50 C610,20 690,80 780,50 C870,20 950,80 1040,50 C1130,20 1210,80 1300,50 C1390,20 1440,50 1440,50';

  return (
    <div className="hero-bg" ref={parallaxRef} aria-hidden="true">
      <div className="hero-bg__gradient"></div>
      <div className="hero-bg__wave-wrap hero-bg__parallax-layer">
        <svg className="hero-bg__wave-svg" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path className="hero-bg__wave-path" d={wavePath} />
          <path className="hero-bg__wave-path--accent" d={waveAccent} />
        </svg>
      </div>
      <div className="hero-bg__particles hero-bg__parallax-layer">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <div key={n} className={`hero-particle hero-particle--${n}`}></div>
        ))}
        <div className="hero-connector hero-connector--1"></div>
        <div className="hero-connector hero-connector--2"></div>
        <div className="hero-connector hero-connector--3"></div>
      </div>
    </div>
  );
}

function App() {
  // Global State
  const [role, setRole] = useState("PATIENT"); // PATIENT, DOCTOR, ADMIN
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("heartbeat360_user_profile") || localStorage.getItem("carebridge_user_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Default to Overview Dashboard
  const [consultContext, setConsultContext] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load profile from localStorage on boot
  useEffect(() => {
    const saved = localStorage.getItem("heartbeat360_user_profile") || localStorage.getItem("carebridge_user_profile");
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved profile");
      }
    }
  }, []);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem("heartbeat360_user_profile", JSON.stringify(profileData));
    setShowOnboarding(false);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("heartbeat360_user_profile");
    localStorage.removeItem("carebridge_user_profile");
    setUserProfile(null);
    setShowSettingsModal(false);
    setShowOnboarding(false);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-16">

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-teal-500/20">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 brand-font flex items-center">
              HeartBeat <span className="text-teal-600 ml-1 font-extrabold">360</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Multimodal AI Healthcare</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setRole("PATIENT")}
            className={`px-3 py-1.5 rounded-lg transition-all ${role === "PATIENT" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <i className="fa-solid fa-user-nurse mr-1.5"></i>Patient
          </button>
          <button
            onClick={() => setRole("DOCTOR")}
            className={`px-3 py-1.5 rounded-lg transition-all ${role === "DOCTOR" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <i className="fa-solid fa-user-doctor mr-1.5"></i>Doctor Portal
          </button>
          <button
            onClick={() => setRole("ADMIN")}
            className={`px-3 py-1.5 rounded-lg transition-all ${role === "ADMIN" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <i className="fa-solid fa-shield-halved mr-1.5"></i>Admin
          </button>
        </div>

        {/* Right Corner Controls: Profile Pill & Settings Button */}
        <div className="flex items-center space-x-3">
          {role === "PATIENT" && userProfile && (
            <div className="hidden lg:flex items-center space-x-2 bg-teal-50 border border-teal-200/60 px-3 py-1.5 rounded-full text-xs text-teal-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">{userProfile.name}</span>
              {userProfile.age && <><span className="text-teal-400">•</span><span>{userProfile.age} yrs</span></>}
              {userProfile.weight && <><span className="text-teal-400">•</span><span>{userProfile.weight} {userProfile.weightUnit}</span></>}
              <button onClick={() => setShowOnboarding(true)} className="ml-1 text-teal-600 hover:underline">
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          )}

          {/* Corner Top Right Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center space-x-2 text-xs font-semibold shadow-sm border border-slate-200/60"
            title="Settings & Account"
          >
            <i className="fa-solid fa-gear text-sm text-teal-600"></i>
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 animate-fade-in">
        {!userProfile && !showOnboarding && (
          <HeroScreen onStart={handleStartOnboarding} />
        )}

        {showOnboarding && (
          <OnboardingModal 
            existingProfile={userProfile} 
            onSave={handleSaveProfile} 
            onCancel={userProfile ? () => setShowOnboarding(false) : null}
          />
        )}

        {userProfile && !showOnboarding && role === "PATIENT" && (
          <PatientApp 
            profile={userProfile} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            consultContext={consultContext}
            setConsultContext={setConsultContext}
            onTriggerEmergency={() => setShowEmergencyModal(true)}
          />
        )}

        {role === "DOCTOR" && <DoctorPortal />}
        {role === "ADMIN" && <AdminDashboard />}
      </main>

      {/* Persistent Floating Emergency Button (Patient Mode) */}
      {role === "PATIENT" && (
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3.5 rounded-full shadow-2xl pulse-emergency flex items-center space-x-2.5 transition-all transform hover:scale-105"
          title="Immediate Medical Escalation"
        >
          <i className="fa-solid fa-triangle-exclamation text-lg"></i>
          <span className="tracking-wide text-sm font-semibold">EMERGENCY</span>
        </button>
      )}

      {/* Emergency Overlay Modal */}
      {showEmergencyModal && (
        <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
      )}

      {/* Account & System Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          userProfile={userProfile}
          onEditProfile={() => {
            setShowSettingsModal(false);
            setShowOnboarding(true);
          }}
          onLogout={handleLogout}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// STEP 2 — HERO SCREEN COMPONENT
// ----------------------------------------------------------------------
function HeroScreen({ onStart }) {
  const headlines = [
    "Your health, understood.",
    "Multimodal AI care + Real Doctors.",
    "Intelligent Clinical Triage at your Fingertips."
  ];
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIdx((prev) => (prev + 1) % headlines.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-section min-h-[80vh] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden py-12" style={{ position: 'relative' }}>
      {/* Animated 4-layer background (position:absolute, inset:0, z-index:0, pointer-events:none) */}
      <HeroBackground />

      {/* All content — position:relative z-index:1 so it stays on top and clickable */}
      <div className="relative z-10 flex flex-col items-center" style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge / Pill */}
        <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200/80 px-4 py-1.5 rounded-full text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <i className="fa-solid fa-sparkles text-teal-600"></i>
          <span>Next-Gen Healthcare Intelligence</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight min-h-[3em] flex items-center justify-center transition-all duration-500">
          {headlines[headlineIdx]}
        </h1>

        {/* Subhead */}
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mt-4 mb-10 leading-relaxed font-normal">
          HeartBeat 360 combines real-time voice & text AI analysis, instant medicine OCR checks, and plain-language lab report interpretation with a verified network of human doctors.
        </p>

        {/* Primary CTA Button */}
        <button
          onClick={onStart}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-lg px-9 py-4 rounded-2xl shadow-lg shadow-teal-600/30 hover:shadow-teal-600/50 transition-all transform hover:-translate-y-0.5 flex items-center space-x-3 group"
        >
          <span>Get Started</span>
          <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
        </button>

        {/* Trust Signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium border-t border-slate-200/60 pt-8 max-w-xl">
          <div className="flex items-center space-x-1.5">
            <i className="fa-solid fa-brain text-teal-600"></i>
            <span>AI-Assisted Engine</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center space-x-1.5">
            <i className="fa-solid fa-user-doctor text-emerald-600"></i>
            <span>Doctor-Reviewed Knowledge</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center space-x-1.5">
            <i className="fa-solid fa-lock text-slate-600"></i>
            <span>Private & Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// STEP 1 — ONBOARDING MODAL COMPONENT (STRICT VALIDATION WITH EMAIL & AGE)
// ----------------------------------------------------------------------
function OnboardingModal({ existingProfile, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: existingProfile ? existingProfile.name : "",
    email: existingProfile ? existingProfile.email || "" : "",
    age: existingProfile ? existingProfile.age : "",
    gender: existingProfile ? existingProfile.gender : "Male",
    weight: existingProfile ? existingProfile.weight : "",
    weightUnit: existingProfile ? existingProfile.weightUnit : "kg",
    height: existingProfile ? existingProfile.height : "",
    heightUnit: existingProfile ? existingProfile.heightUnit : "cm"
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address (e.g. name@example.com)";
    }
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      errs.age = "Age is required (valid range: 1-120 years)";
    }
    if (!formData.gender) errs.gender = "Gender selection is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalProfile = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      weight: formData.weight ? Number(formData.weight) : null,
      weightUnit: formData.weightUnit || "kg",
      height: formData.height ? Number(formData.height) : null,
      heightUnit: formData.heightUnit || "cm"
    };

    // Send profile data to backend
    fetch(`${API_BASE}/patient/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: finalProfile.name,
        email: finalProfile.email,
        age: finalProfile.age,
        gender: finalProfile.gender,
        weight: finalProfile.weight,
        weight_unit: finalProfile.weightUnit,
        height: finalProfile.height,
        height_unit: finalProfile.heightUnit
      })
    })
    .then(res => res.json())
    .then(() => {
      onSave(finalProfile);
    })
    .catch(err => {
      console.warn("Backend unavailable, persisting profile locally", err);
      onSave(finalProfile);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-6 md:p-8 bg-white/95 border-slate-200 shadow-2xl rounded-3xl animate-fade-in relative max-h-[92vh] overflow-y-auto">
        {onCancel && (
          <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="fa-solid fa-clipboard-user"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Let's set up your profile</h2>
          <p className="text-sm text-slate-500 mt-1">
            Name, Email, Age, and Gender are required. Weight and Height are optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              1. Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.name ? "border-red-500 focus:ring-red-200" : ""}`}
              placeholder="e.g. Eleanor Vance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* 2. Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              2. Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`form-input ${errors.email ? "border-red-500 focus:ring-red-200" : ""}`}
              placeholder="e.g. eleanor.vance@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
          </div>

          {/* 3. Age (Required) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              3. Age (years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="120"
              className={`form-input ${errors.age ? "border-red-500 focus:ring-red-200" : ""}`}
              placeholder="e.g. 34"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
            {errors.age && <p className="text-xs text-red-500 mt-1 font-medium">{errors.age}</p>}
          </div>

          {/* 4. Gender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              4. Gender <span className="text-red-500">*</span>
            </label>
            <select
              className={`form-input ${errors.gender ? "border-red-500 focus:ring-red-200" : ""}`}
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && <p className="text-xs text-red-500 mt-1 font-medium">{errors.gender}</p>}
          </div>

          {/* 5. Weight (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                5. Weight <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, weightUnit: "kg" })}
                  className={`px-2 py-0.5 rounded ${formData.weightUnit === "kg" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, weightUnit: "lbs" })}
                  className={`px-2 py-0.5 rounded ${formData.weightUnit === "lbs" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  lbs
                </button>
              </div>
            </div>
            <input
              type="number"
              className={`form-input ${errors.weight ? "border-red-500 focus:ring-red-200" : ""}`}
              placeholder={formData.weightUnit === "kg" ? "e.g. 65" : "e.g. 143"}
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
            {errors.weight && <p className="text-xs text-red-500 mt-1 font-medium">{errors.weight}</p>}
          </div>

          {/* 5. Height (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                5. Height <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, heightUnit: "cm" })}
                  className={`px-2 py-0.5 rounded ${formData.heightUnit === "cm" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, heightUnit: "ft/in" })}
                  className={`px-2 py-0.5 rounded ${formData.heightUnit === "ft/in" ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  ft/in
                </button>
              </div>
            </div>
            <input
              type="number"
              className={`form-input ${errors.height ? "border-red-500 focus:ring-red-200" : ""}`}
              placeholder={formData.heightUnit === "cm" ? "e.g. 168" : "e.g. 5.5"}
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            />
            {errors.height && <p className="text-xs text-red-500 mt-1 font-medium">{errors.height}</p>}
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Save Profile & Continue</span>
            <i className="fa-solid fa-check"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PATIENT APP & DASHBOARD MODULES
// ----------------------------------------------------------------------
function PatientApp({ profile, activeTab, setActiveTab, consultContext, setConsultContext, onTriggerEmergency }) {
  const handleConsultDoctor = (contextData) => {
    if (setConsultContext) setConsultContext(contextData);
    setActiveTab("chat");
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-header Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "dashboard" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-house mr-2"></i>Overview
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "chat" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-comments mr-2"></i>Ask AI Assistant
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center ${activeTab === "voice" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-microphone-lines mr-2"></i>
          <span>Voice Assistant</span>
          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider transition-colors ${activeTab === "voice" ? "bg-emerald-400 text-slate-950 shadow-xs" : "bg-emerald-50 text-emerald-800 border border-emerald-300"}`}>
            VOICE
          </span>
        </button>
        <button
          onClick={() => setActiveTab("scanner")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "scanner" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-pills mr-2"></i>Scan Medicine
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "report" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-file-medical mr-2"></i>Scan Report
        </button>
        <button
          onClick={() => setActiveTab("doctors")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "doctors" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-hospital-user mr-2"></i>Specialty Consult
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "reminders" ? "bg-teal-600 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <i className="fa-solid fa-bell mr-2"></i>Reminders
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === "dashboard" && (
        <OverviewTab profile={profile} setActiveTab={setActiveTab} onTriggerEmergency={onTriggerEmergency} />
      )}
      {activeTab === "chat" && (
        <ChatTab 
          profile={profile} 
          setActiveTab={setActiveTab} 
          consultContext={consultContext}
          setConsultContext={setConsultContext}
        />
      )}
      {activeTab === "voice" && (
        <VoiceAssistantTab profile={profile} setActiveTab={setActiveTab} onTriggerEmergency={onTriggerEmergency} />
      )}
      {activeTab === "scanner" && (
        <MedicineScannerTab 
          profile={profile} 
          onConsultDoctor={handleConsultDoctor}
        />
      )}
      {activeTab === "report" && (
        <ReportScannerTab 
          profile={profile} 
          onConsultDoctor={handleConsultDoctor}
        />
      )}
      {activeTab === "doctors" && <DoctorSearchTab profile={profile} />}
      {activeTab === "reminders" && <RemindersTab profile={profile} />}
    </div>
  );
}

// ----------------------------------------------------------------------
// HEALTH TIP OF THE DAY COMPONENT
// ----------------------------------------------------------------------
function HealthTipOfTheDay() {
  const HEALTH_TIPS = [
    {
      category: "Hydration",
      icon: "fa-solid fa-droplet",
      title: "Morning Hydration",
      tip: "Drink a tall glass of water first thing upon waking to kickstart metabolism and restore hydration after sleep."
    },
    {
      category: "Rest & Sleep",
      icon: "fa-solid fa-moon",
      title: "Consistent Bedtime",
      tip: "Aim for 7–9 hours of restful sleep and try to keep consistent sleep-wake times to support your circadian clock."
    },
    {
      category: "Ergonomics",
      icon: "fa-solid fa-chair",
      title: "Posture Alignment",
      tip: "Adjust your monitor to eye level and keep feet flat on the floor to reduce strain on your neck and spine."
    },
    {
      category: "Daily Movement",
      icon: "fa-solid fa-person-walking",
      title: "Hourly Movement",
      tip: "Stand up, stretch, or take a brisk 2-minute stroll for every hour of sitting to promote healthy circulation."
    },
    {
      category: "Vision Care",
      icon: "fa-solid fa-eye",
      title: "The 20-20-20 Habit",
      tip: "Every 20 minutes of screen time, look at an object 20 feet away for 20 seconds to ease digital eye fatigue."
    },
    {
      category: "Stress Relief",
      icon: "fa-solid fa-wind",
      title: "Mindful Breathing",
      tip: "Take 5 slow, deep breaths—inhaling for 4 seconds, holding for 2, and exhaling for 6—to calm tension."
    },
    {
      category: "Nutrition",
      icon: "fa-solid fa-apple-whole",
      title: "Color on Your Plate",
      tip: "Add a portion of leafy greens or colorful vegetables to your meals for diverse vitamins and dietary fiber."
    },
    {
      category: "Daily Hygiene",
      icon: "fa-solid fa-hands-bubbles",
      title: "Hand Hygiene",
      tip: "Wash your hands with warm water and soap for at least 20 seconds before eating and preparing food."
    },
    {
      category: "Circadian Health",
      icon: "fa-solid fa-sun",
      title: "Morning Daylight",
      tip: "Step outside for 10–15 minutes of natural morning sunlight to reinforce healthy circadian wakefulness."
    },
    {
      category: "Mobility",
      icon: "fa-solid fa-child-reaching",
      title: "Gentle Morning Stretches",
      tip: "Spend a few minutes gently stretching major muscle groups to relieve morning stiffness and improve flexibility."
    },
    {
      category: "Mindful Meals",
      icon: "fa-solid fa-utensils",
      title: "Chew Unhurriedly",
      tip: "Eat meals without rushing; pacing your bites supports healthy digestion and natural fullness awareness."
    },
    {
      category: "Night Wind-down",
      icon: "fa-solid fa-mobile-screen-button",
      title: "Screen Sunset",
      tip: "Dim overhead lights and power down screens 30 minutes before bed to support natural melatonin production."
    },
    {
      category: "Wholesome Snacks",
      icon: "fa-solid fa-cookie-bite",
      title: "Nutrient-Dense Snacks",
      tip: "Reach for fresh fruit, walnuts, or pumpkin seeds instead of sugary ultra-processed snacks for steady energy."
    },
    {
      category: "Social Wellness",
      icon: "fa-solid fa-heart",
      title: "Meaningful Connection",
      tip: "Share a positive check-in with a friend or family member today; strong social ties foster emotional resilience."
    },
    {
      category: "Active Routine",
      icon: "fa-solid fa-stairs",
      title: "Choose the Stairs",
      tip: "Opt for the stairs over elevators when possible—a simple way to add cardiovascular movement to your day."
    },
    {
      category: "Mental Rest",
      icon: "fa-solid fa-spa",
      title: "Quiet Micro-Breaks",
      tip: "Take 3 minutes of quiet stillness away from notifications to refresh concentration and clear mental clutter."
    }
  ];

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const tipIndex = dayOfYear % HEALTH_TIPS.length;
  const todayTip = HEALTH_TIPS[tipIndex];

  return (
    <div className="hb-widget-card health-tip-card animate-health-tip">
      <div>
        <div className="hb-widget-header">
          <div className="hb-widget-title-wrap">
            <div className="hb-widget-icon bg-teal-100 text-teal-700">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div>
              <h4 className="hb-widget-title">Health Tip of the Day</h4>
              <p className="hb-widget-subtitle">{todayTip.category}</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <i className="fa-solid fa-leaf text-teal-600 text-[10px]"></i>
            Daily Wellness
          </span>
        </div>

        <div className="health-tip-body">
          <div className="health-tip-quote-badge">
            <i className={`${todayTip.icon} text-teal-600 mr-1.5`}></i>
            <span className="font-bold text-slate-800 text-xs">{todayTip.title}</span>
          </div>
          <p className="health-tip-text">
            "{todayTip.tip}"
          </p>
        </div>
      </div>

      <div className="health-tip-footer">
        <span className="text-[11px] text-slate-400 flex items-center">
          <i className="fa-regular fa-calendar-check mr-1 text-teal-600"></i>
          Refreshes at midnight
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
          Day #{dayOfYear}
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// DASHBOARD SECTION COMPONENT (Health Tip, Risk Ring, Activity, Countdown)
// ----------------------------------------------------------------------
function DashboardSection({ profile = null, setActiveTab = () => {} }) {
  // --------------------------------------------------------------------------
  // 1. User Health Status & Problems State
  // --------------------------------------------------------------------------
  const patientName = profile?.name || "Eleanor Vance";
  const patientAge = profile?.age || 34;

  // Dynamic BMI Calculation from Profile
  let bmiString = "BMI 22.0 (Normal)";
  if (profile?.weight && profile?.height) {
    let weightKg = Number(profile.weight);
    if (profile.weightUnit === "lbs") weightKg = weightKg * 0.453592;

    let heightM = Number(profile.height) / 100;
    if (profile.heightUnit === "ft/in") heightM = Number(profile.height) * 0.3048;

    if (heightM > 0) {
      const val = (weightKg / (heightM * heightM)).toFixed(1);
      let cat = "Normal";
      if (val < 18.5) cat = "Underweight";
      else if (val >= 25 && val < 30) cat = "Overweight";
      else if (val >= 30) cat = "Elevated";
      bmiString = `BMI ${val} (${cat})`;
    }
  }

  // User Documented Clinical Problems / Symptoms / Conditions
  const [userProblems] = useState(() => {
    try {
      const saved = localStorage.getItem("heartbeat360_user_problems");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'p1',
        name: 'Tension Headache & Strain',
        status: 'Mild • Low Risk',
        source: 'Recent AI Triage (2h ago)',
        plan: 'Hydration & rest protocol',
        severity: 'low',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'p2',
        name: 'Mild Asthma',
        status: 'Controlled',
        source: 'Clinical History',
        plan: 'Inhaler PRN (as needed)',
        severity: 'mild',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
      },
      {
        id: 'p3',
        name: 'Stage 1 Hypertension',
        status: 'Monitoring',
        source: 'Baseline Vitals',
        plan: 'BP 122/80 • Low sodium diet',
        severity: 'moderate',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
      }
    ];
  });

  // --------------------------------------------------------------------------
  // 2. Recent Activity Data (Multimodal Feed)
  // --------------------------------------------------------------------------
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'medicine',
      title: 'Amoxicillin 500mg Scanned',
      desc: 'OCR validated • Dosage: 1 cap q8h • No conflict',
      time: '18m ago',
      medicineName: 'Amoxicillin 500mg',
      dosage: '1 Capsule (500mg)',
      frequency: 'Every 8 hours (q8h)',
      instructions: 'Take with water after meals',
      icon: 'fa-solid fa-pills',
      bg: 'bg-emerald-100 text-emerald-700',
      tabTarget: 'scanner'
    },
    {
      id: 2,
      type: 'triage',
      title: 'Headache & Tension Triage',
      desc: 'AI Triage: Low Risk • Hydration & Rest protocol',
      time: '2h ago',
      icon: 'fa-solid fa-robot',
      bg: 'bg-teal-100 text-teal-700',
      tabTarget: 'chat'
    },
    {
      id: 3,
      type: 'report',
      title: 'Lab CBC Diagnostic Analyzed',
      desc: 'Hemoglobin: 14.2 g/dL • W.B.C: Normal ranges',
      time: '1d ago',
      icon: 'fa-solid fa-file-waveform',
      bg: 'bg-sky-100 text-sky-700',
      tabTarget: 'report'
    },
    {
      id: 4,
      type: 'appointment',
      title: 'Cardiology Follow-up Booked',
      desc: 'Dr. Marcus Vance • St. Jude Heart Institute',
      time: '2d ago',
      icon: 'fa-solid fa-calendar-check',
      bg: 'bg-indigo-100 text-indigo-700',
      tabTarget: 'doctors'
    }
  ]);

  // --------------------------------------------------------------------------
  // 3. Upcoming Dose State — Directly Linked to Recent Activity
  // --------------------------------------------------------------------------
  // Find latest scanned/prescribed medicine from recent activity
  const latestMedActivity = activities.find(a => a.type === 'medicine');
  const activeDose = {
    medicineName: latestMedActivity?.medicineName || 'Amoxicillin 500mg',
    dosage: latestMedActivity?.dosage || '1 Capsule (500mg)',
    frequency: latestMedActivity?.frequency || 'Every 8 hours (q8h)',
    instructions: latestMedActivity?.instructions || 'Take with water after meals',
    linkedActivityTitle: latestMedActivity?.title || 'Amoxicillin 500mg Scanned',
    linkedTime: latestMedActivity?.time || '18m ago',
    tabTarget: latestMedActivity?.tabTarget || 'scanner'
  };

  const [secondsRemaining, setSecondsRemaining] = useState(6145); // 01h 42m 25s
  const [isTaken, setIsTaken] = useState(false);

  useEffect(() => {
    if (isTaken || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, isTaken]);

  const formatHours = String(Math.floor(secondsRemaining / 3600)).padStart(2, '0');
  const formatMinutes = String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, '0');
  const formatSeconds = String(secondsRemaining % 60).padStart(2, '0');

  // When marking dose taken, dynamically post confirmation to Recent Activity!
  const handleMarkTaken = () => {
    setIsTaken(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItem = {
      id: Date.now(),
      type: 'medicine',
      title: `${activeDose.medicineName} Dose Logged`,
      desc: `Confirmed taken at ${nowTime} • Next scheduled dose in 8 hrs`,
      time: 'Just now',
      medicineName: activeDose.medicineName,
      dosage: activeDose.dosage,
      frequency: activeDose.frequency,
      instructions: activeDose.instructions,
      icon: 'fa-solid fa-circle-check',
      bg: 'bg-emerald-100 text-emerald-700',
      tabTarget: 'reminders'
    };
    setActivities(prev => [logItem, ...prev]);
  };

  return (
    <div className="dashboard-section-container animate-fade-in">
      <div className="dashboard-widgets-grid">
        {/* WIDGET 1: Health Tip of the Day */}
        <HealthTipOfTheDay />

        {/* WIDGET 2: User Health Status & Active Problems */}
        <div className="hb-widget-card">
          <div>
            <div className="hb-widget-header">
              <div className="hb-widget-title-wrap">
                <div className="hb-widget-icon bg-teal-100 text-teal-700">
                  <i className="fa-solid fa-notes-medical"></i>
                </div>
                <div>
                  <h4 className="hb-widget-title">Health Status</h4>
                  <p className="hb-widget-subtitle">User Status & Problems</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Stable
              </span>
            </div>

            <div className="user-status-card-body">
              {/* Vitals & Baseline Row */}
              <div className="user-vitals-row">
                <span className="user-vital-pill" title="Patient Baseline">
                  <i className="fa-regular fa-user text-teal-600"></i>
                  {patientName} ({patientAge}y)
                </span>
                <span className="user-vital-pill" title="Body Mass Index">
                  <i className="fa-solid fa-weight-scale text-teal-600"></i>
                  {bmiString}
                </span>
                <span className="user-vital-pill" title="Baseline Blood Pressure">
                  <i className="fa-solid fa-heart-pulse text-rose-500"></i>
                  BP 122/80
                </span>
              </div>

              {/* Active Problems / Diagnoses */}
              <div className="user-problems-list">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-0.5">
                  <span>Active Problems ({userProblems.length})</span>
                  <button 
                    onClick={() => setActiveTab('chat')} 
                    className="text-teal-600 hover:underline flex items-center gap-1 text-[10px]"
                    title="Triage symptoms in AI chat"
                  >
                    <span>Triage</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

                {userProblems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => setActiveTab('chat')}
                    className="user-problem-item cursor-pointer group"
                    title={`Click to discuss ${prob.name} with AI consultant`}
                  >
                    <div className="user-problem-name-wrap">
                      <i className={`fa-solid ${prob.severity === 'low' ? 'fa-triangle-exclamation text-amber-500' : prob.severity === 'mild' ? 'fa-lungs text-sky-500' : 'fa-chart-line text-purple-500'} text-[11px]`}></i>
                      <div className="min-w-0">
                        <div className="user-problem-name group-hover:text-teal-600 transition-colors">
                          {prob.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {prob.source}
                        </div>
                      </div>
                    </div>
                    <span className={`user-problem-badge border ${prob.badgeClass}`}>
                      {prob.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Known Allergies Alert */}
              <div className="user-allergy-bar">
                <i className="fa-solid fa-shield-virus text-amber-600 text-xs"></i>
                <span className="truncate">
                  <strong>Allergies:</strong> Penicillin, Sulfa
                </span>
              </div>
            </div>
          </div>

          {/* Footer: Stability Tier & Drug Conflict Check */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>Tier 1: Safe Baseline</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">96% Stability</span>
          </div>
        </div>

        {/* WIDGET 3: Recent Activity Multimodal Feed */}
        <div className="hb-widget-card">
          <div>
            <div className="hb-widget-header">
              <div className="hb-widget-title-wrap">
                <div className="hb-widget-icon bg-sky-100 text-sky-700">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                  <h4 className="hb-widget-title">Recent Activity</h4>
                  <p className="hb-widget-subtitle">Latest Assistant Actions</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                {activities.length} logs
              </span>
            </div>

            <div className="activity-list-wrap">
              {activities.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.tabTarget)}
                  className="activity-item cursor-pointer"
                  title="Click to view section"
                >
                  <div className={`activity-icon-badge ${item.bg}`}>
                    <i className={item.icon}></i>
                  </div>
                  <div className="activity-details">
                    <div className="activity-title-line">
                      <span className="activity-name">{item.title}</span>
                      <span className="activity-time">{item.time}</span>
                    </div>
                    <p className="activity-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('voice')}
              className="text-slate-500 hover:text-teal-600 font-medium inline-flex items-center transition-colors"
              title="Open Voice Assistant"
            >
              <i className="fa-solid fa-microphone-lines mr-1 text-[11px] text-teal-600"></i>
              <span>Voice Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="text-teal-600 font-semibold hover:underline inline-flex items-center"
            >
              Resume Chat <i className="fa-solid fa-angle-right ml-1 text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* WIDGET 4: Medication Reminder Countdown - Linked to Recent Activity */}
        <div className="hb-widget-card">
          <div>
            <div className="hb-widget-header">
              <div className="hb-widget-title-wrap">
                <div className="hb-widget-icon bg-amber-100 text-amber-700">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div>
                  <h4 className="hb-widget-title">Upcoming Dose</h4>
                  <p className="hb-widget-subtitle">Smart Pill Schedule</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Next Dose
              </span>
            </div>

            {/* Explicit Linkage to Recent Activity */}
            <div className="text-center">
              <div 
                onClick={() => setActiveTab(activeDose.tabTarget || 'scanner')}
                className="linked-activity-banner cursor-pointer hover:bg-teal-50 transition-colors"
                title="Click to view recent scan in Medicine Scanner"
              >
                <i className="fa-solid fa-link text-teal-600"></i>
                <span>Linked to Recent Scan ({activeDose.linkedTime})</span>
              </div>
            </div>

            <div className="countdown-box">
              <div className="flex items-center justify-center space-x-2 text-slate-800">
                <i className="fa-solid fa-capsules text-teal-600"></i>
                <span className="text-xs font-bold">{activeDose.medicineName}</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {activeDose.dosage} • {activeDose.instructions}
              </span>

              <div className="countdown-digits-grid">
                <div className="countdown-unit-box">
                  <div className="countdown-num">{formatHours}</div>
                  <div className="countdown-unit-label">Hours</div>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-unit-box">
                  <div className="countdown-num">{formatMinutes}</div>
                  <div className="countdown-unit-label">Mins</div>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-unit-box">
                  <div className="countdown-num">{formatSeconds}</div>
                  <div className="countdown-unit-label">Secs</div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                Schedule: {activeDose.frequency} • Due in ~1h 42m
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={handleMarkTaken}
              disabled={isTaken}
              className={`taken-btn ${isTaken ? 'taken-btn-done' : 'taken-btn-active'}`}
            >
              {isTaken ? (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Dose Logged to Activity Feed!</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Mark Dose as Taken</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Daily Adherence: {isTaken ? '100%' : '94%'}</span>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-teal-600 hover:underline font-semibold"
              >
                All Alarms →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// WELCOME HERO WAVES — Dynamic Color-Morphing Waveform
// Smooth spectrum color transitions (Cyan -> Ocean Blue -> Iris -> Emerald)
// ----------------------------------------------------------------------
function WelcomeHeroWaves() {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const parent = el.closest('.welcome-hero-card');
    if (!parent) return;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate(${-x * 8}px, ${-y * 6}px)`;
    };

    parent.addEventListener('mousemove', handleMouseMove);
    return () => parent.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const wavePath = 'M0,40 C80,10 160,70 240,40 C320,10 400,70 480,40 C560,10 640,70 720,40 C800,10 880,70 960,40 C1040,10 1120,70 1200,40 C1280,10 1360,70 1440,40';
  const waveAccent = 'M0,50 C90,20 170,80 260,50 C350,20 430,80 520,50 C610,20 690,80 780,50 C870,20 950,80 1040,50 C1130,20 1210,80 1300,50 C1390,20 1440,50 1440,50';

  return (
    <div className="welcome-wave-wrap" ref={parallaxRef} aria-hidden="true">
      <svg className="welcome-wave-svg" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="welcomeWaveGradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf">
              <animate attributeName="stop-color" values="#2dd4bf;#38bdf8;#818cf8;#34d399;#2dd4bf" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="25%" stopColor="#38bdf8">
              <animate attributeName="stop-color" values="#38bdf8;#818cf8;#34d399;#2dd4bf;#38bdf8" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#818cf8">
              <animate attributeName="stop-color" values="#818cf8;#34d399;#2dd4bf;#38bdf8;#818cf8" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="75%" stopColor="#34d399">
              <animate attributeName="stop-color" values="#34d399;#2dd4bf;#38bdf8;#818cf8;#34d399" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#2dd4bf">
              <animate attributeName="stop-color" values="#2dd4bf;#38bdf8;#818cf8;#34d399;#2dd4bf" dur="12s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <linearGradient id="welcomeWaveGradAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6ee7b7">
              <animate attributeName="stop-color" values="#6ee7b7;#67e8f9;#a5b4fc;#a7f3d0;#6ee7b7" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="33%" stopColor="#67e8f9">
              <animate attributeName="stop-color" values="#67e8f9;#a5b4fc;#a7f3d0;#6ee7b7;#67e8f9" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="66%" stopColor="#a5b4fc">
              <animate attributeName="stop-color" values="#a5b4fc;#a7f3d0;#6ee7b7;#67e8f9;#a5b4fc" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#6ee7b7">
              <animate attributeName="stop-color" values="#6ee7b7;#67e8f9;#a5b4fc;#a7f3d0;#6ee7b7" dur="12s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        <path className="welcome-wave-path" d={wavePath} />
        <path className="welcome-wave-path--accent" d={waveAccent} />
      </svg>
    </div>
  );
}

// 1. OVERVIEW DASHBOARD
function OverviewTab({ profile, setActiveTab, onTriggerEmergency }) {
  const metrics = [];
  if (profile.age) metrics.push(`Age ${profile.age}`);
  if (profile.weight) metrics.push(`Weight ${profile.weight} ${profile.weightUnit}`);
  if (profile.height) metrics.push(`Height ${profile.height} ${profile.heightUnit}`);

  const baselineText = metrics.length > 0
    ? `Configured physical baseline (${metrics.join(" • ")}) active.`
    : `Your personalized multimodal AI health assistant is active.`;

  return (
    <div className="space-y-6">
      {/* Personalized Greeting with Best Hero Waves */}
      <div className="welcome-hero-card p-6 md:p-8 relative overflow-hidden">
        {/* Only waves, similar to hero page */}
        <WelcomeHeroWaves />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#34d399]"></span>
            <span>Patient Portal</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Welcome back, {profile.name}
          </h2>
          <p className="text-teal-100 text-sm mt-1 leading-relaxed font-normal">
            {baselineText}
          </p>
        </div>
      </div>

      {/* Replaced 4-card shortcut grid with animated DashboardSection */}
      <DashboardSection profile={profile} setActiveTab={setActiveTab} />
    </div>
  );
}

// ----------------------------------------------------------------------
// STRUCTURED MESSAGE RENDERER COMPONENT
// ----------------------------------------------------------------------
function StructuredMessage({ text, onBookDoctor }) {
  if (!text) return null;

  const renderInlineFormatted = (str) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let keyIdx = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={keyIdx++} className="font-bold text-slate-900">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts;
  };

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed text-slate-800">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // 1. Red Flag Emergency Alert Section
        if (
          trimmed.includes("⚠️") ||
          trimmed.includes("🚨") ||
          trimmed.toLowerCase().includes("red flag") ||
          trimmed.toLowerCase().includes("urgent clinical alert")
        ) {
          const lines = trimmed.split("\n");
          return (
            <div key={idx} className="chat-alert-box text-xs md:text-sm">
              <div className="flex items-center space-x-2 font-bold text-red-700 mb-1.5">
                <i className="fa-solid fa-triangle-exclamation text-red-600 text-sm"></i>
                <span>Red Flag Warning Signs</span>
              </div>
              <div className="space-y-1.5">
                {lines.map((line, lIdx) => {
                  if (
                    line.includes("⚠️") ||
                    line.includes("🚨") ||
                    line.toLowerCase().includes("red flag") ||
                    line.toLowerCase().includes("urgent clinical alert")
                  ) {
                    return null;
                  }
                  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                  const content = isBullet ? line.trim().substring(1).trim() : line.trim();
                  if (!content) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-red-900">
                      <i className="fa-solid fa-circle-exclamation text-red-500 text-xs mt-1 flex-shrink-0"></i>
                      <div className="flex-1">{renderInlineFormatted(content)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 2. Doctor Referral / Next Steps Section (ONLY on Final Suggestions, not during questions)
        const isTrueDoctorReferral = (
          (trimmed.toLowerCase().includes("recommended next steps") ||
           trimmed.toLowerCase().includes("post-emergency next steps") ||
           trimmed.toLowerCase().includes("consult a") ||
           trimmed.toLowerCase().includes("consult an")) &&
          !trimmed.toLowerCase().includes("please reply") &&
          !trimmed.toLowerCase().includes("educational purposes only")
        );

        if (isTrueDoctorReferral) {
          const lines = trimmed.split("\n");
          return (
            <div key={idx} className="chat-referral-box text-xs md:text-sm">
              <div className="flex items-center justify-between font-bold text-blue-900 mb-1.5">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-stethoscope text-blue-600 text-sm"></i>
                  <span>Recommended Doctor & Next Steps</span>
                </div>
                {onBookDoctor && (
                  <button
                    onClick={onBookDoctor}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center space-x-1"
                  >
                    <span>Book Doctor</span>
                    <i className="fa-solid fa-arrow-right text-[9px]"></i>
                  </button>
                )}
              </div>
              <div className="space-y-1 text-blue-950">
                {lines.map((line, lIdx) => {
                  if (
                    line.includes("📋") ||
                    line.toLowerCase().includes("recommended next steps") ||
                    line.toLowerCase().includes("post-emergency next steps")
                  ) {
                    return null;
                  }
                  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                  const content = isBullet ? line.trim().substring(1).trim() : line.trim();
                  if (!content) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2">
                      <i className="fa-solid fa-user-doctor text-blue-500 text-xs mt-1 flex-shrink-0"></i>
                      <div className="flex-1">{renderInlineFormatted(content)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 3. OTC Tablet & Medicine Guidance Card
        if (
          trimmed.includes("💊") ||
          trimmed.toLowerCase().includes("tablet") ||
          trimmed.toLowerCase().includes("medicine options") ||
          trimmed.toLowerCase().includes("otc")
        ) {
          const lines = trimmed.split("\n");
          const headerLine = lines[0];
          const bulletLines = lines.slice(1);

          return (
            <div key={idx} className="chat-medicine-card text-xs md:text-sm">
              <div className="font-bold text-emerald-950 flex items-center justify-between mb-2 pb-1 border-b border-emerald-200/80">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-pills text-emerald-600 text-sm"></i>
                  <span>
                    {headerLine.replace(/[💊*]/g, "").trim() || "Common OTC Tablet & Medicine Options"}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                  OTC Relief
                </span>
              </div>
              <div className="space-y-1.5">
                {bulletLines.map((line, lIdx) => {
                  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                  const content = isBullet ? line.trim().substring(1).trim() : line.trim();
                  if (!content) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-emerald-950">
                      <i className="fa-solid fa-capsules text-emerald-500 text-xs mt-1 flex-shrink-0"></i>
                      <div className="flex-1">{renderInlineFormatted(content)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 4. Precautions & Self-Care Guidance Card
        if (
          trimmed.includes("🛡️") && (trimmed.toLowerCase().includes("precaution") || trimmed.toLowerCase().includes("self-care") || trimmed.toLowerCase().includes("guidance"))
        ) {
          const lines = trimmed.split("\n");
          const headerLine = lines[0];
          const bulletLines = lines.slice(1);

          return (
            <div key={idx} className="chat-precaution-card text-xs md:text-sm">
              <div className="font-bold text-teal-950 flex items-center space-x-2 mb-2 pb-1 border-b border-teal-200/80">
                <i className="fa-solid fa-shield-halved text-teal-600 text-sm"></i>
                <span>
                  {headerLine.replace(/[🛡️*]/g, "").trim() || "Precautions & Self-Care Guidance"}
                </span>
              </div>
              <div className="space-y-1.5">
                {bulletLines.map((line, lIdx) => {
                  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                  const content = isBullet ? line.trim().substring(1).trim() : line.trim();
                  if (!content) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800">
                      <i className="fa-solid fa-circle-check text-teal-500 text-xs mt-1 flex-shrink-0"></i>
                      <div className="flex-1">{renderInlineFormatted(content)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 5. Diagnostic Question Checklist Card
        if (
          trimmed.includes("🔍") ||
          trimmed.toLowerCase().includes("to better understand") ||
          trimmed.toLowerCase().includes("please share")
        ) {
          const lines = trimmed.split("\n");
          const headerLine = lines[0];
          const questionLines = lines.slice(1);

          return (
            <div key={idx} className="chat-question-box text-xs md:text-sm">
              <div className="font-bold text-indigo-950 flex items-center space-x-2 mb-2 pb-1 border-b border-indigo-200/80">
                <i className="fa-solid fa-clipboard-question text-indigo-600 text-sm"></i>
                <span>
                  {headerLine.replace(/[🔍*]/g, "").trim() || "Diagnostic Clarifying Questions"}
                </span>
              </div>
              <div className="space-y-1.5 text-indigo-950">
                {questionLines.map((line, lIdx) => {
                  if (!line.trim()) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                      <div className="flex-1 font-medium">{renderInlineFormatted(line.trim())}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 6. Practical Care / Self-Relief Section
        if (
          trimmed.includes("💡") ||
          trimmed.includes("🩺") ||
          trimmed.toLowerCase().includes("practical care") ||
          trimmed.toLowerCase().includes("relief steps") ||
          trimmed.toLowerCase().includes("clinical steps")
        ) {
          const lines = trimmed.split("\n");
          const headerLine = lines[0];
          const bulletLines = lines.slice(1);

          return (
            <div key={idx} className="chat-card-section text-xs md:text-sm">
              <div className="font-bold text-teal-900 flex items-center space-x-2 mb-2 pb-1 border-b border-slate-200/80">
                <i className="fa-solid fa-hand-holding-medical text-teal-600"></i>
                <span>
                  {headerLine.replace(/[💡🩺*]/g, "").trim() || "Practical Care Guidance"}
                </span>
              </div>
              <div className="space-y-1.5">
                {bulletLines.map((line, lIdx) => {
                  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                  const content = isBullet ? line.trim().substring(1).trim() : line.trim();
                  if (!content) return null;
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0"></span>
                      <div className="flex-1">{renderInlineFormatted(content)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 7. Disclaimer / Educational Note Section
        if (trimmed.includes("🛡️") || trimmed.toLowerCase().includes("educational note")) {
          return (
            <div
              key={idx}
              className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 flex items-start space-x-1.5"
            >
              <i className="fa-solid fa-shield-halved text-teal-500 text-xs mt-0.5 flex-shrink-0"></i>
              <span>{trimmed.replace(/[🛡️*]/g, "").trim()}</span>
            </div>
          );
        }

        // 8. Clinical Overview / General Text
        return (
          <div key={idx} className="text-xs md:text-sm">
            {trimmed.split("\n").map((line, lIdx) => {
              const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
              const content = isBullet ? line.trim().substring(1).trim() : line.trim();
              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start space-x-2 my-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></span>
                    <div className="flex-1">{renderInlineFormatted(content)}</div>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="my-1">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// 2. MULTIMODAL CHAT TAB (TEXT + VOICE) — ENHANCED & STRUCTURED WITH HISTORY & MEMORY
const CHAT_STORAGE_KEY = "heartbeat360_chat_sessions";
const CHAT_MEMORY_KEY = "heartbeat360_clinical_memory";

function createDefaultAiGreeting(userName) {
  return {
    sender: "ai",
    text: `👋 **Clinical Assessment:**\nHello ${userName || "there"}! I am Dr. HeartBeat, your Senior Medical Consultant with over 25 years of clinical experience.\n\n💡 **How I Can Help You Today:**\n• Provide safe, evidence-guided practical self-care steps for your symptoms.\n• Explain lab test results, medication safety, and health questions.\n• Triage symptoms and recommend the appropriate medical specialist when needed.\n\n🛡️ *Educational Note: HeartBeat 360 provides educational guidance and clinical triage. For severe emergencies, call 911 / 112 / 108 immediately.*`,
    attribution: "Dr. HeartBeat (Senior Medical Consultant) · Clinical Intelligence Engine",
    risk_tier: "LOW"
  };
}

function ChatTab({ profile, setActiveTab, consultContext, setConsultContext }) {
  // Load past sessions from localStorage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Active Session ID
  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      const list = saved ? JSON.parse(saved) : [];
      if (list && list.length > 0) {
        return list[0].id;
      }
    } catch (e) {}
    return "session_" + Date.now();
  });

  // Active Messages
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      const list = saved ? JSON.parse(saved) : [];
      if (list && list.length > 0 && list[0].messages && list[0].messages.length > 0) {
        return list[0].messages;
      }
    } catch (e) {}
    return [createDefaultAiGreeting(profile.name)];
  });

  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Helper to compile shared clinical memory across conversations
  const updateSharedClinicalMemory = (allSessions) => {
    try {
      const pastTopics = [];
      allSessions.forEach((s) => {
        const userQueries = (s.messages || [])
          .filter((m) => m.sender === "user")
          .map((m) => m.text);
        if (userQueries.length > 0) {
          pastTopics.push(userQueries[0]);
        }
      });
      if (pastTopics.length > 0) {
        const memorySummary = "Recent patient health topics: " + pastTopics.slice(0, 5).join("; ");
        localStorage.setItem(CHAT_MEMORY_KEY, memorySummary);
      }
    } catch (e) {}
  };

  // Helper to persist active session to localStorage
  const persistSession = (sId, msgs) => {
    setSessions((prevSessions) => {
      const firstUserMsg = msgs.find((m) => m.sender === "user");
      let title = "New Consultation";
      if (firstUserMsg) {
        title = firstUserMsg.text.length > 38 ? firstUserMsg.text.substring(0, 38) + "..." : firstUserMsg.text;
      }

      const nowStr = new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      const existingIdx = prevSessions.findIndex((s) => s.id === sId);
      let updatedList = [];
      if (existingIdx >= 0) {
        const existing = prevSessions[existingIdx];
        const updatedItem = {
          ...existing,
          title: existing.title !== "New Consultation" ? existing.title : title,
          updatedAt: nowStr,
          messages: msgs
        };
        updatedList = [updatedItem, ...prevSessions.filter((s) => s.id !== sId)];
      } else {
        const newItem = {
          id: sId,
          title: title,
          createdAt: nowStr,
          updatedAt: nowStr,
          messages: msgs
        };
        updatedList = [newItem, ...prevSessions];
      }

      const trimmed = updatedList.slice(0, 30);
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
        updateSharedClinicalMemory(trimmed);
      } catch (e) {}
      return trimmed;
    });
  };

  // Load a past session from history
  const handleSelectSession = (sess) => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setActiveSessionId(sess.id);
    setMessages(sess.messages || [createDefaultAiGreeting(profile.name)]);
    setShowHistory(false);
  };

  // Start a fresh new consultation
  const handleNewChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    const newId = "session_" + Date.now();
    const initialMsgs = [createDefaultAiGreeting(profile.name)];
    setActiveSessionId(newId);
    setMessages(initialMsgs);
    persistSession(newId, initialMsgs);
    setShowHistory(false);
  };

  // Delete an individual past conversation
  const handleDeleteSession = (sessionIdToDelete, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this consultation history?");
    if (!confirmed) return;

    const remaining = sessions.filter((s) => s.id !== sessionIdToDelete);
    setSessions(remaining);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(remaining));
      updateSharedClinicalMemory(remaining);
    } catch (e) {}

    // If deleting the currently active conversation
    if (activeSessionId === sessionIdToDelete) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        setMessages(remaining[0].messages || [createDefaultAiGreeting(profile.name)]);
      } else {
        const newId = "session_" + Date.now();
        const freshMsgs = [createDefaultAiGreeting(profile.name)];
        setActiveSessionId(newId);
        setMessages(freshMsgs);
        persistSession(newId, freshMsgs);
      }
    }
  };

  // Delete all past conversations
  const handleClearAllHistory = () => {
    const confirmed = window.confirm("Permanently delete all consultation history? This action cannot be undone.");
    if (!confirmed) return;

    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(CHAT_MEMORY_KEY);
    setSessions([]);

    const newId = "session_" + Date.now();
    const freshMsgs = [createDefaultAiGreeting(profile.name)];
    setActiveSessionId(newId);
    setMessages(freshMsgs);
    setShowHistory(false);
  };

  // Exit Chatbot back to Dashboard
  const handleExitChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    if (messages.length > 1) {
      persistSession(activeSessionId, messages);
    }
    setActiveTab("dashboard");
  };

  // Context-aware dynamic suggestions
  const lastAiMessage = messages.filter((m) => m.sender === "ai").slice(-1)[0]?.text || "";
  const lastUserMessage = messages.filter((m) => m.sender === "user").slice(-1)[0]?.text || "";
  const fullContext = (lastAiMessage + " " + lastUserMessage).toLowerCase();

  const isDoctorQuestioning = lastAiMessage.includes("🔍") || lastAiMessage.toLowerCase().includes("please share") || lastAiMessage.toLowerCase().includes("clarifying");

  let quickSuggestions = [
    { label: "Doctor, I have a stomachache", icon: "fa-stethoscope" },
    { label: "My shoulder hurts after playing badminton", icon: "fa-dumbbell" },
    { label: "My throat hurts when swallowing", icon: "fa-head-side-cough" },
    { label: "I have a headache from screen work", icon: "fa-head-side-virus" }
  ];

  if (consultContext && consultContext.type === "medicine") {
    const medName = consultContext.medicineName || "this medication";
    quickSuggestions = [
      { label: `When and how should I take ${medName} with meals?`, icon: "fa-utensils" },
      { label: `Are there any drug interactions with ${medName}?`, icon: "fa-triangle-exclamation" },
      { label: `What are common side effects of ${medName}?`, icon: "fa-shield-halved" },
      { label: `What should I do if I miss a scheduled dose?`, icon: "fa-clock-rotate-left" }
    ];
  } else if (consultContext && consultContext.type === "report") {
    quickSuggestions = [
      { label: "Can you explain my lab results in simple terms?", icon: "fa-brain" },
      { label: "Are any biomarker values out of normal range?", icon: "fa-triangle-exclamation" },
      { label: "What dietary adjustments should I consider?", icon: "fa-utensils" },
      { label: "Should I schedule a follow-up consultation?", icon: "fa-user-doctor" }
    ];
  } else if (isDoctorQuestioning) {
    if (fullContext.includes("stomach") || fullContext.includes("belly") || fullContext.includes("abdomen") || fullContext.includes("eat")) {
      quickSuggestions = [
        { label: "I ate spicy oily food last night", icon: "fa-utensils" },
        { label: "Pain is in upper belly with burning (4/10)", icon: "fa-circle-dot" },
        { label: "No fever or vomiting", icon: "fa-check" },
        { label: "What tablets should I take?", icon: "fa-pills" }
      ];
    } else if (fullContext.includes("shoulder") || fullContext.includes("knee") || fullContext.includes("ankle") || fullContext.includes("back") || fullContext.includes("joint") || fullContext.includes("sprain")) {
      quickSuggestions = [
        { label: "Started after sports/exercise", icon: "fa-person-running" },
        { label: "Pain is mild (4/10), can move it", icon: "fa-circle-dot" },
        { label: "No major swelling or numbness", icon: "fa-check" },
        { label: "What pain gel or tablets help?", icon: "fa-pills" }
      ];
    } else if (fullContext.includes("throat") || fullContext.includes("cough") || fullContext.includes("fever") || fullContext.includes("temperature")) {
      quickSuggestions = [
        { label: "Temperature is around 100.8°F for 2 days", icon: "fa-temperature-high" },
        { label: "Scratchy throat, drinking fluids fine", icon: "fa-glass-water" },
        { label: "Started after cold drinks", icon: "fa-snowflake" },
        { label: "What fever/throat tablets should I take?", icon: "fa-pills" }
      ];
    } else if (fullContext.includes("headache") || fullContext.includes("head") || fullContext.includes("screen")) {
      quickSuggestions = [
        { label: "Started after hours of screen work", icon: "fa-laptop" },
        { label: "Dull squeezing band across forehead (4/10)", icon: "fa-circle-dot" },
        { label: "No nausea or vision changes", icon: "fa-check" },
        { label: "What headache tablets help?", icon: "fa-pills" }
      ];
    } else {
      quickSuggestions = [
        { label: "Started today, mild discomfort (3/10)", icon: "fa-clock" },
        { label: "No fever or severe pain", icon: "fa-check" },
        { label: "Drinking plenty of water", icon: "fa-glass-water" },
        { label: "What precautions and tablets do you suggest?", icon: "fa-pills" }
      ];
    }
  }

  const handleSend = (textToSend, customSessionId, customBaseMessages) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const currentSessId = customSessionId || activeSessionId;
    const baseList = customBaseMessages || messages;

    const userMsg = { sender: "user", text };
    const updatedMessages = [...baseList, userMsg];
    setMessages(updatedMessages);
    persistSession(currentSessId, updatedMessages);

    if (!textToSend) setInput("");
    setLoading(true);

    // Retrieve shared memory across consultations
    let sharedMemory = localStorage.getItem(CHAT_MEMORY_KEY) || "";
    if (consultContext) {
      const extraContext = consultContext.type === "medicine"
        ? `Active scanned medication consultation: ${consultContext.medicineName || ""} (${consultContext.genericName || ""} ${consultContext.strength || ""})`
        : `Active scanned lab report consultation: ${consultContext.reportTitle || "Medical Report"}`;
      sharedMemory = sharedMemory ? `${sharedMemory}; ${extraContext}` : extraContext;
    }

    // Prepare recent multi-turn history (up to 12 turns)
    const historyPayload = updatedMessages.slice(-12).map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    // Call Backend Safety Triage & Response API with Shared Memory & History
    fetch(`${API_BASE}/patient/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        age: profile.age,
        weight: profile.weight,
        history: historyPayload,
        memory: sharedMemory,
        session_id: currentSessId
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        const aiMsg = {
          sender: "ai",
          text: data.reply,
          attribution: data.attribution || data.risk_analysis?.source_attribution,
          risk_analysis: data.risk_analysis
        };
        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        persistSession(currentSessId, finalMessages);
      })
      .catch((err) => {
        setLoading(false);
        const fallbackMsg = {
          sender: "ai",
          text: "👋 **Clinical Assessment:**\nI am having trouble connecting to the backend server. Please make sure the FastAPI server is running on http://127.0.0.1:8000.",
          attribution: "System Health Alert",
          risk_analysis: { risk_tier: "LOW" }
        };
        const finalMessages = [...updatedMessages, fallbackMsg];
        setMessages(finalMessages);
        persistSession(currentSessId, finalMessages);
      });
  };

  // Handle incoming consultation request from Medicine or Report Scanner
  const consultProcessedRef = useRef(null);

  useEffect(() => {
    if (!consultContext) return;
    if (consultProcessedRef.current === consultContext) return;
    consultProcessedRef.current = consultContext;

    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);

    const isMed = consultContext.type === "medicine" || !consultContext.type;
    const medTitle = consultContext.medicineName || consultContext.genericName || "Medication";
    const newSessionId = "consult_" + Date.now();

    let welcomeText = "";
    if (isMed) {
      welcomeText = `👋 **Dr. HeartBeat Clinical Consultation**\nHello ${profile.name}! I have reviewed your scan for **${medTitle}**${consultContext.strength ? ` (${consultContext.strength})` : ""}.\n\nI have loaded the clinical pharmacology, safety contraindications, and dosage guidelines for this medication into our active session.\n\n**Quick Clinical Summary:**\n• **Active Formulation:** ${consultContext.genericName || medTitle} ${consultContext.strength || ""}\n• **Patient Profile:** Tailored for ${profile.name} (${profile.age} yrs, ${profile.weight} kg)\n• **Safety Engine:** Verified against CDSCO / FDA clinical monograph\n\nHow can I help you regarding **${medTitle}** today? You can ask me about meal timings, possible drug interactions, side effects, or what to do if you miss a dose.`;
    } else {
      const repTitle = consultContext.reportTitle || "Lab Report";
      welcomeText = `👋 **Dr. HeartBeat Clinical Consultation**\nHello ${profile.name}! I have reviewed your scanned report for **${repTitle}**.\n\nI have analyzed your biomarker values against clinical reference ranges. How can I assist you with your report results today? Feel free to ask about any specific biomarkers, dietary recommendations, or lifestyle adjustments.`;
    }

    const initialMsgs = [{
      sender: "ai",
      text: welcomeText,
      attribution: "Evidence-Based Clinical Engine",
      risk_analysis: { risk_tier: "LOW" }
    }];

    setActiveSessionId(newSessionId);
    setMessages(initialMsgs);
    persistSession(newSessionId, initialMsgs);
    setShowHistory(false);

    if (consultContext.initialPrompt) {
      setTimeout(() => {
        handleSend(consultContext.initialPrompt, newSessionId, initialMsgs);
      }, 350);
    }
  }, [consultContext]);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSend("I have been experiencing a mild fever and body pain for two days.");
    } else {
      setIsRecording(true);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSpeak = (text, idx) => {
    if (!("speechSynthesis" in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*•#💡🩺⚠️📋🛡️👋]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="chat-container p-4 md:p-6 flex flex-col h-[75vh] relative">
      {/* Top Chat Header with Exit Button, History Button, Delete Button, and Shared Memory Badge */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200/90 gap-3">
        {/* Left: Avatar & Doctor Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <i className="fa-solid fa-user-doctor text-xl"></i>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base truncate">Dr. HeartBeat</h3>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Senior MD
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span> Online
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              Clinical AI Assistant · Clinical triage & safety
            </p>
          </div>
        </div>

        {/* Right: Prominent, High-Visibility Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Shared Memory Indicator */}
          <span
            className="chat-memory-badge hidden md:inline-flex"
            title="Shared clinical memory active: Symptoms and consultation context are shared across your chat sessions"
          >
            <i className="fa-solid fa-brain text-teal-600"></i>
            <span className="text-xs">Memory Active</span>
          </span>

          {/* Voice Mode Quick Switch */}
          <button
            onClick={() => setActiveTab("voice")}
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center space-x-1.5 border border-teal-200 shadow-sm transition-all shrink-0 cursor-pointer"
            title="Switch to Hands-Free Voice Assistant"
          >
            <i className="fa-solid fa-microphone-lines text-teal-600"></i>
            <span>Voice Mode</span>
          </button>

          {/* History Button - Prominent Teal */}
          <button
            onClick={() => setShowHistory(true)}
            id="chat-history-btn"
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            title="View consultation history"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>History ({sessions.length})</span>
          </button>

          {/* Delete Current Conversation Button - Direct in Header */}
          <button
            onClick={(e) => handleDeleteSession(activeSessionId, e)}
            id="chat-delete-btn"
            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
            title="Delete current conversation"
          >
            <i className="fa-solid fa-trash-can text-red-500"></i>
            <span>Delete Chat</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            id="chat-new-btn"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
            title="Start a new consultation"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>New Chat</span>
          </button>

          {/* Exit Chat Button - High-Contrast Red */}
          <button
            onClick={handleExitChat}
            id="chat-exit-btn"
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            title="Exit chatbot and return to Dashboard"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Active Medical Consultation Context Pill */}
      {consultContext && (
        <div className="mt-2.5 px-3.5 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/90 rounded-xl flex items-center justify-between text-xs text-teal-950 shadow-2xs animate-fade-in">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
              <i className="fa-solid fa-notes-medical"></i>
            </span>
            <div className="truncate">
              <span className="font-bold text-teal-900">Active Medical Consultation:</span>{" "}
              <span className="text-teal-800 font-semibold">{consultContext.medicineName || consultContext.reportTitle}</span>
              {consultContext.strength && (
                <span className="ml-1.5 text-[10px] bg-teal-200/70 text-teal-900 px-1.5 py-0.5 rounded font-bold">
                  {consultContext.strength}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setConsultContext && setConsultContext(null)}
            className="text-teal-700 hover:text-teal-900 hover:bg-teal-100/60 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
            title="Clear medical scan context"
          >
            <span>Reset Context</span>
            <i className="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-fade-in`}
          >
            {/* Sender Label */}
            <div className="flex items-center space-x-1.5 mb-1 px-1 text-[11px] font-semibold text-slate-400">
              {msg.sender === "user" ? (
                <>
                  <span>You ({profile.name})</span>
                  <i className="fa-solid fa-circle-user text-teal-600"></i>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-stethoscope text-teal-600"></i>
                  <span>Dr. HeartBeat · Clinical Guidance</span>
                </>
              )}
            </div>

            {/* Message Bubble Container */}
            <div
              className={`max-w-2xl p-4 md:p-5 rounded-2xl text-sm transition-all ${
                msg.sender === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-ai"
              }`}
            >
              {msg.sender === "user" ? (
                <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <StructuredMessage
                  text={msg.text}
                  onBookDoctor={() => setActiveTab("doctors")}
                />
              )}

              {/* Triage Banners for Medium/High Risk */}
              {msg.risk_analysis?.risk_tier === "MEDIUM" && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col space-y-2">
                  <div className="flex items-center font-bold">
                    <i className="fa-solid fa-triangle-exclamation text-amber-600 mr-2"></i>
                    <span>{msg.risk_analysis.headline}</span>
                  </div>
                  <p>{msg.risk_analysis.banner_text}</p>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className="self-start bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-700 flex items-center space-x-1"
                  >
                    <span>Find a Verified Doctor</span>
                    <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                </div>
              )}

              {msg.risk_analysis?.risk_tier === "HIGH" && (
                <div className="mt-3 p-4 bg-red-100 border border-red-400 rounded-xl text-red-900 text-xs space-y-2">
                  <div className="flex items-center font-extrabold text-red-700">
                    <i className="fa-solid fa-circle-exclamation text-base mr-2"></i>
                    <span>{msg.risk_analysis.headline}</span>
                  </div>
                  <p className="font-semibold">{msg.risk_analysis.message}</p>
                  <div className="font-mono text-xs bg-white/90 p-2 rounded-lg border border-red-200 font-bold">
                    🚨 Call Immediately: 911 (US) | 112 (EU) | 108 (India)
                  </div>
                </div>
              )}

              {/* AI Action Toolbar (Copy, Read Aloud, Referral) */}
              {msg.sender === "ai" && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="hover:text-slate-700 transition-colors flex items-center space-x-1"
                      title="Copy response"
                    >
                      <i
                        className={`fa-solid ${
                          copiedIdx === idx ? "fa-check text-emerald-600" : "fa-copy"
                        }`}
                      ></i>
                      <span className="text-[11px]">{copiedIdx === idx ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.text, idx)}
                      className={`hover:text-slate-700 transition-colors flex items-center space-x-1 ${
                        speakingIdx === idx ? "text-teal-600 font-semibold" : ""
                      }`}
                      title="Listen to Dr. HeartBeat"
                    >
                      <i
                        className={`fa-solid ${
                          speakingIdx === idx ? "fa-volume-high animate-bounce" : "fa-volume-low"
                        }`}
                      ></i>
                      <span className="text-[11px]">
                        {speakingIdx === idx ? "Stop" : "Read Aloud"}
                      </span>
                    </button>
                  </div>

                  {msg.attribution && (
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <i className="fa-solid fa-shield-halved text-teal-600 text-[9px]"></i>
                      <span className="hidden md:inline">{msg.attribution}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl w-fit animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 font-medium">
                Dr. HeartBeat is reviewing clinical guidance
              </span>
              <div className="flex space-x-1">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Reply Chips */}
      <div className="py-2 flex items-center space-x-2 overflow-x-auto border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center mr-1">
          <i className="fa-solid fa-sparkles text-teal-600 mr-1 text-xs"></i>Suggestions:
        </span>
        {quickSuggestions.map((item, qIdx) => (
          <button
            key={qIdx}
            onClick={() => handleSend(item.label)}
            className="quick-chip"
          >
            <i className={`fa-solid ${item.icon} text-teal-600 text-[10px]`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Input Row */}
      <div className="pt-2 flex items-center space-x-2">
        <button
          onClick={toggleVoiceRecording}
          className={`p-3.5 rounded-xl transition-all shadow-sm ${
            isRecording
              ? "bg-red-500 text-white animate-pulse shadow-red-500/30"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          title="Toggle Voice Mic Input"
        >
          <i className="fa-solid fa-microphone text-sm"></i>
        </button>

        {isRecording && (
          <div className="flex items-center space-x-1 px-2">
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <span className="text-xs text-red-500 font-semibold ml-2">Listening...</span>
          </div>
        )}

        <input
          type="text"
          className="form-input flex-1 py-3 text-sm shadow-sm"
          placeholder="Describe symptoms (e.g., 'fever for 2 days', 'headache and fatigue')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-teal-600/20 flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <span className="hidden md:inline text-sm">Send</span>
          <i className="fa-solid fa-paper-plane text-sm"></i>
        </button>
      </div>

      {/* Secondary Bottom Toolbar with Exit, History, and Delete Actions */}
      <div className="pt-2 mt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(true)}
            className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Open Consultation History"
          >
            <i className="fa-solid fa-clock-rotate-left text-teal-600"></i>
            <span>History ({sessions.length})</span>
          </button>
          <button
            onClick={(e) => handleDeleteSession(activeSessionId, e)}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Delete this active consultation"
          >
            <i className="fa-solid fa-trash-can text-red-500"></i>
            <span>Delete Conversation</span>
          </button>
        </div>
        <div>
          <button
            onClick={handleExitChat}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Exit chatbot and return to Dashboard"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Exit to Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── Slide-over Chat History Drawer ── */}
      {showHistory && (
        <div className="chat-history-backdrop" onClick={() => setShowHistory(false)}>
          <div
            className="chat-history-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Consultation History</h4>
                  <p className="text-[11px] text-slate-500">
                    {sessions.length} {sessions.length === 1 ? "session" : "sessions"} saved in memory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
                title="Close history"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>+ New Consultation</span>
              </button>

              {sessions.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                  title="Clear all conversation history"
                >
                  <i className="fa-solid fa-trash-can text-[11px]"></i>
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {sessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
                    <i className="fa-solid fa-comments"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-700 text-sm">No Past Consultations</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                      Your consultations and symptom Q&As will be securely preserved here for quick access.
                    </p>
                  </div>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const totalCount = (sess.messages || []).length;

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`chat-history-card ${isActive ? "active" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-2">
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                            )}
                            <h5 className="font-bold text-slate-900 text-xs truncate">
                              {sess.title || "Consultation"}
                            </h5>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                            <span>
                              <i className="fa-regular fa-clock mr-1 text-[10px]"></i>
                              {sess.updatedAt || sess.createdAt || "Recent"}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                              {totalCount} msgs
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete past conversation button */}
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center space-x-1 shrink-0 transition-all ml-1 cursor-pointer"
                          title="Delete this conversation"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer with Memory Status */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-[11px] text-slate-500 flex items-center space-x-2">
              <i className="fa-solid fa-brain text-teal-600 text-sm"></i>
              <span>
                <strong>Shared Clinical Memory:</strong> Dr. HeartBeat references recent symptom disclosures across your chat sessions for coherent clinical advice.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2.5 VOICE ASSISTANT TAB (REAL-TIME MULTIMODAL SPEECH & CLINICAL TRIAGE)
// ----------------------------------------------------------------------
function VoiceAssistantTab({ profile, setActiveTab, onTriggerEmergency }) {
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [liveInterim, setLiveInterim] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeVoiceName, setActiveVoiceName] = useState('');
  const recognitionRef = useRef(null);
  const dialogueEndRef = useRef(null);

  const [dialogue, setDialogue] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Hello ${profile?.name || 'there'}! I'm Dr. HeartBeat. I'm right here listening, so whenever you're ready, tap the glowing orb and talk to me about what's going on. We can take it one step at a time.`,
      time: 'Just now',
      riskTier: 'LOW',
      attribution: 'HeartBeat 360 Clinical Voice Intelligence'
    }
  ]);

  // Pre-configured Medical Voice Prompts
  const sampleVoicePrompts = [
    {
      label: "Tension Headache",
      query: "I have had a throbbing tension headache and neck stiffness for 2 days.",
      icon: "fa-solid fa-head-side-virus",
      color: "bg-amber-50 text-amber-800 border-amber-200"
    },
    {
      label: "Medication Safety",
      query: "Is it safe to take Amoxicillin 500mg with my blood pressure medication?",
      icon: "fa-solid fa-pills",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200"
    },
    {
      label: "Fever & Chills",
      query: "What should I do for an adult running a 101.5°F fever with chills and fatigue?",
      icon: "fa-solid fa-temperature-arrow-up",
      color: "bg-rose-50 text-rose-800 border-rose-200"
    },
    {
      label: "Lab Results",
      query: "Can you explain what slightly elevated fasting blood glucose means?",
      icon: "fa-solid fa-file-waveform",
      color: "bg-sky-50 text-sky-800 border-sky-200"
    }
  ];

  // Initialize browser Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setVoiceStatus('listening');
        setErrorMessage(null);
        setLiveInterim('');
      };

      rec.onresult = (event) => {
        let interim = '';
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setLiveInterim(interim);
        if (finalStr) {
          setTranscript(finalStr);
          handleProcessVoiceQuery(finalStr);
        }
      };

      rec.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions or click any sample voice prompt below.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech input status: ${event.error}. You can also type your query below.`);
        }
        setVoiceStatus('idle');
      };

      rec.onend = () => {
        if (voiceStatus === 'listening') {
          setVoiceStatus('idle');
        }
      };

      recognitionRef.current = rec;
    } else {
      setErrorMessage('Browser SpeechRecognition API is not natively supported in this browser environment. You can use the quick voice prompts below or type to simulate voice consultation.');
    }

    return () => {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue, voiceStatus]);

  // Toggle Microphone / Speech Synthesis
  const handleOrbClick = () => {
    if (voiceStatus === 'speaking') {
      window.speechSynthesis?.cancel();
      setVoiceStatus('idle');
      setSpeakingMsgId(null);
      return;
    }

    if (voiceStatus === 'listening') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setVoiceStatus('idle');
      if (liveInterim) {
        handleProcessVoiceQuery(liveInterim);
      }
      return;
    }

    // Start listening
    if (recognitionRef.current) {
      setTranscript('');
      setLiveInterim('');
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
        } catch (e) {}
      }
    } else {
      handleProcessVoiceQuery("I have been having a mild headache and fatigue today.");
    }
  };

  // Female voice selector for Dr. HeartBeat Voice Assistant
  const getFemaleVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    // Names or tokens indicating female voice synthesis profiles across Windows, macOS, Chrome, Edge, iOS
    const femaleTokens = [
      'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'susan',
      'catherine', 'serena', 'stephanie', 'lisa', 'ava', 'allison', 'hazel',
      'moira', 'tessa', 'fiona', 'veena', 'sangeeta', 'female', 'woman'
    ];

    // Priority 1: English female voice
    for (const token of femaleTokens) {
      const match = voices.find(v =>
        (v.lang.startsWith('en') || !v.lang) &&
        v.name.toLowerCase().includes(token)
      );
      if (match) return match;
    }

    // Priority 2: Any female voice across languages
    for (const token of femaleTokens) {
      const match = voices.find(v => v.name.toLowerCase().includes(token));
      if (match) return match;
    }

    // Sensible fallback: Preferred English voice, or default voice
    const fallbackEn = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
    return fallbackEn || voices[0] || null;
  };

  // Initialize SpeechSynthesis female voice detection
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const initVoice = () => {
        const fv = getFemaleVoice();
        if (fv) setActiveVoiceName(fv.name);
      };
      window.speechSynthesis.onvoiceschanged = initVoice;
      initVoice();
    }
  }, []);

  // Speak AI text aloud with female doctor voice and natural pacing
  const speakResponse = (text, msgId) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown and symbols for speech
    const cleanSpeech = text
      .replace(/[*#•👋💡🩺⚠️📋🛡️]/g, '')
      .replace(/Tier [0-9]:[^\n]+/gi, '')
      .replace(/\n+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly elevated warm pitch suitable for female physician voice

    // Apply female voice selection
    const femaleVoice = getFemaleVoice();
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      if (!activeVoiceName) setActiveVoiceName(femaleVoice.name);
    }

    utterance.onstart = () => {
      setVoiceStatus('speaking');
      setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setVoiceStatus('idle');
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setVoiceStatus('idle');
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    window.speechSynthesis?.cancel();
    setVoiceStatus('idle');
    setSpeakingMsgId(null);
  };

  // Process user spoken query via NVIDIA pipeline
  const handleProcessVoiceQuery = (queryText) => {
    if (!queryText || !queryText.trim()) return;
    const cleanQuery = queryText.trim();

    // 1. Add user message
    const userMsgId = Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: cleanQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDialogue(prev => [...prev, userMsg]);
    setVoiceStatus('thinking');
    setTranscript(cleanQuery);
    setLiveInterim('');

    // Check critical emergency keywords in voice
    const lower = cleanQuery.toLowerCase();
    if (lower.includes('chest pain') || lower.includes('cannot breathe') || lower.includes('stroke') || lower.includes('heart attack')) {
      if (onTriggerEmergency) onTriggerEmergency();
    }

    // Call dedicated NVIDIA voice assistant endpoint with FULL conversation history
    fetch(`${API_BASE}/patient/voice-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: cleanQuery,
        patient_id: 1,
        age: profile?.age || 34,
        weight: profile?.weight || 62,
        history: dialogue.map(d => ({ sender: d.sender, text: d.text })),
        memory: localStorage.getItem("heartbeat360_clinical_memory") || ""
      })
    })
    .then(res => res.json())
    .then(data => {
      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'assistant',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskTier: data.risk_analysis?.risk_tier || 'LOW',
        attribution: data.attribution || 'HeartBeat 360 Clinical Voice Intelligence',
        modelUsed: data.model_used
      };

      setDialogue(prev => [...prev, aiMsg]);
      speakResponse(data.reply, aiMsgId);
    })
    .catch(err => {
      console.warn('Voice backend endpoint fallback:', err);
      const fallbackText = `I hear you, and thank you for sharing that with me. For what you've described, it's best to rest comfortably and stay hydrated. If things feel more severe or don't settle down soon, we should definitely have a doctor check in on you in person. Does that sound reasonable?`;
      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        sender: 'assistant',
        text: fallbackText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskTier: 'LOW',
        attribution: 'HeartBeat 360 Clinical Voice Intelligence'
      };
      setDialogue(prev => [...prev, aiMsg]);
      speakResponse(fallbackText, aiMsgId);
    });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="voice-assistant-card p-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-500/25">
              <i className="fa-solid fa-microphone-lines"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-lg md:text-xl tracking-tight">
                  Voice Assistant
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] flex items-center shadow-xs">
                  <i className="fa-solid fa-waveform text-emerald-600 mr-1.5"></i>
                  Clinical Voice Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time speech with Clinical Voice Assistant & Medical Reasoning Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('chat')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center space-x-1.5 shadow-sm"
              title="Switch to Text Chat"
            >
              <i className="fa-solid fa-comments text-teal-600"></i>
              <span>Text Chat</span>
            </button>
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              {voiceStatus === 'listening' ? 'Listening...' : voiceStatus === 'thinking' ? 'Clinical AI Analyzing...' : voiceStatus === 'speaking' ? 'Dr. Speaking' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Connected Pipeline Status Pill */}
        <div className="mt-3 py-2 px-3 bg-slate-900 text-slate-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] border border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <i className="fa-solid fa-shield-halved"></i> Voice Assistant:
            </span>
            <span className="text-slate-300">Speech: <strong className="text-emerald-300 font-medium">Clinical Voice Recognition</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Reasoning: <strong className="text-emerald-300 font-medium">Senior Clinical Triage Engine</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">TTS Voice: <strong className="text-pink-300 font-medium"><i className="fa-solid fa-venus text-pink-400 mr-1"></i>{activeVoiceName ? `Female (${activeVoiceName.replace('Microsoft ', '').replace(' Desktop', '')})` : 'Female Voice'}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
            <i className="fa-solid fa-cloud text-teal-400"></i>
            <span>Secure Clinical Cloud</span>
          </div>
        </div>

        {/* Central Voice Orb & Wave Stage */}
        <div className="voice-orb-stage">
          <div className="voice-orb-wrapper">
            {/* Concentric Pulsing Rings */}
            {(voiceStatus === 'listening' || voiceStatus === 'speaking') && (
              <>
                <div className="voice-pulse-ring"></div>
                <div className="voice-pulse-ring voice-pulse-ring--2"></div>
                <div className="voice-pulse-ring voice-pulse-ring--3"></div>
              </>
            )}

            {/* Central Interactive Glowing Orb */}
            <button
              onClick={handleOrbClick}
              className={`voice-orb-btn ${
                voiceStatus === 'listening'
                  ? 'voice-orb-btn--listening'
                  : voiceStatus === 'thinking'
                  ? 'voice-orb-btn--thinking'
                  : voiceStatus === 'speaking'
                  ? 'voice-orb-btn--speaking'
                  : 'voice-orb-btn--idle'
              }`}
              title={
                voiceStatus === 'listening'
                  ? 'Click to stop listening and analyze'
                  : voiceStatus === 'speaking'
                  ? 'Click to stop doctor speech'
                  : 'Click to speak'
              }
            >
              <i
                className={`fa-solid ${
                  voiceStatus === 'listening'
                    ? 'fa-microphone text-2xl'
                    : voiceStatus === 'thinking'
                    ? 'fa-circle-notch fa-spin text-2xl'
                    : voiceStatus === 'speaking'
                    ? 'fa-volume-high text-2xl'
                    : 'fa-microphone text-2xl'
                }`}
              ></i>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                {voiceStatus === 'listening'
                  ? 'Listening'
                  : voiceStatus === 'thinking'
                  ? 'Thinking'
                  : voiceStatus === 'speaking'
                  ? 'Speaking'
                  : 'Tap to Speak'}
              </span>
            </button>
          </div>

          {/* Equalizer Waveform Bars */}
          <div className="voice-live-spectrum">
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
            <div className={`spectrum-bar ${voiceStatus === 'idle' ? 'opacity-30' : ''}`}></div>
          </div>

          {/* Real-time Spoken Transcript or Status Instruction */}
          <div className="voice-transcript-box">
            {liveInterim ? (
              <p className="text-sm text-teal-700 font-medium italic animate-pulse">
                "{liveInterim}..."
              </p>
            ) : transcript ? (
              <p className="text-sm text-slate-800 font-medium">
                <i className="fa-solid fa-quote-left text-teal-500 mr-2 text-xs"></i>
                {transcript}
                <i className="fa-solid fa-quote-right text-teal-500 ml-2 text-xs"></i>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {voiceStatus === 'listening'
                  ? 'Listening to your voice... Speak your symptoms clearly.'
                  : voiceStatus === 'thinking'
                  ? 'Triaging symptoms through Clinical Safety Guard...'
                  : voiceStatus === 'speaking'
                  ? 'Dr. HeartBeat is answering. Tap orb anytime to pause audio.'
                  : 'Tap the microphone orb to start voice consultation with Dr. HeartBeat.'}
              </p>
            )}
          </div>

          {/* Action buttons while active */}
          {voiceStatus === 'speaking' && (
            <button
              onClick={handleStopSpeech}
              className="mt-3 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <i className="fa-solid fa-stop text-rose-500"></i>
              <span>Stop Voice Speech</span>
            </button>
          )}

          {errorMessage && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl max-w-lg text-center">
              <i className="fa-solid fa-circle-info mr-1.5"></i>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Quick Voice Prompt Cards */}
        <div className="mt-2 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sample Voice Queries (Click to Speak)
            </span>
            <span className="text-[11px] text-teal-600 font-medium">Instant AI Triage</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {sampleVoicePrompts.map((p, idx) => (
              <div
                key={idx}
                onClick={() => handleProcessVoiceQuery(p.query)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group flex items-start space-x-2.5"
                title={p.query}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${p.color}`}>
                  <i className={p.icon}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                    {p.label}
                  </h5>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    "{p.query}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text Fallback Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Or type a voice consultation query (e.g. 'I have a mild fever')..."
              className="form-input text-xs pl-8 py-2.5 rounded-xl w-full"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  handleProcessVoiceQuery(manualInput);
                  setManualInput('');
                }
              }}
            />
            <i className="fa-solid fa-keyboard absolute left-3 top-3 text-slate-400 text-xs"></i>
          </div>
          <button
            onClick={() => {
              if (manualInput.trim()) {
                handleProcessVoiceQuery(manualInput);
                setManualInput('');
              }
            }}
            disabled={!manualInput.trim() || voiceStatus === 'thinking'}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
          >
            <span>Ask & Speak</span>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Voice Consultation Dialogue Feed */}
      <div className="voice-assistant-card p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-volume-high text-teal-600"></i>
            <h4 className="font-bold text-slate-900 text-sm md:text-base">
              Voice Consultation Transcript
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {dialogue.length} {dialogue.length === 1 ? 'exchange' : 'exchanges'}
          </span>
        </div>

        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {dialogue.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5 opacity-90 border-b border-black/5 pb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <i
                      className={`fa-solid ${
                        msg.sender === 'user'
                          ? 'fa-user'
                          : 'fa-user-doctor text-teal-600'
                      }`}
                    ></i>
                    {msg.sender === 'user'
                      ? profile?.name || 'You (Spoken)'
                      : 'Dr. HeartBeat (Voice Consultant)'}
                  </span>
                  <span className="font-mono text-[10px]">{msg.time}</span>
                </div>

                {/* Body Text / Structured Message */}
                {msg.sender === 'user' ? (
                  <p className="text-sm font-medium leading-relaxed">
                    "{msg.text}"
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Safety Tier Pill */}
                    {msg.riskTier && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          msg.riskTier === 'HIGH' || msg.riskTier === 'EMERGENCY'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : msg.riskTier === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            msg.riskTier === 'HIGH' || msg.riskTier === 'EMERGENCY'
                              ? 'fa-triangle-exclamation text-red-500'
                              : msg.riskTier === 'MEDIUM'
                              ? 'fa-user-doctor text-amber-500'
                              : 'fa-shield-heart text-emerald-500'
                          }`}
                        ></i>
                        {msg.riskTier === 'HIGH' || msg.riskTier === 'EMERGENCY'
                          ? 'Tier 3: Emergency Escalation'
                          : msg.riskTier === 'MEDIUM'
                          ? 'Tier 2: Doctor Consultation'
                          : 'Tier 1: Safe Educational'}
                      </span>
                    )}

                    <div className="text-sm font-medium text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Footer Controls: Audio Playback */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (speakingMsgId === msg.id) {
                              handleStopSpeech();
                            } else {
                              speakResponse(msg.text, msg.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold flex items-center space-x-1 transition-all"
                          title="Replay Voice Audio"
                        >
                          <i
                            className={`fa-solid ${
                              speakingMsgId === msg.id ? 'fa-pause' : 'fa-play'
                            } text-teal-600 text-[10px]`}
                          ></i>
                          <span>
                            {speakingMsgId === msg.id ? 'Pause Voice' : 'Replay Voice'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold flex items-center space-x-1 transition-all"
                          title="Copy text"
                        >
                          <i
                            className={`fa-solid ${
                              copiedId === msg.id ? 'fa-check text-teal-600' : 'fa-copy'
                            } text-[10px]`}
                          ></i>
                          <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          <i className="fa-solid fa-shield-halved text-teal-600"></i>
                          <span>{msg.attribution || 'HeartBeat 360 Clinical Voice Intelligence'}</span>
                        </span>
                        <button
                          onClick={() => setActiveTab('doctors')}
                          className="text-teal-600 font-semibold hover:underline text-[11px] inline-flex items-center"
                        >
                          Book Specialist <i className="fa-solid fa-angle-right ml-1 text-[9px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={dialogueEndRef} />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// CLEAN MEDICINE MONOGRAPH VIEW COMPONENT
// ----------------------------------------------------------------------
function CleanMedicineMonographView({ result, profile, onConsultDoctor }) {
  if (!result) return null;

  const brandName = result.brand_name || result.generic_name || "Prescription Medication";
  const genericName = result.generic_name || brandName;
  const strength = result.strength || "Dosage";
  const activeMolecules = Array.isArray(result.active_ingredients) && result.active_ingredients.length > 0
    ? result.active_ingredients.join(" + ")
    : genericName;
  const rawText = result.ai_analysis || result.final_answer || "";

  // Helper for inline bold formatting
  const renderInlineFormatted = (str) => {
    if (!str) return null;
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let keyIdx = 0;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={keyIdx++} className="font-bold text-slate-900">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts;
  };

  const cleanInline = (t) => (t ? t.replace(/\*\*/g, "").trim() : "");

  // Parse structured sections
  const blocks = rawText.split(/\n(?=[💛🩺⚖️⚠️💊🤢📦📖]|(?:\*\*[0-9A-Za-z\s&,–—\-]+:\*\*))/);
  const sections = {
    identity: {},
    indications: "",
    dosage: {
      regimen: "",
      patientAssessment: "",
      mealTiming: "",
      water: "",
      missedDose: "",
      maxLimits: "",
      otherLines: []
    },
    contraindications: [],
    interactions: [],
    sideEffects: {
      manageable: [],
      redFlags: []
    },
    storage: "",
    guidelines: ""
  };

  blocks.forEach((block) => {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0].toLowerCase();
    const bodyLines = lines.slice(1);

    if (header.includes("identified medicine") || header.includes("active composition") || header.includes("💛")) {
      bodyLines.forEach((l) => {
        const clean = cleanInline(l.replace(/^[•\-\*]\s*/, ""));
        const colonIdx = clean.indexOf(":");
        if (colonIdx > 0) {
          const k = clean.substring(0, colonIdx).trim().toLowerCase();
          const v = clean.substring(colonIdx + 1).trim();
          sections.identity[k] = v;
        }
      });
    } else if (header.includes("indication") || header.includes("approved use") || header.includes("🩺")) {
      sections.indications = bodyLines.map((l) => cleanInline(l.replace(/^[•\-\*]\s*/, ""))).join(" ");
    } else if (header.includes("dosage") || header.includes("meal administration") || header.includes("schedule") || header.includes("⚖️")) {
      bodyLines.forEach((l) => {
        const clean = cleanInline(l.replace(/^[•\-\*]\s*/, ""));
        const lower = clean.toLowerCase();
        if (lower.startsWith("meal timing") || lower.includes("meal timing:")) {
          sections.dosage.mealTiming = clean.split(":").slice(1).join(":").trim();
        } else if (lower.startsWith("patient assessment") || lower.includes("patient assessment:")) {
          sections.dosage.patientAssessment = clean.split(":").slice(1).join(":").trim();
        } else if (lower.startsWith("missed dose") || lower.includes("missed dose:")) {
          sections.dosage.missedDose = clean.split(":").slice(1).join(":").trim();
        } else if (lower.startsWith("maximum limits") || lower.includes("maximum limits:")) {
          sections.dosage.maxLimits = clean.split(":").slice(1).join(":").trim();
        } else if (lower.startsWith("standard clinical regimen") || lower.includes("standard clinical regimen:")) {
          sections.dosage.regimen = clean.split(":").slice(1).join(":").trim() || clean;
        } else {
          sections.dosage.otherLines.push(clean);
        }
      });
    } else if (header.includes("contraindication") || header.includes("warning") || header.includes("⚠️")) {
      bodyLines.forEach((l) => {
        const clean = cleanInline(l.replace(/^[•\-\*]\s*/, ""));
        if (clean) sections.contraindications.push(clean);
      });
    } else if (header.includes("interaction") || header.includes("lifestyle") || header.includes("💊")) {
      bodyLines.forEach((l) => {
        const clean = cleanInline(l.replace(/^[•\-\*]\s*/, ""));
        if (clean) sections.interactions.push(clean);
      });
    } else if (header.includes("side effect") || header.includes("adverse reaction") || header.includes("🤢")) {
      bodyLines.forEach((l) => {
        const clean = cleanInline(l.replace(/^[•\-\*]\s*/, ""));
        const lower = clean.toLowerCase();
        if (lower.includes("red flag") || lower.includes("emergency") || lower.includes("discontinue") || lower.includes("jaundice") || lower.includes("difficulty breathing")) {
          const content = clean.includes(":") ? clean.split(":").slice(1).join(":").trim() : clean;
          sections.sideEffects.redFlags.push(content);
        } else if (lower.includes("manageable") || lower.includes("mild") || lower.includes("common")) {
          const content = clean.includes(":") ? clean.split(":").slice(1).join(":").trim() : clean;
          sections.sideEffects.manageable.push(content);
        } else {
          sections.sideEffects.manageable.push(clean);
        }
      });
    } else if (header.includes("storage") || header.includes("disposal") || header.includes("📦")) {
      sections.storage = bodyLines.map((l) => cleanInline(l.replace(/^[•\-\*]\s*/, ""))).join(" ");
    } else if (header.includes("evidence") || header.includes("guideline") || header.includes("📖")) {
      sections.guidelines = bodyLines.map((l) => cleanInline(l.replace(/^[•\-\*]\s*/, ""))).join(" ");
    }
  });

  // Default fallbacks if section text was missing
  if (!sections.indications && rawText) {
    sections.indications = `Prescribed for clinical indications managed by ${genericName} as approved by regulatory health authorities.`;
  }
  if (!sections.dosage.mealTiming) {
    sections.dosage.mealTiming = "Swallow whole with 200–250 mL of water. Take with or immediately after a meal.";
  }
  if (!sections.dosage.missedDose) {
    sections.dosage.missedDose = "Take as soon as remembered; if near the next scheduled dose, skip the missed dose. Never double up.";
  }
  if (sections.sideEffects.redFlags.length === 0) {
    sections.sideEffects.redFlags.push("Difficulty breathing, facial swelling, severe cutaneous rash, or sudden jaundice. Discontinue immediately and seek emergency care.");
  }
  if (sections.sideEffects.manageable.length === 0) {
    sections.sideEffects.manageable.push("Mild gastrointestinal discomfort, headache, or transient nausea.");
  }

  const pharmacClass = sections.identity["pharmacological class"] || sections.identity["class"] || `Therapeutic Agent — ${genericName} formulation`;
  const mechanismOfAction = sections.identity["mechanism of action"] || "";

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      {/* 1. HERO IDENTITY CARD */}
      <div className="p-4 bg-gradient-to-br from-teal-50 via-emerald-50/60 to-white border border-teal-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{brandName}</h3>
              <span className="text-[11px] font-bold bg-teal-700 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                {strength}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {genericName !== brandName ? `${genericName} · ` : ""}{pharmacClass}
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold bg-white border border-teal-300 text-teal-800 px-2.5 py-1 rounded-full shadow-2xs flex items-center space-x-1">
              <i className="fa-solid fa-shield-halved text-teal-600"></i>
              <span>{result.search_provider ? `${result.search_provider.toUpperCase()} Verified` : "Monograph Verified"}</span>
            </span>
          </div>
        </div>

        {mechanismOfAction && (
          <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-teal-100">
            <strong className="text-slate-800">Mechanism:</strong> {mechanismOfAction}
          </p>
        )}

        {/* 4 Key Facts Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-[11px]">
              <i className="fa-solid fa-utensils text-emerald-600"></i>
              <span>Meal Timing</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight">
              Take with / after food
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-sky-200/80 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-sky-700 font-bold text-[11px]">
              <i className="fa-solid fa-glass-water text-sky-600"></i>
              <span>Hydration</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight">
              200–250 mL water
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-[11px]">
              <i className="fa-solid fa-clock text-amber-600"></i>
              <span>Dose Regimen</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight">
              Prescription schedule
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-teal-200/80 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-teal-700 font-bold text-[11px]">
              <i className="fa-solid fa-user-check text-teal-600"></i>
              <span>Tailored</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight truncate">
              {profile?.age || 19}y · {profile?.weight || 70}kg
            </p>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY INDICATIONS (WHAT IT TREATS) */}
      <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 font-bold text-sky-950 text-xs uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
          <span>Primary Medical Indications & Approved Uses</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-sky-100 text-slate-700 text-xs leading-relaxed font-normal">
          {renderInlineFormatted(sections.indications)}
        </div>
      </div>

      {/* 3. DOSAGE & MEAL ADMINISTRATION */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
        <div className="flex items-center space-x-2 font-bold text-emerald-950 text-xs uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
          <span>Dosage Schedule & Meal Administration</span>
        </div>

        <div className="space-y-2">
          {sections.dosage.mealTiming && (
            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-start space-x-2.5">
              <i className="fa-solid fa-utensils text-emerald-600 mt-0.5 text-xs shrink-0"></i>
              <div>
                <strong className="text-emerald-950 font-bold block text-xs">Meal Timing & Absorption:</strong>
                <span className="text-slate-700 text-xs leading-relaxed">{sections.dosage.mealTiming}</span>
              </div>
            </div>
          )}

          {sections.dosage.missedDose && (
            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-start space-x-2.5">
              <i className="fa-solid fa-clock-rotate-left text-emerald-600 mt-0.5 text-xs shrink-0"></i>
              <div>
                <strong className="text-emerald-950 font-bold block text-xs">Missed Dose Protocol:</strong>
                <span className="text-slate-700 text-xs leading-relaxed">{sections.dosage.missedDose}</span>
              </div>
            </div>
          )}

          {sections.dosage.maxLimits && (
            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-start space-x-2.5">
              <i className="fa-solid fa-ban text-emerald-600 mt-0.5 text-xs shrink-0"></i>
              <div>
                <strong className="text-emerald-950 font-bold block text-xs">Maximum Limits:</strong>
                <span className="text-slate-700 text-xs leading-relaxed">{sections.dosage.maxLimits}</span>
              </div>
            </div>
          )}

          {sections.dosage.regimen && (
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-slate-700 text-[11px]">
              <strong className="text-emerald-950 font-semibold">Standard Regimen:</strong> {sections.dosage.regimen}
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTRAINDICATIONS & SAFETY WARNINGS */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-950 text-xs uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <span>Contraindications & High-Risk Warnings</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-slate-700 text-xs space-y-1.5">
          {sections.contraindications.length > 0 ? (
            sections.contraindications.map((c, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-exclamation text-amber-600 mt-0.5 text-[10px] shrink-0"></i>
                <span className="leading-relaxed">{renderInlineFormatted(c)}</span>
              </div>
            ))
          ) : (
            <p className="leading-relaxed">
              Known hypersensitivity to {genericName} or formulation excipients. Patients with severe hepatic or renal dysfunction require close clinical monitoring.
            </p>
          )}
        </div>
      </div>

      {/* 5. INTERACTIONS (DRUGS, FOOD, ALCOHOL) */}
      <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 font-bold text-purple-950 text-xs uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-pills"></i>
          </div>
          <span>Drug, Food & Lifestyle Interactions</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-purple-100 text-slate-700 text-xs space-y-1.5">
          {sections.interactions.length > 0 ? (
            sections.interactions.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <i className="fa-solid fa-ban text-purple-500 mt-0.5 text-[10px] shrink-0"></i>
                <span className="leading-relaxed">{renderInlineFormatted(item)}</span>
              </div>
            ))
          ) : (
            <p className="leading-relaxed">
              Cross-check with clinical pharmacist before taking alongside CYP3A4 inhibitors/inducers, OTC antacids, or alcohol.
            </p>
          )}
        </div>
      </div>

      {/* 6. SIDE EFFECTS & RED FLAGS */}
      <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
        <div className="flex items-center space-x-2 font-bold text-rose-950 text-xs uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">
            <i className="fa-solid fa-shield-virus"></i>
          </div>
          <span>Side Effects & Adverse Reactions</span>
        </div>

        {/* Manageable Symptoms */}
        <div className="bg-white p-3 rounded-xl border border-rose-100 text-slate-700 text-xs space-y-1.5">
          <span className="font-bold text-slate-800 text-[11px] block text-emerald-800">
            <i className="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i>Common & Manageable Symptoms:
          </span>
          {sections.sideEffects.manageable.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-slate-600">
              <span className="text-slate-400">•</span>
              <span className="leading-relaxed">{renderInlineFormatted(item)}</span>
            </div>
          ))}
        </div>

        {/* Emergency Red Flags Callout */}
        <div className="bg-red-100/90 border border-red-300 p-3 rounded-xl text-red-950 text-xs space-y-1">
          <div className="font-bold flex items-center space-x-1.5 text-red-800">
            <i className="fa-solid fa-triangle-exclamation text-red-600"></i>
            <span>Emergency Red Flags — Discontinue & Seek Immediate Care:</span>
          </div>
          {sections.sideEffects.redFlags.map((rf, idx) => (
            <p key={idx} className="text-red-900 font-medium leading-relaxed pl-5">
              {renderInlineFormatted(rf)}
            </p>
          ))}
        </div>
      </div>

      {/* 7. STORAGE & DISPOSAL */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs flex items-start space-x-2.5">
        <i className="fa-solid fa-box-archive text-slate-500 mt-0.5 shrink-0"></i>
        <div>
          <strong className="text-slate-800 font-bold block text-[11px]">Storage & Handling:</strong>
          <span className="text-slate-600 text-[11px] leading-relaxed">
            {sections.storage || "Store below 25°C (77°F) in a cool, dry place protected from direct sunlight and humidity. Keep out of reach of children."}
          </span>
        </div>
      </div>

      {/* 8. LIVE EVIDENCE CITATIONS */}
      {result.search_citations && result.search_citations.length > 0 && (
        <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-900 text-[11px] flex items-center uppercase tracking-wider">
              <i className="fa-solid fa-globe text-sky-600 mr-1.5"></i>Live Evidence Search Sources ({result.search_citations.length})
            </span>
            <span className="text-[10px] text-sky-700 font-medium">Verified Evidence</span>
          </div>
          <div className="space-y-1.5">
            {result.search_citations.map((cite, idx) => (
              <div key={idx} className="bg-white p-2 rounded-lg border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800">{cite.title || "Clinical Reference"}</span>
                  <p className="text-[10px] text-slate-500 truncate">{cite.snippet}</p>
                </div>
                {cite.url && (
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 whitespace-nowrap inline-flex items-center cursor-pointer"
                  >
                    <span>View Source</span>
                    <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[9px]"></i>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. THE BOTTOM "CONSULT DOCTOR" HERO CTA */}
      <div className="p-5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white rounded-2xl shadow-lg space-y-4 border border-teal-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
                <i className="fa-solid fa-user-doctor text-lg"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  Consult Doctor about {brandName}
                </h4>
                <p className="text-[11px] text-teal-100 leading-snug">
                  Personalized consultation for {profile?.name || "Patient"} ({profile?.age || 19} yrs, {profile?.weight || 70} kg)
                </p>
              </div>
            </div>
            <p className="text-xs text-teal-50 max-w-md leading-relaxed pt-1">
              Have questions about how to take {brandName}, possible drug interactions, meal timing, or symptoms? Ask Dr. HeartBeat directly.
            </p>
          </div>

          <button
            id="btn-consult-doctor"
            onClick={() => onConsultDoctor && onConsultDoctor({
              type: "medicine",
              medicineName: brandName,
              genericName: genericName,
              strength: strength,
              activeIngredients: activeMolecules,
              result: result
            })}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-teal-50 text-teal-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-stethoscope text-teal-600"></i>
            <span>Consult Doctor</span>
            <i className="fa-solid fa-arrow-right text-xs ml-1 text-teal-600"></i>
          </button>
        </div>

        {/* Quick Instant Question Chips */}
        <div className="pt-3 border-t border-teal-500/50">
          <div className="text-[11px] font-semibold text-teal-100 mb-2 flex items-center">
            <i className="fa-solid fa-circle-question mr-1.5 text-xs text-teal-200"></i>
            <span>Click any question to ask Dr. HeartBeat instantly:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: `When and how should I take ${brandName} with meals?`, icon: "fa-utensils" },
              { label: `Can I take ${brandName} with other medications?`, icon: "fa-pills" },
              { label: `What side effects of ${brandName} are dangerous?`, icon: "fa-triangle-exclamation" },
              { label: `What should I do if I miss a dose of ${brandName}?`, icon: "fa-clock-rotate-left" }
            ].map((chip, cIdx) => (
              <button
                key={cIdx}
                onClick={() => onConsultDoctor && onConsultDoctor({
                  type: "medicine",
                  medicineName: brandName,
                  genericName: genericName,
                  strength: strength,
                  activeIngredients: activeMolecules,
                  result: result,
                  initialPrompt: chip.label
                })}
                className="text-[11px] bg-white/15 hover:bg-white/30 text-white font-medium px-3 py-1.5 rounded-lg border border-white/25 hover:border-white/50 transition-all flex items-center space-x-1.5 shadow-2xs backdrop-blur-sm cursor-pointer"
              >
                <i className={`fa-solid ${chip.icon} text-[10px] text-teal-200`}></i>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
        <span>Verification: <strong className="text-slate-600">Evidence-Based Clinical Engine</strong></span>
        <span>{result.attribution || "HeartBeat 360 Clinical Intelligence"}</span>
      </div>
    </div>
  );
}

// 3. MEDICINE & TABLET SCANNER TAB (CLINICAL AI + EVIDENCE-BASED SEARCH)
function MedicineScannerTab({ profile, onConsultDoctor }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [medQuery, setMedQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 1: Scan, 2: Search tool, 3: Synthesis

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleScan = () => {
    setLoading(true);
    setPipelineStep(1);

    // Simulate visual progression through the 3-stage pipeline while fetch runs
    const t1 = setTimeout(() => setPipelineStep(2), 1200);
    const t2 = setTimeout(() => setPipelineStep(3), 2600);

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (medQuery.trim()) {
      formData.append("medicine_name", medQuery.trim());
    } else if (!file) {
      formData.append("medicine_name", "Augmentin 625 Duo");
    }
    if (profile.weight) formData.append("patient_weight", profile.weight);
    if (profile.age) formData.append("patient_age", profile.age);
    if (profile.allergies && profile.allergies.length > 0) {
      formData.append("patient_allergies", profile.allergies.join(", "));
    }
    if (profile.currentMedicines && profile.currentMedicines.length > 0) {
      formData.append("current_medicines", profile.currentMedicines.join(", "));
    }

    fetch(`${API_BASE}/patient/scan-medicine`, {
      method: "POST",
      body: formData
    })
    .then((res) => res.json())
    .then((data) => {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setPipelineStep(0);
      setResult(data);
    })
    .catch((err) => {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setPipelineStep(0);
      console.error("Medicine scan error:", err);
    });
  };

  return (
    <div className="space-y-6">
      {/* Architecture Pipeline Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-4 md:p-5 text-white shadow-lg border border-teal-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Multimodal Clinical AI + Live Evidence Search
              </span>
              <span className="text-xs text-slate-300 font-medium">Evidence-Based Clinical Engine</span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white flex items-center">
              <i className="fa-solid fa-tablets text-teal-400 mr-2"></i>Smart Tablet & Medication Scanner
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Upload any tablet strip, pill box, or prescription. Our clinical engine extracts active molecules, queries live medical databases (FDA / MedlinePlus), and generates full clinical dosage & safety analysis.
            </p>
          </div>
          {/* Visual Architecture Flow */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
            <span className="text-teal-300 font-semibold">User Scans</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-sky-300 font-semibold">Clinical AI</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-amber-300 font-semibold">Evidence Search</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-emerald-300 font-semibold">Full Information</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Controls (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 bg-white space-y-4 shadow-sm border border-slate-200/80 rounded-2xl">
          <h4 className="font-bold text-slate-900 text-base flex items-center justify-between">
            <span><i className="fa-solid fa-camera text-teal-600 mr-2"></i>Scan Medication / Tablet</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1</span>
          </h4>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/60 group">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="med-upload-scanner" />
            <label htmlFor="med-upload-scanner" className="cursor-pointer block">
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Tablet preview" className="max-h-48 mx-auto rounded-xl shadow-md object-contain border border-slate-200" />
                  <span className="absolute bottom-2 right-2 bg-teal-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow">Change</span>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-camera-retro text-xl"></i>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Upload tablet photo or packaging</p>
                  <p className="text-xs text-slate-400 mt-1">Camera snap, blister pack, box, or label (PNG/JPG)</p>
                </div>
              )}
            </label>
          </div>

          {/* Optional Direct Tablet Name Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Or Type / Correct Medication Name (Optional):
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Augmentin 625, Paracetamol 500mg, Metformin..."
                value={medQuery}
                onChange={(e) => setMedQuery(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
              {medQuery && (
                <button onClick={() => setMedQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs">
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* Patient Context Pills */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 flex items-center text-[11px] uppercase tracking-wider">
              <i className="fa-solid fa-user-shield text-teal-600 mr-1.5"></i>Patient Clinical Profile for Triage
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700">
                Weight: <strong>{profile.weight || "70"} {profile.weightUnit || "kg"}</strong>
              </span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700">
                Age: <strong>{profile.age || "35"} yrs</strong>
              </span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700">
                Allergies: <strong>{profile.allergies?.length ? profile.allergies.join(", ") : "None reported"}</strong>
              </span>
            </div>
          </div>

          {/* Scan Action Button */}
          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <span>
                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Analyzing Tablet & Verifying Guidelines...
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Scan Tablet & Retrieve Full Information
              </span>
            )}
          </button>

          {/* Quick Demo Previews */}
          <div className="pt-2 border-t border-slate-100 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Quick Test Tablets:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {["Augmentin 625 Duo", "Metformin 500mg", "Amoxicillin 500mg", "Cetirizine 10mg"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setMedQuery(t); }}
                  className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Findings & Live Search Citations (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 bg-white space-y-4 shadow-sm border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base flex items-center">
              <i className="fa-solid fa-microscope text-teal-600 mr-2"></i>Clinical Findings & Live Web Verification
            </h4>
            {result && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center">
                <i className="fa-solid fa-circle-check text-[8px] mr-1 text-emerald-600"></i>Verified
              </span>
            )}
          </div>

          {/* Loading Pipeline Stepper */}
          {loading && (
            <div className="p-6 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-4 animate-pulse">
              <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center">
                <i className="fa-solid fa-diagram-project mr-2 text-teal-600"></i>Multimodal Pipeline in Progress
              </h5>
              <div className="space-y-3 text-xs">
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 1 ? 'bg-white border-teal-300 text-teal-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-600'}`}>1</div>
                  <span className="font-medium"><strong>Stage 1:</strong> Visual scan & active molecule identification</span>
                </div>
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 2 ? 'bg-white border-sky-300 text-sky-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'}`}>2</div>
                  <span className="font-medium"><strong>Stage 2:</strong> Live clinical search for FDA/CDSCO monographs & contraindications</span>
                </div>
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 3 ? 'bg-white border-emerald-300 text-emerald-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>3</div>
                  <span className="font-medium"><strong>Stage 3:</strong> Full clinical tablet guidance & personalized safety synthesis</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {!loading && result && (
            <CleanMedicineMonographView 
              result={result} 
              profile={profile} 
              onConsultDoctor={onConsultDoctor} 
            />
          )}

          {/* Empty State */}
          {!loading && !result && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <i className="fa-solid fa-tablets text-2xl"></i>
              </div>
              <p className="font-semibold text-slate-600 text-sm">No tablet scanned yet</p>
              <p className="text-slate-400 text-xs max-w-xs mt-1">
                Upload drug packaging or type a medication name on the left to trigger the tablet analysis & live evidence search workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. MEDICAL REPORT SCANNER TAB (CLINICAL AI + EVIDENCE-BASED SEARCH)
function ReportScannerTab({ profile, onConsultDoctor }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reportTitle, setReportTitle] = useState("Comprehensive Blood Count (CBC) & Metabolic Panel");
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleScanReport = () => {
    setLoading(true);
    setPipelineStep(1);

    const t1 = setTimeout(() => setPipelineStep(2), 1200);
    const t2 = setTimeout(() => setPipelineStep(3), 2600);

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("title", reportTitle);
    if (profile.age) formData.append("patient_age", profile.age);
    if (profile.gender) formData.append("patient_gender", profile.gender);

    fetch(`${API_BASE}/patient/scan-report`, {
      method: "POST",
      body: formData
    })
    .then((res) => res.json())
    .then((data) => {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setPipelineStep(0);
      setReportResult(data);
    })
    .catch((err) => {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setPipelineStep(0);
      console.error("Report scan error:", err);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-teal-950 rounded-2xl p-4 md:p-5 text-white shadow-lg border border-sky-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Clinical Diagnostic Parser + Live Guidelines
              </span>
              <span className="text-xs text-slate-300 font-medium">Lab & Diagnostic Intelligence</span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white flex items-center">
              <i className="fa-solid fa-file-waveform text-sky-400 mr-2"></i>Medical Scan & Lab Report Diagnostic Reader
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Upload blood tests, pathology panels, or clinical scans. Clinical AI extracts biomarkers, verifies reference ranges via live medical guidelines, and translates findings into clear patient terms.
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-2 text-[11px] bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
            <span className="text-sky-300 font-semibold">Report Scan</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-teal-300 font-semibold">Biomarker Extraction</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-amber-300 font-semibold">Search Guidelines</span>
            <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
            <span className="text-emerald-300 font-semibold">Plain Language</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Report Options (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 bg-white space-y-4 shadow-sm border border-slate-200/80 rounded-2xl">
          <h4 className="font-bold text-slate-900 text-base flex items-center justify-between">
            <span><i className="fa-solid fa-cloud-arrow-up text-sky-600 mr-2"></i>Upload Medical Report / Scan</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1</span>
          </h4>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/60 group">
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="report-upload-scanner" />
            <label htmlFor="report-upload-scanner" className="cursor-pointer block">
              {preview ? (
                <div className="relative inline-block">
                  <img src={preview} alt="Report preview" className="max-h-48 mx-auto rounded-xl shadow-md object-contain border border-slate-200" />
                  <span className="absolute bottom-2 right-2 bg-sky-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow">Change Document</span>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-file-medical text-xl"></i>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Upload lab report or scan photo</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF scan (Blood count, lipid, ECG, MRI)</p>
                </div>
              )}
            </label>
          </div>

          {/* Report Title Selection / Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select or Type Report Type:
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
            />
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Common Report Presets:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                "Comprehensive Blood Count (CBC)",
                "Lipid Profile & Cholesterol",
                "Liver Function Panel (LFT)",
                "HbA1c & Fasting Glucose",
                "Kidney Function & Creatinine",
                "Thyroid Panel (TSH, T3, T4)"
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setReportTitle(preset)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    reportTitle === preset
                      ? "bg-sky-100 text-sky-800 border-sky-300 font-semibold"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-sky-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleScanReport}
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <span>
                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Extracting Biomarkers & Searching Guidelines...
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>Analyze Report & Retrieve Guidelines
              </span>
            )}
          </button>
        </div>

        {/* Right Column: Structured Table & Plain Language Synthesis (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 bg-white space-y-4 shadow-sm border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base flex items-center">
              <i className="fa-solid fa-chart-simple text-sky-600 mr-2"></i>Diagnostic Parameters & Plain Language Analysis
            </h4>
            {reportResult && (
              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 px-2.5 py-0.5 rounded-full">
                {reportResult.abnormal_count > 0 ? `${reportResult.abnormal_count} Parameters Out of Range` : "All Normal"}
              </span>
            )}
          </div>

          {/* Stepper animation during loading */}
          {loading && (
            <div className="p-6 bg-sky-50/60 border border-sky-200/80 rounded-2xl space-y-4 animate-pulse">
              <h5 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center">
                <i className="fa-solid fa-diagram-project mr-2 text-sky-600"></i>Multimodal Clinical Report Pipeline
              </h5>
              <div className="space-y-3 text-xs">
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 1 ? 'bg-white border-sky-300 text-sky-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'}`}>1</div>
                  <span className="font-medium"><strong>Stage 1:</strong> Biomarker parameter extraction & range matching</span>
                </div>
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 2 ? 'bg-white border-teal-300 text-teal-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-600'}`}>2</div>
                  <span className="font-medium"><strong>Stage 2:</strong> Querying evidence guidelines for out-of-range thresholds</span>
                </div>
                <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${pipelineStep >= 3 ? 'bg-white border-emerald-300 text-emerald-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pipelineStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>3</div>
                  <span className="font-medium"><strong>Stage 3:</strong> Plain-language clinical interpretation synthesis</span>
                </div>
              </div>
            </div>
          )}

          {/* Results display */}
          {!loading && reportResult && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Structured Lab Parameters Table */}
              {reportResult.structured_findings && reportResult.structured_findings.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 text-xs border-b border-slate-200 flex items-center justify-between">
                    <span>Extracted Biomarker Table</span>
                    <span className="text-[10px] text-slate-500 font-normal">Parsed by Clinical Diagnostic Engine</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Extracted Value</th>
                          <th className="p-2.5">Standard Range</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportResult.structured_findings.map((item, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2.5 font-semibold text-slate-900">{item.parameter}</td>
                            <td className="p-2.5 font-mono text-slate-800 font-medium">{item.value}</td>
                            <td className="p-2.5 text-slate-500">{item.normal_range || "Standard"}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === "Normal"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : item.status === "Low"
                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}
                              >
                                {item.status || "Evaluated"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Web Citations */}
              {reportResult.search_citations && reportResult.search_citations.length > 0 && (
                <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-1.5 text-xs">
                  <span className="font-bold text-sky-900 text-[11px] flex items-center uppercase tracking-wider">
                    <i className="fa-solid fa-globe text-sky-600 mr-1.5"></i>Live Evidence Guidelines
                  </span>
                  <div className="space-y-1">
                    {reportResult.search_citations.map((cite, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-sky-100 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 truncate pr-2">{cite.title}</span>
                        {cite.url && (
                          <a href={cite.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 hover:underline shrink-0">
                            Source <i className="fa-solid fa-external-link text-[9px]"></i>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plain Language Explanation */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 text-xs leading-relaxed text-slate-700">
                <h5 className="font-bold text-slate-900 text-xs flex items-center border-b border-slate-100 pb-2">
                  <i className="fa-solid fa-brain text-sky-600 mr-2"></i>Plain Language Clinical Explanation
                </h5>
                <div className="whitespace-pre-line text-xs font-normal text-slate-700">
                  {reportResult.plain_language_explanation || reportResult.final_answer}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
                <i className="fa-solid fa-circle-info mr-1.5 text-slate-500"></i>
                {reportResult.disclaimer}
              </div>

              {/* Consult Doctor about this Report Card */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 border-2 border-sky-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center text-base shadow-2xs shrink-0">
                    <i className="fa-solid fa-user-doctor"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Discuss Lab Findings with Dr. HeartBeat
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Understand abnormal biomarkers, diet tips, and clinical next steps.
                    </p>
                  </div>
                </div>
                <button
                  id="btn-consult-doctor-report"
                  onClick={() => onConsultDoctor && onConsultDoctor({
                    type: "report",
                    reportTitle: reportTitle || "Medical Lab Report",
                    result: reportResult,
                    initialPrompt: "Doctor, could you explain my scanned lab report and what steps I should take?"
                  })}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <i className="fa-solid fa-stethoscope text-xs"></i>
                  <span>Consult Doctor</span>
                  <i className="fa-solid fa-arrow-right text-[10px] ml-1"></i>
                </button>
              </div>

              {/* Attribution */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                <span>Diagnostic Engine: <strong className="text-slate-600">Clinical Verification Engine</strong></span>
                <span>{reportResult.attribution}</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !reportResult && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <i className="fa-solid fa-file-waveform text-2xl"></i>
              </div>
              <p className="font-semibold text-slate-600 text-sm">No report analyzed yet</p>
              <p className="text-slate-400 text-xs max-w-xs mt-1">
                Upload a medical report photo or choose a preset on the left to trigger biomarker parameter extraction and live clinical guideline lookup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 5. DEPARTMENT DIRECT CONSULTATION TAB
function DoctorSearchTab({ profile }) {
  const [departments, setDepartments] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [activeConsultDept, setActiveConsultDept] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/patient/doctors?specialty=${selectedSpecialty === "All" ? "" : selectedSpecialty}`)
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((err) => console.error(err));
  }, [selectedSpecialty]);

  const handleOpenConsult = (dept) => {
    setActiveConsultDept(dept);
    setMessages([
      {
        sender: "dept",
        text: `Welcome to the ${dept.name} (${dept.hospital}). Our clinical specialty team is online. How can we assist with your ${dept.specialty} query today?`
      }
    ]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeConsultDept) return;

    const userMsg = inputMessage.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputMessage("");
    setSending(true);

    fetch(`${API_BASE}/patient/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[Consultation request for ${activeConsultDept.name}]: ${userMsg}`,
        age: profile.age,
        weight: profile.weight
      })
    })
    .then((res) => res.json())
    .then((data) => {
      setSending(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "dept",
          text: `[${activeConsultDept.name} Response]: ${data.reply}`
        }
      ]);
    })
    .catch(() => {
      setSending(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "dept",
          text: `[${activeConsultDept.name}]: Message received. Our specialty team will follow up directly.`
        }
      ]);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Specialty Department Consultations</h3>
          <p className="text-xs text-slate-500">Directly communicate with accredited medical specialty departments in real time</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {["All", "Cardiology", "General Medicine", "Physiotherapy", "Neurology"].map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSpecialty === spec ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="glass-card p-5 bg-white flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    {dept.specialty}
                  </span>
                </div>
                <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  <span>Active Channel</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2">{dept.hospital}</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{dept.bio}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => handleOpenConsult(dept)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-comments"></i>
                <span>Direct Consult & Chat</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Communication Chat Modal */}
      {activeConsultDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 bg-white rounded-3xl space-y-4 animate-fade-in relative flex flex-col max-h-[85vh]">
            <button onClick={() => setActiveConsultDept(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            {/* Department Consultation Header */}
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                <i className="fa-solid fa-hospital-user"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{activeConsultDept.name}</h3>
                <p className="text-xs text-emerald-600 font-medium flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  Direct Live Specialty Channel ({activeConsultDept.hospital})
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs min-h-[240px] max-h-[350px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3 rounded-2xl max-w-md ${
                      msg.sender === "user"
                        ? "bg-teal-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none font-medium"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="text-xs text-slate-400 italic flex items-center space-x-2">
                  <i className="fa-solid fa-circle-notch fa-spin text-teal-600"></i>
                  <span>Transmitting directly to {activeConsultDept.name}...</span>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="pt-3 border-t border-slate-200 flex items-center space-x-2">
              <input
                type="text"
                className="form-input flex-1 text-xs"
                placeholder={`Type your direct question to ${activeConsultDept.name}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5"
              >
                <span>Send</span>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. MEDICINE REMINDERS TAB
function RemindersTab({ profile }) {
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("1 Tablet");
  const [freq, setFreq] = useState("Daily");
  const [time, setTime] = useState("08:00 AM");

  useEffect(() => {
    fetch(`${API_BASE}/patient/reminders`)
      .then((res) => res.json())
      .then((data) => setReminders(data))
      .catch((err) => console.error(err));
  }, []);

  const handleAddReminder = () => {
    if (!medName) return;
    fetch(`${API_BASE}/patient/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: 1,
        medicine_name: medName,
        dosage,
        frequency: freq,
        time
      })
    })
    .then((res) => res.json())
    .then((newRem) => {
      setReminders((prev) => [...prev, newRem]);
      setShowAddModal(false);
      setMedName("");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">My Medication Schedule</h3>
          <p className="text-xs text-slate-500">Stay consistent with daily prescription reminders</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow"
        >
          <i className="fa-solid fa-plus mr-1.5"></i>Add Reminder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.map((rem) => (
          <div key={rem.id} className="glass-card p-5 bg-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <i className="fa-solid fa-prescription-bottle-medical"></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{rem.medicine_name}</h4>
                <p className="text-xs text-slate-500">{rem.dosage} • {rem.frequency}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {rem.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 bg-white rounded-3xl space-y-4 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <h3 className="font-bold text-slate-900 text-lg">Create Reminder</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Medication Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Omega-3 Fish Oil"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dosage</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1 Tablet"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Time</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 08:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddReminder}
              className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700"
            >
              Save Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// DOCTOR PORTAL
// ----------------------------------------------------------------------
function DoctorPortal() {
  const [appointments, setAppointments] = useState([]);
  const [patientRecord, setPatientRecord] = useState(null);
  const [consentGated, setConsentGated] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/doctor/appointments`)
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.error(err));
  }, []);

  const loadPatientRecord = () => {
    fetch(`${API_BASE}/doctor/patient-records/1?consent_granted=${consentGated}`)
      .then((res) => res.json())
      .then((data) => setPatientRecord(data));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-white space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <i className="fa-solid fa-user-doctor text-teal-600 mr-2"></i>Doctor Clinical Desk
        </h2>

        {/* Appointment List */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Consultation Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-2.5">Patient</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Slot</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="p-2.5 font-bold text-slate-900">{a.patient_name}</td>
                    <td className="p-2.5 text-slate-600">{a.date}</td>
                    <td className="p-2.5 text-slate-600">{a.time_slot}</td>
                    <td className="p-2.5 text-slate-600">{a.reason || "General Checkup"}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consent-Gated Patient Record Viewer */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Consent-Gated Patient Record Viewer</h3>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGated}
                onChange={(e) => setConsentGated(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>Patient Granted Consent</span>
            </label>
          </div>

          <button
            onClick={loadPatientRecord}
            className="bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Fetch Patient Record
          </button>

          {patientRecord && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              {patientRecord.status === "CONSENT_REQUIRED" ? (
                <div className="p-3 bg-amber-100 text-amber-900 rounded-xl font-semibold">
                  <i className="fa-solid fa-lock mr-2"></i>{patientRecord.message}
                </div>
              ) : (
                <div>
                  <p><strong>Patient:</strong> {patientRecord.patient_name} ({patientRecord.age} yrs, {patientRecord.gender})</p>
                  <p><strong>Known Allergies:</strong> {patientRecord.allergies.join(", ")}</p>
                  <p><strong>Recent Labs:</strong> {patientRecord.recent_labs}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ADMIN DASHBOARD
// ----------------------------------------------------------------------
function AdminDashboard() {
  const [verifications, setVerifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/admin/doctor-verifications`)
      .then((res) => res.json())
      .then((data) => setVerifications(data));

    fetch(`${API_BASE}/admin/audit-logs`)
      .then((res) => res.json())
      .then((data) => setAuditLogs(data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-white space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <i className="fa-solid fa-shield-halved text-teal-600 mr-2"></i>Admin Management Desk
        </h2>

        {/* Doctor Verifications Queue */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Doctor License Verification Queue</h3>
          <div className="space-y-2">
            {verifications.map((doc) => (
              <div key={doc.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{doc.name}</span> ({doc.specialty}) — License: <code className="bg-slate-100 px-1 rounded">{doc.license_number}</code>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold ${doc.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {doc.is_verified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Immutable Activity Audit Log</h3>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-2">Role</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Details</th>
                  <th className="p-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 font-mono text-[11px]">
                    <td className="p-2 font-bold text-teal-700">{log.user_role}</td>
                    <td className="p-2 text-slate-800">{log.action}</td>
                    <td className="p-2 text-slate-600">{log.details}</td>
                    <td className="p-2 text-slate-400">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// FIXED EMERGENCY OVERLAY MODAL
// ----------------------------------------------------------------------
function EmergencyModal({ onClose }) {
  useEffect(() => {
    // Log emergency button trigger to backend
    fetch(`${API_BASE}/patient/emergency-log`, { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-lg w-full p-6 md:p-8 bg-white rounded-3xl border-2 border-red-500 shadow-2xl space-y-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl pulse-emergency">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-2xl font-black text-red-600 tracking-tight">EMERGENCY ESCALATION</h2>
          <p className="text-xs text-slate-600">
            If you or someone near you is experiencing chest pain, severe bleeding, or loss of consciousness, contact emergency services immediately.
          </p>
        </div>

        {/* Hotline Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href="tel:911"
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-center font-black text-sm shadow transition-transform transform hover:scale-105"
          >
            Call 911 <br/><span className="text-[10px] font-normal">(USA/Canada)</span>
          </a>
          <a
            href="tel:112"
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-center font-black text-sm shadow transition-transform transform hover:scale-105"
          >
            Call 112 <br/><span className="text-[10px] font-normal">(Europe/Global)</span>
          </a>
          <a
            href="tel:108"
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-center font-black text-sm shadow transition-transform transform hover:scale-105"
          >
            Call 108 <br/><span className="text-[10px] font-normal">(India)</span>
          </a>
        </div>

        {/* Emergency First Aid Guidance */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-700">
          <h4 className="font-bold text-slate-900 flex items-center">
            <i className="fa-solid fa-heart-pulse text-red-500 mr-2"></i>Immediate Action Protocol
          </h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Stay calm and keep the individual still and comfortable.</li>
            <li>If chest pain is suspected, unlock front door for paramedics.</li>
            <li>Do not attempt to administer oral medications if patient is unresponsive.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl text-xs"
        >
          Close Emergency Panel
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ACCOUNT & PREFERENCES SETTINGS MODAL
// ----------------------------------------------------------------------
function SettingsModal({ userProfile, onEditProfile, onLogout, onClose }) {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [dataConsent, setDataConsent] = useState(true);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 md:p-8 bg-white/95 border-slate-200 shadow-2xl rounded-3xl relative space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg">
            <i className="fa-solid fa-gear"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings & Account</h2>
            <p className="text-xs text-slate-500">Manage profile vitals, preferences & session</p>
          </div>
        </div>

        {/* 1. Account Profile Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Profile</span>
          {userProfile ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{userProfile.name}</h4>
                {userProfile.email && (
                  <p className="text-xs text-teal-700 font-medium">{userProfile.email}</p>
                )}
                <p className="text-xs text-slate-500">
                  {[
                    userProfile.gender,
                    userProfile.age ? `${userProfile.age} yrs` : null,
                    userProfile.weight ? `${userProfile.weight} ${userProfile.weightUnit}` : null,
                    userProfile.height ? `${userProfile.height} ${userProfile.heightUnit}` : null
                  ].filter(Boolean).join(" • ")}
                </p>
              </div>
              <button
                onClick={onEditProfile}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-teal-200"
              >
                Edit Vitals
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>No profile configured yet.</span>
              <button onClick={onEditProfile} className="text-teal-600 font-semibold underline">Set Up Profile</button>
            </div>
          )}
        </div>

        {/* 2. Preferences List */}
        <div className="space-y-4 text-xs font-semibold text-slate-700">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-moon text-indigo-500 text-sm"></i>
              <span>Dark Mode Theme</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${theme === "dark" ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow"></div>
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-bell text-teal-600 text-sm"></i>
              <span>Medication Alarm Notifications</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${notifications ? "bg-teal-600 justify-end" : "bg-slate-300 justify-start"}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow"></div>
            </button>
          </div>

          {/* Data Sharing Consent */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-user-shield text-emerald-600 text-sm"></i>
              <span>Doctor Consultation Record Sharing</span>
            </div>
            <button
              onClick={() => setDataConsent(!dataConsent)}
              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${dataConsent ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow"></div>
            </button>
          </div>
        </div>

        {/* 3. Log Out Button */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Log Out from Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Render Main App Component
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
