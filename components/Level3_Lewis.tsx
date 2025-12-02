import React, { useState, useEffect } from 'react';
import { audioManager } from '../services/audio';

interface Level3Props {
  onComplete: () => void;
}

interface LewisConfig {
  lp: number; // 0=0, 1=1pr, 2=2pr, 3=3pr, 4=1Radical, 5=1Pr+1Radical
  bonds: number[]; // 0=none, 1=single, 2=double, 3=triple
}

interface LewisPuzzle {
  id: string;
  formula: string;
  center: string;
  atoms: (string | null)[]; // Top, Right, Bottom, Left
  correct: LewisConfig;
  hint?: string;
  charge?: string;
}

// Updated Molecule List: Harder / Ions / Radicals
const puzzles: LewisPuzzle[] = [
  { 
    id: 'H2SO4',
    formula: "H₂SO₄", 
    center: "S", 
    atoms: ["OH", "O", "OH", "O"], 
    correct: { lp: 0, bonds: [1, 2, 1, 2] }, 
    hint: "Sulfuric Acid: Sulfur expands octet. OH groups form single bonds, Oxygens form double bonds."
  },
  { 
    id: 'XeF4', 
    formula: "XeF₄", 
    center: "Xe", 
    atoms: ["F", "F", "F", "F"], 
    correct: { lp: 2, bonds: [1, 1, 1, 1] },
    hint: "Xenon Tetrafluoride: Xenon has 8 valence e⁻. 4 bond with Fluorine, leaving 2 lone pairs."
  },
  { 
    id: 'PO4', 
    formula: "PO₄³⁻", 
    center: "P", 
    atoms: ["O", "O", "O", "O"], 
    charge: "3-",
    correct: { lp: 0, bonds: [2, 1, 1, 1] },
    hint: "Phosphate: Phosphorus expands octet to minimize formal charge (1 double bond, 3 singles)."
  },
  { 
    id: 'NO2', 
    formula: "NO₂", 
    center: "N", 
    atoms: ["O", "O", null, null], 
    correct: { lp: 4, bonds: [2, 1, 0, 0] }, // 4 = Single Radical
    hint: "Nitrogen Dioxide: Radical (odd electron). Tap Center until you see a single dot (Radical). Forms 1 double and 1 single bond."
  },
  { 
    id: 'NO', 
    formula: "NO", 
    center: "N", 
    atoms: [null, "O", null, null], 
    correct: { lp: 5, bonds: [0, 2, 0, 0] }, // 5 = 1 Pair + 1 Radical
    hint: "Nitric Oxide: Radical. N forms a double bond. Tap Center until you see 3 dots (1 Pair + 1 Single)."
  },
  { 
    id: 'ClO4', 
    formula: "ClO₄⁻", 
    center: "Cl", 
    atoms: ["O", "O", "O", "O"], 
    charge: "1-",
    correct: { lp: 0, bonds: [2, 2, 2, 1] },
    hint: "Perchlorate: Chlorine minimizes formal charge by forming 3 double bonds and 1 single bond."
  },
  { 
    id: 'CO3', 
    formula: "CO₃²⁻", 
    center: "C", 
    atoms: ["O", null, "O", "O"], 
    charge: "2-",
    correct: { lp: 0, bonds: [1, 0, 2, 1] },
    hint: "Carbonate: Carbon forms 1 double bond and 2 single bonds."
  }
];

