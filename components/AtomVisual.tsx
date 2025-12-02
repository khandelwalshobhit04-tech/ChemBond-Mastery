import React from 'react';

interface AtomVisualProps {
  symbol: string;
  valence: number;
  size?: 'sm' | 'md' | 'lg';
  isUnstable?: boolean;
  isExploding?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  showElectrons?: boolean;
}

const AtomVisual: React.FC<AtomVisualProps> = ({ 
  symbol, 
  valence, 
  size = 'md', 
  isUnstable = false,
  isExploding = false,
  highlight = false,
  onClick,
  showElectrons = true
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm', // 48px
    md: 'w-24 h-24 text-2xl', // 96px
    lg: 'w-36 h-36 text-4xl'  // 144px
  };

  // Configuration for sizes (in pixels)
  // Nucleus: The visual size of the atom core
  // OrbitRadius: The distance of electrons from center
  // SvgSize: The canvas size for the orbit animation (must cover orbit diameter + electron size)
  const config = {
    sm: { nucleusClass: 'w-12 h-12', orbitRadius: 32, svgSize: 80 },
    md: { nucleusClass: 'w-24 h-24', orbitRadius: 60, svgSize: 140 },
    lg: { nucleusClass: 'w-36 h-36', orbitRadius: 85, svgSize: 200 }
  }[size];

  const center = config.svgSize / 2;
  const radius = config.orbitRadius;

  // Calculate electron positions
  const electrons = [];
  if (showElectrons) {
    for (let i = 0; i < valence; i++) {
      const angle = (i * 360) / Math.max(valence, 1) - 90;
      const rad = (angle * Math.PI) / 180;
      const x = center + radius * Math.cos(rad);
      const y = center + radius * Math.sin(rad);
      electrons.push({ x, y, id: i });
    }
  }

  return (
    <div className={`relative flex items-center justify-center ${isExploding ? 'animate-explode pointer-events-none' : ''}`}>
      
      {/* Electron Orbit Layer - Positioned absolutely to center over the nucleus */}
      {showElectrons && (
        <svg 
          className="absolute pointer-events-none overflow-visible z-0"
          width={config.svgSize}
          height={config.svgSize}
          viewBox={`0 0 ${config.svgSize} ${config.svgSize}`}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Static Orbital Path */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="currentColor" 
            strokeOpacity="0.3" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            className="text-chem-accent"
          />
          
          {/* Rotating Electrons Group */}
          <g 
            className={valence > 0 ? "animate-orbit" : ""} 
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            {electrons.map((e) => (
              <g key={e.id}>
                  <circle 
                    cx={e.x} 
                    cy={e.y} 
                    r={size === 'sm' ? 4 : 6} 
                    className={`${isUnstable ? 'fill-red-400' : 'fill-yellow-300'} drop-shadow-[0_0_5px_rgba(253,224,71,0.9)]`}
                  />
                  {/* Electron trail/glow */}
                  <circle 
                    cx={e.x} 
                    cy={e.y} 
                    r={size === 'sm' ? 6 : 9} 
                    className="fill-yellow-300/40 animate-pulse"
                  />
              </g>
            ))}
          </g>
        </svg>
      )}

      {/* Nucleus */}
      <div 
        className={`relative rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 select-none
          ${sizeClasses[size]} 
          ${isUnstable ? 'bg-red-900/50 border-2 border-red-500 animate-shake' : 'bg-chem-panel border-2 border-chem-accent'}
          ${highlight ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}
          ${onClick ? 'cursor-pointer hover:scale-105' : ''}
          z-10
        `}
        onClick={onClick}
      >
        <span className="z-10 text-white drop-shadow-md relative">{symbol}</span>
        
        {/* Nucleus Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-sm"></div>
      </div>
      
      {/* Explosion Particles (only visible when animating) */}
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="w-full h-full bg-orange-500 rounded-full blur-xl opacity-50"></div>
        </div>
      )}
    </div>
  );
};

export default AtomVisual;