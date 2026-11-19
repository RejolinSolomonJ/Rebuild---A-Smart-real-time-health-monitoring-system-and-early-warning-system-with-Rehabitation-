import React from "react";

/**
 * High-definition SVG Exercise Illustrations for the 4 canonical exercises.
 * Clean, biomechanically clear, Dark-Theme Kinora styled vector graphics.
 */

export function SeatedKneeExtensionIllustration({ className = "w-full h-40" }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background grid / floor line */}
      <line x1="20" y1="125" x2="180" y2="125" stroke="#25332a" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Sturdy Chair */}
      <path d="M50 70 H90 V125" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 35 V125" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      
      {/* Torso / Head */}
      <circle cx="68" cy="38" r="10" fill="#a3e635" />
      <path d="M68 48 L68 85" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" />
      
      {/* Arm resting on lap */}
      <path d="M68 56 L82 72 L75 80" stroke="#84cc16" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Stationary thigh */}
      <path d="M68 85 L105 85" stroke="#84cc16" strokeWidth="6" strokeLinecap="round" />
      
      {/* Left leg (resting on floor 90 deg) */}
      <path d="M105 85 L105 125 L115 125" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Right leg EXTENDED (Active Knee Extension) */}
      <path d="M105 85 L155 88 L160 80" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Knee joint highlight & Extension Arc */}
      <circle cx="105" cy="85" r="4.5" fill="#38bdf8" />
      <path d="M105 110 A 25 25 0 0 1 130 85" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
      
      {/* Movement trajectory arrow */}
      <path d="M138 112 Q155 105 156 93" stroke="#84cc16" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      
      {/* Target Angle badge */}
      <rect x="125" y="60" width="48" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <text x="149" y="73" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">170° EXT</text>
    </svg>
  );
}

export function SitToStandIllustration({ className = "w-full h-40" }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="125" x2="180" y2="125" stroke="#25332a" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Chair */}
      <path d="M40 78 H75 V125" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 45 V125" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      
      {/* Ghost Seated Position */}
      <circle cx="58" cy="48" r="8" fill="#334155" fillOpacity="0.5" />
      <path d="M58 56 L58 85 L85 85 L85 125" stroke="#334155" strokeWidth="3" strokeDasharray="3 3" />
      
      {/* Active Standing Figure */}
      <circle cx="120" cy="28" r="10" fill="#a3e635" />
      <path d="M120 38 L120 75" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" />
      
      {/* Arms crossed on chest (CDC protocol) */}
      <path d="M110 50 L125 50" stroke="#84cc16" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 46 L112 55" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" />
      
      {/* Fully Extended Hips & Knees */}
      <path d="M120 75 L118 100 L118 125 L128 125" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M120 75 L125 100 L125 125 L135 125" stroke="#84cc16" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Vertical Rise Arrow */}
      <path d="M85 75 Q95 40 108 35" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M103 32 L110 35 L106 42" fill="#38bdf8" />
      
      {/* Protocol Badge */}
      <rect x="135" y="48" width="56" height="18" rx="4" fill="#0f172a" stroke="#84cc16" strokeWidth="1" />
      <text x="163" y="61" fill="#84cc16" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CDC STAND</text>
    </svg>
  );
}

export function StandingHeelRaiseIllustration({ className = "w-full h-40" }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="125" x2="180" y2="125" stroke="#25332a" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Support Balance Bar / Chair */}
      <path d="M60 40 V125" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 40 H70" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      
      {/* Person standing tall */}
      <circle cx="100" cy="28" r="10" fill="#a3e635" />
      <path d="M100 38 L100 75" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" />
      
      {/* Arm resting on balance bar */}
      <path d="M100 48 L75 44 L60 42" stroke="#84cc16" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Thigh & Leg */}
      <path d="M100 75 L100 98" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" />
      
      {/* Active Calf Muscle Highlight */}
      <ellipse cx="102" cy="104" rx="5" ry="8" fill="#f43f5e" fillOpacity="0.4" stroke="#f43f5e" strokeWidth="1.5" />
      
      {/* Elevated Heel on Toes */}
      <path d="M100 98 L102 118 L114 125" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Heel elevation indicator */}
      <path d="M96 125 L96 116" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 2" />
      <path d="M93 118 L96 114 L99 118" fill="#f43f5e" />
      
      {/* Calf Pump Badge */}
      <rect x="120" y="88" width="68" height="18" rx="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
      <text x="154" y="101" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CALF PUMP</text>
    </svg>
  );
}

export function ShoulderFrontRaiseIllustration({ className = "w-full h-40" }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="125" x2="180" y2="125" stroke="#25332a" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Standing upright posture */}
      <circle cx="90" cy="30" r="10" fill="#a3e635" />
      <path d="M90 40 L90 85" stroke="#84cc16" strokeWidth="5" strokeLinecap="round" />
      
      {/* Legs straight */}
      <path d="M90 85 L86 125 L78 125" stroke="#84cc16" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M90 85 L94 125 L102 125" stroke="#84cc16" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Left arm down (at rest) */}
      <path d="M90 48 L90 78" stroke="#334155" strokeWidth="3" strokeDasharray="3 3" />
      
      {/* Right arm ELEVATED to 90° shoulder height */}
      <path d="M90 48 L142 48 L148 45" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Shoulder Joint highlight */}
      <circle cx="90" cy="48" r="4.5" fill="#38bdf8" />
      
      {/* 90° Arc */}
      <path d="M90 70 A 22 22 0 0 1 112 48" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
      
      {/* Elevation Trajectory Arrow */}
      <path d="M125 72 Q145 68 143 54" stroke="#84cc16" strokeWidth="2" fill="none" />
      <path d="M140 54 L144 50 L146 56" fill="#84cc16" />
      
      {/* Shoulder Height Badge */}
      <rect x="130" y="24" width="58" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <text x="159" y="37" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">90° RAISE</text>
    </svg>
  );
}

export function ExerciseIllustration({ exerciseId, className = "w-full h-40" }) {
  switch (exerciseId) {
    case "seated_knee_extension":
      return <SeatedKneeExtensionIllustration className={className} />;
    case "sit_to_stand":
      return <SitToStandIllustration className={className} />;
    case "standing_heel_raise":
      return <StandingHeelRaiseIllustration className={className} />;
    case "shoulder_raise":
      return <ShoulderFrontRaiseIllustration className={className} />;
    default:
      return <SeatedKneeExtensionIllustration className={className} />;
  }
}