const Level3: React.FC<Level3Props> = ({ onComplete }) => {
  const [currentId, setCurrentId] = useState(puzzles[0].id);
  const [userConfig, setUserConfig] = useState<LewisConfig>({ lp: 0, bonds: [0, 0, 0, 0] });
  const [feedback, setFeedback] = useState<{msg: string, isCorrect: boolean} | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentPuzzle = puzzles.find(p => p.id === currentId) || puzzles[0];

  useEffect(() => {
    const puzzle = puzzles.find(p => p.id === currentId);
    if (puzzle) {
        // Reset config: Single bonds where atoms exist, 0 lone pairs
        const initialBonds = puzzle.atoms.map(a => a ? 1 : 0);
        setUserConfig({ lp: 0, bonds: initialBonds });
    }
    setFeedback(null);
  }, [currentId]);

  const handleBondClick = (index: number) => {
    if (feedback?.isCorrect) return;
    if (!currentPuzzle.atoms[index]) return;
    
    audioManager.playClick();
    setUserConfig(prev => {
        const newBonds = [...prev.bonds];
        // Cycle: 1 -> 2 -> 3 -> 1
        newBonds[index] = newBonds[index] >= 3 ? 1 : newBonds[index] + 1;
        return { ...prev, bonds: newBonds };
    });
    setFeedback(null);
  };

  const handleCenterClick = () => {
    if (feedback?.isCorrect) return;
    audioManager.playClick();
    setUserConfig(prev => ({
        ...prev,
        // Cycle: 0 -> 1pr -> 2pr -> 3pr -> Radical(4) -> Rad+Pr(5) -> 0
        lp: (prev.lp + 1) % 6
    }));
    setFeedback(null);
  };

  const checkAnswer = () => {
    const correct = currentPuzzle.correct;
    const lpCorrect = userConfig.lp === correct.lp;

    // Robust Validation for Resonance
    const getBondProfile = (atoms: (string|null)[], bonds: number[]) => {
        const profile: {atom: string, bond: number}[] = [];
        atoms.forEach((atom, idx) => {
            if (atom) {
                profile.push({ atom, bond: bonds[idx] });
            }
        });
        return profile.sort((a, b) => {
            if (a.atom < b.atom) return -1;
            if (a.atom > b.atom) return 1;
            return a.bond - b.bond;
        });
    };

    const userProfile = getBondProfile(currentPuzzle.atoms, userConfig.bonds);
    const correctProfile = getBondProfile(currentPuzzle.atoms, correct.bonds);
    
    const bondsCorrect = JSON.stringify(userProfile) === JSON.stringify(correctProfile);

    if (lpCorrect && bondsCorrect) {
        audioManager.playSuccess();
        setFeedback({ msg: "Correct Structure!", isCorrect: true });
        if (!solved.includes(currentId)) {
            setSolved(prev => [...prev, currentId]);
            setScore(s => s + 100 + (streak * 20));
            setStreak(s => s + 1);
        }
    } else {
        audioManager.playError();
        setFeedback({ msg: "Incorrect. " + (currentPuzzle.hint || "Check octets and formal charges."), isCorrect: false });
        if (!solved.includes(currentId)) {
            setScore(s => Math.max(0, s - 10));
            setStreak(0);
        }
    }
  };

  const renderElectronLobes = () => {
    const lpState = userConfig.lp;
    // Definitions of what to render for each state
    // 0: []
    // 1: [pair]
    // 2: [pair, pair]
    // 3: [pair, pair, pair]
    // 4: [radical]
    // 5: [pair, radical]

    let shapes: { type: 'pair' | 'radical', angle: number }[] = [];
    
    switch (lpState) {
        case 1: shapes = [{ type: 'pair', angle: -45 }]; break;
        case 2: shapes = [{ type: 'pair', angle: -45 }, { type: 'pair', angle: 135 }]; break;
        case 3: shapes = [{ type: 'pair', angle: -45 }, { type: 'pair', angle: 135 }, { type: 'pair', angle: 45 }]; break;
        case 4: shapes = [{ type: 'radical', angle: 135 }]; break; // Single Radical - changed to 135 to avoid Top atom overlap
        case 5: shapes = [{ type: 'pair', angle: -45 }, { type: 'radical', angle: 135 }]; break; // Pair + Radical
        default: shapes = [];
    }

    return shapes.map((shape, i) => (
        <div 
            key={i} 
            className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center pointer-events-none z-10"
            style={{ transform: `rotate(${shape.angle}deg)` }}
        >
            <div 
            className={`absolute border-2 ${shape.type === 'radical' ? 'border-orange-400 bg-orange-500/20' : 'border-blue-400 bg-blue-500/20'} rounded-full flex items-center justify-evenly animate-pulse-slow shadow-[0_0_10px_currentColor]`}
            style={{
                width: '45px',
                height: '24px',
                transform: 'translateX(65px)', 
            }}
            >
                {shape.type === 'pair' ? (
                    <>
                        <div className="w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_4px_currentColor]"></div>
                        <div className="w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_4px_currentColor]"></div>
                    </>
                ) : (
                    <div className="w-3 h-3 bg-orange-300 rounded-full shadow-[0_0_4px_currentColor]"></div>
                )}
            </div>
        </div>
    ));
  };

  return (
    <div className="flex h-full p-6 gap-6 max-w-7xl mx-auto flex-col md:flex-row">
      
      {/* Sidebar Options & Scoreboard */}
      <div className="w-full md:w-72 bg-chem-panel rounded-xl border border-slate-700 p-4 flex flex-col gap-2 shrink-0 h-auto md:h-[calc(100vh-150px)] overflow-y-auto">
        
        {/* Scoreboard */}
        <div className="bg-slate-900/60 p-4 rounded-xl mb-4 border border-slate-600 shadow-inner">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</span>
                <span className="text-2xl font-mono text-yellow-400 drop-shadow-md">{score}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streak</span>
                <span className="text-xl font-mono text-green-400 drop-shadow-md">x{streak}</span>
            </div>
        </div>

        <h3 className="text-lg font-bold text-chem-success mb-2 px-2">Molecules</h3>
        <div className="space-y-1">
          {puzzles.map((p) => (
            <button
              key={p.id}
              onClick={() => { audioManager.playClick(); setCurrentId(p.id); }}
              className={`w-full p-3 rounded-lg text-left flex justify-between items-center transition-all ${
                currentId === p.id 
                  ? 'bg-chem-success text-white font-bold shadow-lg scale-105' 
                  : 'hover:bg-slate-700 text-slate-300 hover:pl-4'
              }`}
            >
              <span>{p.formula}</span>
              {solved.includes(p.id) && <span className="text-green-300 font-bold">✓</span>}
            </button>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-600 text-center">
          <p className="text-xs text-slate-400">Progress: {solved.length} / {puzzles.length}</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-chem-panel rounded-xl border border-slate-600 p-8 flex flex-col items-center relative overflow-y-auto min-h-[500px]">
        
        <div className="mb-8 text-center">
           <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
               Build: <span className="text-chem-accent">{currentPuzzle.formula}</span>
               {currentPuzzle.charge && <span className="text-sm bg-red-500/20 text-red-300 border border-red-500/50 px-2 py-0.5 rounded shadow-sm">Ion {currentPuzzle.charge}</span>}
           </h2>
           <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
             Tap <span className="text-yellow-400 font-bold">Bonds</span> to cycle order. <br/>
             Tap <span className="text-blue-400 font-bold">Center</span> to cycle: <br/> 
             1 Pair → 2 Pairs → 3 Pairs → <span className="text-orange-400 font-bold">Radical (1e⁻)</span> → Radical + Pair
           </p>
        </div>

        {/* Workbench */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border-2 border-slate-700 relative select-none p-8">
             
             {/* Interactive Diagram */}
             <div className="relative w-full max-w-[320px] aspect-square">
                 
                 {/* Center Atom */}
                 <div 
                   onClick={handleCenterClick}
                   className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] z-20 transition hover:scale-110 cursor-pointer border-4 ${feedback?.isCorrect ? 'border-green-400' : 'border-blue-400'}`}
                 >
                    {currentPuzzle.center}
                    
                    {/* Render Lone Pairs and Radicals */}
                    {renderElectronLobes()}

                 </div>

                 {/* Surrounding Atoms & Bonds */}
                 {currentPuzzle.atoms.map((atom, pos) => {
                    if (!atom) return null;
                    
                    const atomStyles: React.CSSProperties = [
                       { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' }, // Top
                       { top: '50%', right: '10%', transform: 'translate(50%, -50%)' }, // Right
                       { bottom: '10%', left: '50%', transform: 'translate(-50%, 50%)' }, // Bottom
                       { top: '50%', left: '10%', transform: 'translate(-50%, -50%)' }, // Left
                    ][pos];
                    
                    const bondZoneStyles: React.CSSProperties = [
                      { top: '30%', left: '50%', height: '30%', width: '40px', transform: 'translate(-50%, -50%)' },
                      { top: '50%', right: '30%', height: '40px', width: '30%', transform: 'translate(50%, -50%)' },
                      { bottom: '30%', left: '50%', height: '30%', width: '40px', transform: 'translate(-50%, 50%)' },
                      { top: '50%', left: '30%', height: '40px', width: '30%', transform: 'translate(-50%, -50%)' },
                    ][pos];

                    const bondOrder = userConfig.bonds[pos];
                    const isVertical = pos % 2 === 0;

                    // Determine bond style based on order
                    let bondColorClass = "bg-slate-300";
                    let bondGlowClass = "";
                    if (bondOrder === 2) {
                        bondColorClass = "bg-cyan-400";
                        bondGlowClass = "shadow-[0_0_8px_rgba(34,211,238,0.6)]";
                    } else if (bondOrder === 3) {
                        bondColorClass = "bg-fuchsia-400";
                        bondGlowClass = "shadow-[0_0_8px_rgba(232,121,249,0.6)]";
                    }

                    // Number of electrons on outer atom based on bond (Octet Rule logic)
                    const outerElectronsCount = bondOrder === 1 ? 6 : bondOrder === 2 ? 4 : 2;
                    const electronsArray = [...Array(outerElectronsCount)];

                    return (
                      <React.Fragment key={pos}>
                         {/* Interactive Bond Zone */}
                         <div 
                           onClick={() => handleBondClick(pos)}
                           className={`absolute flex justify-center items-center gap-[4px] cursor-pointer hover:bg-white/5 rounded transition-colors group z-10 p-1 ${isVertical ? 'flex-row' : 'flex-col'}`} 
                           style={bondZoneStyles}
                         >
                             {[...Array(bondOrder)].map((_, b) => (
                                <div 
                                  key={b} 
                                  className={`${bondColorClass} ${bondGlowClass} rounded-full transition-all duration-300 ${isVertical ? 'h-full w-[3px]' : 'w-full h-[3px]'} ${bondOrder > 1 ? 'animate-pulse' : ''}`}
                                ></div>
                             ))}
                         </div>

                         {/* Outer Atom with Orbiting Electrons */}
                         <div className="absolute w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-slate-500 z-20" style={atomStyles}>
                           <span className="relative z-10">{atom}</span>
                           
                           {/* Electron Orbital System via SVG - Aligned to Atom Center */}
                           <svg 
                              className="absolute pointer-events-none overflow-visible z-0"
                              width="100" 
                              height="100" 
                              viewBox="0 0 100 100"
                              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                           >
                                {/* Static Orbit Ring */}
                                <circle 
                                  cx="50" cy="50" r="38" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="1.5" 
                                  strokeDasharray="3 3" 
                                  className="text-slate-400 opacity-80" 
                                />
                                
                                {/* Rotating Electrons Group */}
                                <g className="animate-orbit" style={{ transformOrigin: '50px 50px' }}>
                                   {electronsArray.map((_, i) => {
                                      const angleDeg = (i * 360) / outerElectronsCount;
                                      const angleRad = (angleDeg * Math.PI) / 180;
                                      
                                      // Radius = 38 (matches ring)
                                      const cx = 50 + 38 * Math.cos(angleRad);
                                      const cy = 50 + 38 * Math.sin(angleRad);
                                      
                                      return (
                                        <g key={i}>
                                            {/* Electron Core */}
                                            <circle 
                                              cx={cx} 
                                              cy={cy} 
                                              r="5" 
                                              className="fill-yellow-300 drop-shadow-[0_0_4px_rgba(253,224,71,1)]" 
                                            />
                                            {/* Electron Glow/Trail */}
                                            <circle 
                                              cx={cx} 
                                              cy={cy} 
                                              r="8" 
                                              className="fill-yellow-300/40 animate-pulse" 
                                            />
                                        </g>
                                      );
                                   })}
                                </g>
                           </svg>

                         </div>
                      </React.Fragment>
                    );
                 })}
             </div>
             
             {/* Ionic Brackets */}
             {currentPuzzle.charge && (
                <div className="absolute inset-2 border-x-4 border-slate-500/50 rounded-3xl pointer-events-none">
                    <span className="absolute -top-4 -right-4 text-xl font-bold text-white bg-slate-700 px-3 py-1 rounded-lg border border-slate-500 shadow-lg font-mono tracking-tighter">
                      {currentPuzzle.charge}
                    </span>
                </div>
             )}
        </div>

        {/* Feedback & Controls */}
        <div className="mt-8 flex flex-col items-center gap-4 w-full">
            {feedback && (
               <div className={`px-8 py-4 rounded-2xl text-center font-bold text-lg animate-fade-in shadow-xl ${feedback.isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500' : 'bg-red-500/20 text-red-300 border border-red-500'}`}>
                 {feedback.msg}
               </div>
            )}

            {!feedback?.isCorrect && (
              <button 
                onClick={checkAnswer}
                className="px-12 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-cyan-500/25 transition transform hover:-translate-y-1 active:scale-95"
              >
                Check Structure
              </button>
            )}

            {solved.length === puzzles.length && feedback?.isCorrect && (
                <button onClick={() => { audioManager.playClick(); onComplete(); }} className="px-8 py-3 bg-chem-success text-white font-bold rounded-lg shadow-lg hover:bg-green-600 transition animate-bounce">
                    Level Complete! Return to Dashboard
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default Level3;