import React from 'react';
import { TOOTH_OUTLINES, getToothType, getRootsFor, getToothName } from './tooth-outlines';
import { X } from 'lucide-react';

const TOOLS = {
  SELECT: { id: 'select', label: 'Seleccionar', color: 'transparent' },
  CARIES: { id: 'caries', label: 'Caries (Rojo)', color: '#ef4444' },
  RESIN: { id: 'resin', label: 'Restauración (Azul)', color: '#3b82f6' },
  SEALANT: { id: 'sealant', label: 'Sellante (Verde)', color: '#22c55e' },
  MISSING: { id: 'missing', label: 'Ausente (X)', color: '#1f2937' },
  CROWN_GOOD: { id: 'crown_good', label: 'Corona (buena)', color: '#3b82f6' },
  CROWN_CHANGE: { id: 'crown_change', label: 'Corona (cambio)', color: '#ef4444' },
  EXTRACTION: { id: 'extraction', label: 'Extracción (X roja)', color: '#ef4444' },
};

const RealisticTooth = ({ id, data, activeTool, onUpdate, position }) => {
  const type = getToothType(id);
  const outline = TOOTH_OUTLINES[type];
  const isUpper = position === 'upper';

  const handleFaceClick = (face, e) => {
    e.stopPropagation();
    if (!activeTool || activeTool === 'select') return;
    const currentStatus = data?.[face];
    const newStatus = currentStatus === activeTool ? null : activeTool;
    onUpdate(id, face, newStatus);
  };

  const getFaceColor = (face) => {
    const toolId = data?.[face];
    if (!toolId) return 'white';
    const normalized = toolId.toUpperCase();
    if (normalized === 'CROWN_GOOD' || normalized === 'CROWN_CHANGE' || normalized === 'EXTRACTION') {
      return 'white';
    }
    return TOOLS[normalized]?.color || 'white';
  };

  const isMissing = Object.values(data || {}).some(v => v === 'missing');
  const isExtraction = Object.values(data || {}).some(v => v === 'extraction');
  const crownGood = Object.values(data || {}).some(v => v === 'crown_good');
  const crownChange = Object.values(data || {}).some(v => v === 'crown_change');

  // Root path (simple approximation based on type)
  const getRootPath = () => {
    const count = getRootsFor(type, isUpper);
    if (count === 1) return "M45,20 L50,-58 L55,20 Z";
    if (count === 2) return "M32,20 L40,-48 L48,20 Z M60,20 L68,-48 L76,20 Z";
    return "M26,20 L34,-42 L42,20 Z M46,20 L50,-52 L54,20 Z M64,20 L72,-42 L80,20 Z";
  };

  return (
    <div className="flex flex-col items-center mx-1 group relative tooth-item shrink-0 md:shrink">
      <span className="text-xs text-slate-700 font-mono font-semibold mb-1 select-none">{id}</span>
      
      <div 
        className={`relative w-full h-24 md:w-16 md:h-24 lg:w-12 lg:h-16 xl:w-16 xl:h-24 2xl:w-20 2xl:h-28 transition-transform duration-300 ${isUpper ? '' : 'flex-col-reverse'}`}
      >
        <svg viewBox="0 -60 100 160" className={`w-full h-full drop-shadow-sm transition-all duration-300 ${isMissing ? 'opacity-50 grayscale' : ''}`}>
          
          {/* Root */}
          <path 
            d={getRootPath()} 
            fill="#cbd5e1" 
            stroke="#475569" 
            strokeWidth="1.5"
            transform={isUpper ? "" : "scale(1, -1) translate(0, -100)"} // Flip for lower if needed, but here I handle it via logic
            // Actually, better to just flip the whole SVG or coordinate system for lower teeth if we want roots to point down.
            // But standard dental charts often show roots pointing away from the center line.
            // Let's stick to standard view: Upper teeth roots up, Lower teeth roots down.
            // My path is defined for "Up".
            className="transition-colors group-hover:fill-slate-200"
          />

          {/* Crown Container with ClipPath */}
          <defs>
            <clipPath id={`clip-${id}`}>
               <path d={outline} />
            </clipPath>
          </defs>

          {/* Crown Surfaces - Clipped by Outline */}
          <g clipPath={`url(#clip-${id})`} transform={isUpper ? "" : "scale(1, -1) translate(0, -100)"}>
             {/* Background */}
             <rect x="0" y="0" width="100" height="100" fill="white" />

             {/* 5 Zones (Geometric mapping) */}
             <polygon points="0,0 100,0 70,30 30,30" fill={getFaceColor('top')} stroke="#64748b" strokeWidth="1.5" onClick={(e) => handleFaceClick('top', e)} className="cursor-pointer hover:opacity-90 transition-opacity" />
             <polygon points="0,100 100,100 70,70 30,70" fill={getFaceColor('bottom')} stroke="#64748b" strokeWidth="1.5" onClick={(e) => handleFaceClick('bottom', e)} className="cursor-pointer hover:opacity-90 transition-opacity" />
             <polygon points="0,0 0,100 30,70 30,30" fill={getFaceColor('left')} stroke="#64748b" strokeWidth="1.5" onClick={(e) => handleFaceClick('left', e)} className="cursor-pointer hover:opacity-90 transition-opacity" />
             <polygon points="100,0 100,100 70,70 70,30" fill={getFaceColor('right')} stroke="#64748b" strokeWidth="1.5" onClick={(e) => handleFaceClick('right', e)} className="cursor-pointer hover:opacity-90 transition-opacity" />
             <rect x="30" y="30" width="40" height="40" fill={getFaceColor('center')} stroke="#64748b" strokeWidth="1.5" onClick={(e) => handleFaceClick('center', e)} className="cursor-pointer hover:opacity-90 transition-opacity" />
          </g>

          {/* Outline Stroke (drawn on top for sharpness) */}
          <path 
            d={outline} 
            fill="none" 
            stroke="#64748b" 
            strokeWidth="1.5"
            className="pointer-events-none"
            transform={isUpper ? "" : "scale(1, -1) translate(0, -100)"}
          />

        </svg>

        {(isMissing || isExtraction) && (
           <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
             <X className={`w-10 h-10 ${isExtraction ? 'text-red-500' : 'text-slate-800'} opacity-90`} strokeWidth={2} />
           </div>
        )}

        {(crownGood || crownChange) && (
           <div className="absolute -top-1 -left-1 z-10 w-4 h-4 rounded-full"
                style={{ backgroundColor: crownGood ? '#3b82f6' : '#ef4444', boxShadow: '0 0 0 1px rgba(255,255,255,0.6)' }}
                title={crownGood ? 'Corona en buen estado' : 'Corona para cambio'}
           />
        )}
        
      </div>
      <div className="text-[10px] text-slate-600 mt-1 text-center leading-tight select-none">{getToothName(id)}</div>
    </div>
  );
};

export default RealisticTooth;
