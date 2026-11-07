import React from "react";

interface TruckArtProps {
  variant: "pickup" | "taxi" | "porter" | "gazelle" | "manipulator" | "dumptruck" | "longhaul";
  className?: string;
}

export function TruckArt({ variant, className = "" }: TruckArtProps) {
  if (variant === "pickup") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Самовывоз со склада Bizon TJ"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        <ellipse cx="250" cy="204" rx="200" ry="8" fill="#E2E8F0" />

        {/* Warehouse Building Front */}
        <rect x="50" y="60" width="400" height="110" rx="6" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <rect x="65" y="75" width="110" height="95" fill="#334155" />
        <rect x="195" y="75" width="110" height="95" fill="#334155" />
        <rect x="325" y="75" width="110" height="95" fill="#334155" />

        {/* Roller Shutter Doors */}
        <line x1="65" y1="95" x2="175" y2="95" stroke="#475569" strokeWidth="2" />
        <line x1="65" y1="115" x2="175" y2="115" stroke="#475569" strokeWidth="2" />
        <line x1="65" y1="135" x2="175" y2="135" stroke="#475569" strokeWidth="2" />
        <line x1="65" y1="155" x2="175" y2="155" stroke="#475569" strokeWidth="2" />

        <line x1="195" y1="95" x2="305" y2="95" stroke="#475569" strokeWidth="2" />
        <line x1="195" y1="115" x2="305" y2="115" stroke="#475569" strokeWidth="2" />
        <line x1="195" y1="135" x2="305" y2="135" stroke="#475569" strokeWidth="2" />
        <line x1="195" y1="155" x2="305" y2="155" stroke="#475569" strokeWidth="2" />

        {/* Loading Ramp */}
        <rect x="40" y="170" width="420" height="25" rx="3" fill="#64748B" stroke="#475569" strokeWidth="2" />
        {/* Forklift */}
        <rect x="220" y="140" width="50" height="30" rx="4" fill="#F59E0B" />
        <circle cx="230" cy="172" r="8" fill="#0F172A" />
        <circle cx="260" cy="172" r="8" fill="#0F172A" />

        <text x="35" y="32" fill="#1E293B" fontSize="16" fontWeight="bold">САМОВЫВОЗ СО СКЛАДА (ДУШАНБЕ)</text>
        <text x="35" y="50" fill="#64748B" fontSize="12">Бесплатная погрузка автопогрузчиком склада, готовность 30 минут</text>
      </svg>
    );
  }

  if (variant === "taxi") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Экспресс-такси Daewoo Damas"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        <ellipse cx="250" cy="204" rx="140" ry="7" fill="#E2E8F0" />

        {/* Damas Van Body */}
        <path
          d="M140 175 V90 C140 82 146 76 155 76 H310 C325 76 338 88 344 102 L358 135 C361 142 363 150 363 158 V175 H140 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />

        {/* Roof line */}
        <rect x="150" y="70" width="160" height="6" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

        {/* Windows */}
        <rect x="155" y="86" width="65" height="42" rx="3" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
        <rect x="230" y="86" width="60" height="42" rx="3" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
        <path d="M300 86 H318 C324 86 329 90 332 96 L348 128 H300 V86 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />

        {/* Damas side stripe */}
        <rect x="140" y="145" width="223" height="8" fill="#3B82F6" />

        {/* Wheels */}
        <circle cx="185" cy="182" r="20" fill="#0F172A" />
        <circle cx="185" cy="182" r="10" fill="#E2E8F0" />
        <circle cx="315" cy="182" r="20" fill="#0F172A" />
        <circle cx="315" cy="182" r="10" fill="#E2E8F0" />

        {/* Headlight & bumper */}
        <rect x="355" y="150" width="8" height="12" rx="2" fill="#FBBF24" />
        <rect x="345" y="165" width="20" height="10" rx="3" fill="#334155" />
        <rect x="135" y="165" width="12" height="10" rx="3" fill="#334155" />

        {/* Taxi checker badge */}
        <rect x="220" y="60" width="36" height="10" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
        <text x="226" y="68" fill="#0F172A" fontSize="7" fontWeight="bold">TAXI</text>

        <text x="35" y="32" fill="#1E293B" fontSize="16" fontWeight="bold">ЭКСПРЕСС-ТАКСИ / DAEWOO DAMAS (ДО 250 КГ)</text>
        <text x="35" y="50" fill="#64748B" fontSize="12">Инструмент, сантехника, метизы, краски. Подача за 15-20 минут</text>
      </svg>
    );
  }
  if (variant === "porter") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Грузовик Лабо / Porter"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        {/* Road line */}
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        
        {/* Ground shadow */}
        <ellipse cx="250" cy="204" rx="180" ry="8" fill="#E2E8F0" />

        {/* Cargo Flatbed */}
        <rect x="60" y="115" width="240" height="55" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2.5" />
        <rect x="65" y="80" width="70" height="35" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <rect x="145" y="80" width="70" height="35" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <rect x="225" y="85" width="65" height="30" rx="3" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <line x1="60" y1="140" x2="300" y2="140" stroke="#1D4ED8" strokeWidth="2" />
        
        {/* Dropside latches */}
        <circle cx="90" cy="140" r="3" fill="#93C5FD" />
        <circle cx="170" cy="140" r="3" fill="#93C5FD" />
        <circle cx="250" cy="140" r="3" fill="#93C5FD" />

        {/* Chassis frame */}
        <rect x="80" y="170" width="310" height="12" rx="2" fill="#334155" />

        {/* Cab */}
        <path
          d="M300 170 V85 C300 75 308 65 318 65 H370 C385 65 400 78 406 95 L425 140 C428 147 430 155 430 162 V170 H300 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Windshield */}
        <path
          d="M360 76 H330 V125 H400 L378 88 C374 81 367 76 360 76 Z"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeWidth="2"
        />
        {/* Side window */}
        <rect x="315" y="85" width="35" height="40" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        {/* Door line */}
        <line x1="355" y1="85" x2="355" y2="170" stroke="#CBD5E1" strokeWidth="2" />
        {/* Door handle */}
        <rect x="362" y="132" width="12" height="4" rx="2" fill="#475569" />

        {/* Headlight */}
        <path d="M422 145 H430 V160 H422 C419 160 417 155 419 148 C420 146 421 145 422 145 Z" fill="#FBBF24" />
        {/* Bumper */}
        <rect x="415" y="165" width="22" height="18" rx="4" fill="#1E293B" />

        {/* Wheels */}
        {/* Rear Wheel */}
        <circle cx="140" cy="190" r="24" fill="#0F172A" />
        <circle cx="140" cy="190" r="14" fill="#94A3B8" />
        <circle cx="140" cy="190" r="6" fill="#475569" />

        {/* Front Wheel */}
        <circle cx="365" cy="190" r="24" fill="#0F172A" />
        <circle cx="365" cy="190" r="14" fill="#94A3B8" />
        <circle cx="365" cy="190" r="6" fill="#475569" />

        {/* Label */}
        <text x="35" y="45" fill="#1E293B" fontSize="16" fontWeight="bold">PORTER / ЛАБО</text>
        <text x="35" y="65" fill="#64748B" fontSize="12">Грузоподъёмность: до 1.5 т · Объём: 9 м³</text>
      </svg>
    );
  }

  if (variant === "gazelle") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Грузовик Газель NEXT"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        <ellipse cx="250" cy="204" rx="200" ry="8" fill="#E2E8F0" />

        {/* Gazelle Tilt Body (Тент) */}
        <path
          d="M50 75 H280 V170 H50 V75 Z"
          fill="#2563EB"
          stroke="#1D4ED8"
          strokeWidth="3"
        />
        {/* Tilt Ribs & Straps */}
        <line x1="105" y1="75" x2="105" y2="170" stroke="#1E40AF" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="160" y1="75" x2="160" y2="170" stroke="#1E40AF" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="215" y1="75" x2="215" y2="170" stroke="#1E40AF" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="270" y1="75" x2="270" y2="170" stroke="#1E40AF" strokeWidth="2" strokeDasharray="4 4" />
        {/* Bottom metal dropside */}
        <rect x="50" y="145" width="230" height="25" fill="#1E3A8A" />
        <line x1="50" y1="145" x2="280" y2="145" stroke="#93C5FD" strokeWidth="1.5" />

        {/* Chassis */}
        <rect x="70" y="170" width="340" height="14" rx="2" fill="#334155" />

        {/* Gazelle NEXT Cab */}
        <path
          d="M280 170 V90 C280 80 288 72 298 72 H350 C365 72 378 82 384 96 L415 142 C418 148 422 155 422 163 V170 H280 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Windshield */}
        <path
          d="M345 80 H315 V128 H395 L372 90 C368 84 358 80 345 80 Z"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeWidth="2"
        />
        {/* Side window */}
        <rect x="295" y="88" width="40" height="40" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        <line x1="340" y1="88" x2="340" y2="170" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="348" y="132" width="14" height="4" rx="2" fill="#475569" />

        {/* Grille & Headlight */}
        <path d="M414 148 H422 V162 H414 Z" fill="#FBBF24" />
        <rect x="408" y="165" width="22" height="18" rx="4" fill="#0F172A" />

        {/* Dual Rear Wheels */}
        <circle cx="120" cy="188" r="26" fill="#0F172A" />
        <circle cx="120" cy="188" r="15" fill="#94A3B8" />
        <circle cx="120" cy="188" r="7" fill="#475569" />

        {/* Front Wheel */}
        <circle cx="360" cy="188" r="26" fill="#0F172A" />
        <circle cx="360" cy="188" r="15" fill="#94A3B8" />
        <circle cx="360" cy="188" r="7" fill="#475569" />

        <text x="35" y="45" fill="#1E293B" fontSize="16" fontWeight="bold">ГАЗЕЛЬ NEXT (4.2 М)</text>
        <text x="35" y="65" fill="#64748B" fontSize="12">Грузоподъёмность: до 3.5 т · Объём: 16 м³ · 4.2 × 2.0 м</text>
      </svg>
    );
  }

  if (variant === "manipulator") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Кран-манипулятор"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        <ellipse cx="250" cy="204" rx="210" ry="8" fill="#E2E8F0" />

        {/* Cargo Dropside Bed with Pallets */}
        <rect x="40" y="130" width="220" height="42" fill="#E2E8F0" stroke="#475569" strokeWidth="2.5" />
        {/* Pallets on bed */}
        <rect x="50" y="90" width="45" height="40" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
        <rect x="105" y="90" width="45" height="40" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
        <rect x="160" y="90" width="45" height="40" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <rect x="210" y="95" width="42" height="35" rx="2" fill="#64748B" stroke="#334155" strokeWidth="1.5" />

        {/* Crane Boom Tower (Yellow) between bed and cab */}
        <rect x="265" y="65" width="22" height="105" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="2.5" />
        {/* Articulated Crane Arm */}
        <path d="M276 70 L210 35 L120 48" stroke="#EAB308" strokeWidth="8" strokeLinecap="round" />
        <circle cx="276" cy="70" r="7" fill="#0F172A" />
        <circle cx="210" cy="35" r="6" fill="#0F172A" />
        {/* Cable & Hook */}
        <line x1="120" y1="48" x2="120" y2="78" stroke="#475569" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M115 78 C115 85 125 85 125 78 C125 72 118 72 118 78" stroke="#0F172A" strokeWidth="2.5" fill="none" />

        {/* Outriggers (Лапы манипулятора) */}
        <rect x="268" y="170" width="16" height="25" fill="#CA8A04" />
        <rect x="262" y="195" width="28" height="6" rx="2" fill="#0F172A" />

        {/* Cab (Heavy 3-axle truck) */}
        <path
          d="M295 170 V80 C295 72 302 65 310 65 H370 C382 65 395 74 402 86 L425 130 C428 136 430 144 430 152 V170 H295 Z"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="3"
        />
        {/* Windshield */}
        <path d="M365 72 H325 V120 H405 L382 82 C378 76 372 72 365 72 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
        {/* Side window */}
        <rect x="305" y="80" width="35" height="38" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        <line x1="345" y1="80" x2="345" y2="170" stroke="#D97706" strokeWidth="2" />

        {/* Heavy Bumper */}
        <rect x="415" y="160" width="22" height="22" rx="4" fill="#1E293B" />
        <circle cx="425" cy="150" r="5" fill="#FBBF24" />

        {/* 3 Axles Wheels (Heavy 6x4) */}
        {/* Rear Axle 1 */}
        <circle cx="85" cy="188" r="25" fill="#0F172A" />
        <circle cx="85" cy="188" r="14" fill="#94A3B8" />
        {/* Rear Axle 2 */}
        <circle cx="145" cy="188" r="25" fill="#0F172A" />
        <circle cx="145" cy="188" r="14" fill="#94A3B8" />
        {/* Front Axle */}
        <circle cx="370" cy="188" r="25" fill="#0F172A" />
        <circle cx="370" cy="188" r="14" fill="#94A3B8" />

        <text x="35" y="38" fill="#1E293B" fontSize="16" fontWeight="bold">КРАН-МАНИПУЛЯТОР (7 ТОНН)</text>
        <text x="35" y="58" fill="#64748B" fontSize="12">Стрела 3 т · Вылет 8 м · Саморазгрузка кирпича, блоков, ЖБИ</text>
      </svg>
    );
  }

  if (variant === "dumptruck") {
    return (
      <svg
        viewBox="0 0 500 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`truck-svg ${className}`}
        aria-label="Самосвал HOWO / КАМАЗ"
      >
        <rect width="500" height="240" rx="16" fill="#F8FAFC" />
        <line x1="20" y1="205" x2="480" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
        <ellipse cx="250" cy="204" rx="210" ry="8" fill="#E2E8F0" />

        {/* Dump Bed (Heavy ribbed steel) */}
        <path
          d="M45 85 L275 85 L285 170 H45 L45 85 Z"
          fill="#DC2626"
          stroke="#991B1B"
          strokeWidth="3"
        />
        {/* Reinforcement Ribs */}
        <line x1="90" y1="85" x2="90" y2="170" stroke="#7F1D1D" strokeWidth="2.5" />
        <line x1="140" y1="85" x2="140" y2="170" stroke="#7F1D1D" strokeWidth="2.5" />
        <line x1="190" y1="85" x2="190" y2="170" stroke="#7F1D1D" strokeWidth="2.5" />
        <line x1="240" y1="85" x2="240" y2="170" stroke="#7F1D1D" strokeWidth="2.5" />
        {/* Aggregate Sand Pile peaking above bed */}
        <path d="M60 85 Q160 55 260 85 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />

        {/* Hydraulic Piston cylinder under bed */}
        <rect x="260" y="120" width="16" height="50" rx="3" fill="#94A3B8" stroke="#475569" strokeWidth="2" />

        {/* Cab (HOWO / КАМАЗ Heavy) */}
        <path
          d="M295 170 V82 C295 72 302 65 312 65 H370 C382 65 394 74 400 86 L422 130 C426 136 428 144 428 152 V170 H295 Z"
          fill="#EA580C"
          stroke="#9A3412"
          strokeWidth="3"
        />
        {/* Windshield */}
        <path d="M362 72 H325 V120 H400 L380 82 C376 76 370 72 362 72 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
        <rect x="305" y="80" width="35" height="38" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />

        {/* Front bumper and visor */}
        <rect x="310" y="58" width="80" height="8" rx="2" fill="#1E293B" />
        <rect x="415" y="160" width="22" height="22" rx="4" fill="#1E293B" />

        {/* Heavy 3 Axle Wheels */}
        <circle cx="85" cy="188" r="26" fill="#0F172A" />
        <circle cx="85" cy="188" r="14" fill="#94A3B8" />
        <circle cx="150" cy="188" r="26" fill="#0F172A" />
        <circle cx="150" cy="188" r="14" fill="#94A3B8" />
        <circle cx="365" cy="188" r="26" fill="#0F172A" />
        <circle cx="365" cy="188" r="14" fill="#94A3B8" />

        <text x="35" y="40" fill="#1E293B" fontSize="16" fontWeight="bold">САМОСВАЛ (15 ТОНН / 12 М³)</text>
        <text x="35" y="60" fill="#64748B" fontSize="12">Для песка, щебня, бетона, гравия и сыпучих стройматериалов</text>
      </svg>
    );
  }

  // variant === "longhaul" (matching user's Screenshot 1 white Mercedes-Benz semi-truck!)
  return (
    <svg
      viewBox="0 0 520 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`truck-svg ${className}`}
      aria-label="Длинномер / Фура (25 тонн, 13.6 м)"
    >
      <rect width="520" height="240" rx="16" fill="#F8FAFC" />
      <line x1="20" y1="205" x2="500" y2="205" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
      <ellipse cx="260" cy="204" rx="220" ry="8" fill="#E2E8F0" />

      {/* Semi-Trailer (Box / White Reefer like in Screenshot 1!) */}
      <rect x="40" y="60" width="310" height="110" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
      {/* Aerodynamic side skirts */}
      <rect x="120" y="165" width="130" height="18" rx="2" fill="#E2E8F0" />
      <line x1="40" y1="170" x2="350" y2="170" stroke="#94A3B8" strokeWidth="2" />
      {/* Brand accent stripe */}
      <rect x="40" y="115" width="310" height="6" fill="#2563EB" opacity="0.8" />

      {/* Fifth Wheel Coupler / Gap */}
      <rect x="340" y="155" width="25" height="15" fill="#334155" />

      {/* Modern European White Tractor Cab (Mercedes Actros / Volvo style) */}
      <path
        d="M360 170 V62 C360 52 368 45 380 45 H425 C435 45 442 50 448 60 L472 110 C476 118 478 128 478 138 V170 H360 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="3"
      />
      {/* Aerodynamic Roof Deflector */}
      <path d="M370 45 C390 35 420 38 435 45 Z" fill="#0F172A" />
      {/* Huge Windshield */}
      <path d="M428 52 H385 V105 H460 L442 65 C438 58 432 52 428 52 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
      {/* Side Door Window */}
      <rect x="375" y="62" width="35" height="42" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
      {/* Side Mirror */}
      <rect x="445" y="70" width="8" height="24" rx="2" fill="#0F172A" />
      {/* Door Seam & Handle */}
      <line x1="415" y1="62" x2="415" y2="170" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="420" y="125" width="12" height="4" rx="2" fill="#475569" />

      {/* Chrome Front Grille & Mercedes-like star badge */}
      <rect x="460" y="120" width="18" height="40" rx="3" fill="#0F172A" />
      <circle cx="469" cy="138" r="5" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <line x1="469" y1="133" x2="469" y2="143" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="465" y1="140" x2="473" y2="136" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Headlights */}
      <rect x="468" y="152" width="10" height="12" rx="2" fill="#FBBF24" />
      <rect x="455" y="166" width="25" height="16" rx="4" fill="#1E293B" />

      {/* Wheels */}
      {/* Trailer Triple Axle (Modern 3-axle trailer) */}
      <circle cx="80" cy="188" r="22" fill="#0F172A" />
      <circle cx="80" cy="188" r="12" fill="#E2E8F0" />
      <circle cx="125" cy="188" r="22" fill="#0F172A" />
      <circle cx="125" cy="188" r="12" fill="#E2E8F0" />
      <circle cx="170" cy="188" r="22" fill="#0F172A" />
      <circle cx="170" cy="188" r="12" fill="#E2E8F0" />

      {/* Tractor Rear Drive Axle */}
      <circle cx="365" cy="188" r="24" fill="#0F172A" />
      <circle cx="365" cy="188" r="13" fill="#E2E8F0" />

      {/* Tractor Front Steer Axle */}
      <circle cx="445" cy="188" r="24" fill="#0F172A" />
      <circle cx="445" cy="188" r="13" fill="#E2E8F0" />

      <text x="35" y="32" fill="#1E293B" fontSize="16" fontWeight="bold">ДЛИННОМЕР / ШАЛАНДА (13.6 М, 25 ТОНН)</text>
      <text x="35" y="50" fill="#64748B" fontSize="12">Для арматуры 11.7 м, крупногабаритного металлопроката, плит и опта</text>
    </svg>
  );
}

