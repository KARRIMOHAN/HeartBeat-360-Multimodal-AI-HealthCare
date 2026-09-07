import React, { useState, useEffect } from 'react';
// Note: In browser runtime environments without CSS module bundlers, ensure DashboardSection.css is linked in HTML or imported here
try {
  // Safe relative import for modern bundlers (Webpack / Vite)
  if (typeof require !== 'undefined') {
    require('./DashboardSection.css');
  }
} catch (e) {}

/**
 * --------------------------------------------------------------------------
 * HEALTH TIP OF THE DAY COMPONENT
 * --------------------------------------------------------------------------
 * Displays a daily, non-clinical wellness tip chosen deterministically by date.
 */
export function HealthTipOfTheDay() {
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

  // Deterministic daily tip based on day of the year
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

/**
 * HeartBeat 360 — DashboardSection Widget
 * Features:
 *  1. Health Tip of the Day (Deterministic Daily Wellness)
 *  2. Safety-Status Risk Ring (Clinical 3-Tier Triage Engine)
 *  3. Recent Multimodal Activity Feed (Prescription OCR, Lab Reports, AI Triage)
 *  4. Medication Reminder Live Countdown Timer & Quick-Take Action
 */
export default function DashboardSection({ profile = null, setActiveTab = () => {} }) {
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
        
        {/* ================================================================== */}
        {/* WIDGET 1: Health Tip of the Day                                    */}
        {/* ================================================================== */}
        <HealthTipOfTheDay />

        {/* ================================================================== */}
        {/* WIDGET 2: User Health Status & Active Problems                     */}
        {/* ================================================================== */}
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

        {/* ================================================================== */}
        {/* WIDGET 3: Recent Activity Multimodal Feed                          */}
        {/* ================================================================== */}
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

            {/* Activity Items List */}
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

        {/* ================================================================== */}
        {/* WIDGET 4: Medication Reminder Countdown - Linked to Recent Activity */}
        {/* ================================================================== */}
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

            {/* Countdown Box */}
            <div className="countdown-box">
              <div className="flex items-center justify-center space-x-2 text-slate-800">
                <i className="fa-solid fa-capsules text-teal-600"></i>
                <span className="text-xs font-bold">{activeDose.medicineName}</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {activeDose.dosage} • {activeDose.instructions}
              </span>

              {/* Digital Countdown Timer */}
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

// Attach to window object for seamless in-browser script environments
if (typeof window !== "undefined") {
  window.HealthTipOfTheDay = HealthTipOfTheDay;
  window.DashboardSection = DashboardSection;
}
