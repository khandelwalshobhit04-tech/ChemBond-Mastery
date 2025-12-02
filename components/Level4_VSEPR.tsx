import React, { useState, useRef, useEffect } from 'react';
import { audioManager } from '../services/audio';

interface Level4Props {
  onComplete: () => void;
}

interface VseprOption {
  shape: string;
  angle: number;
  lonePairs: number;
}

const VSEPR_TASKS = [
  { id: 'CO2', name: 'CO₂', shape: 'Linear', angle: 180, bonds: 2, lone: 0, hint: "Double bonds count as 1 domain." },
  { id: 'H2O', name: 'H₂O', shape: 'Bent', angle: 104.5, bonds: 2, lone: 2, hint: "2 Lone pairs push bonds down." },
  { id: 'BF3', name: 'BF₃', shape: 'Trigonal Planar', angle: 120, bonds: 3, lone: 0, hint: "Flat triangle." },
  { id: 'CH4', name: 'CH₄', shape: 'Tetrahedral', angle: 109.5, bonds: 4, lone: 0, hint: "Classic 4 domain shape." },
  { id: 'NH3', name: 'NH₃', shape: 'Trigonal Pyramidal', angle: 107, bonds: 3, lone: 1, hint: "Lone pair on top pushes down." },
  { id: 'SF6', name: 'SF₆', shape: 'Octahedral', angle: 90, bonds: 6, lone: 0, hint: "6 domains." },
  { id: 'SO2', name: 'SO₂', shape: 'Bent', angle: 119, bonds: 2, lone: 1, hint: "1 Lone pair, less repression than H2O." },
  { id: 'O3', name: 'O₃', shape: 'Bent', angle: 117, bonds: 2, lone: 1, hint: "Resonance structure similar to SO2." },
  { id: 'NO2-', name: 'NO₂⁻', shape: 'Bent', angle: 115, bonds: 2, lone: 1, hint: "Ion with 1 lone pair." },
  { id: 'PCl5', name: 'PCl₅', shape: 'Trigonal Bipyramidal', angle: 90, bonds: 5, lone: 0, hint: "5 bonding pairs, no lone pairs." }, // 90 and 120 actually
  { id: 'XeF4', name: 'XeF₄', shape: 'Square Planar', angle: 90, bonds: 4, lone: 2, hint: "6 domains total, 2 lone pairs opposite each other." },
  { id: 'ClF3', name: 'ClF₃', shape: 'T-shaped', angle: 90, bonds: 3, lone: 2, hint: "5 domains total, T-shape due to 2 equatorial lone pairs." },
];

const SHAPES = [
  'Linear', 'Bent', 'Trigonal Planar', 'Tetrahedral', 'Trigonal Pyramidal', 'Octahedral', 'Trigonal Bipyramidal', 'Square Planar', 'T-shaped'
];

const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const Level4: React.FC<Level4Props> = ({ onComplete }) => {
  const [currentTaskId, setCurrentTaskId] = useState(VSEPR_TASKS[0].id);
  const [rotation, setRotation] = useState({ x: 15, y: 15 });
  const [options, setOptions] = useState<VseprOption[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, isCorrect: boolean} | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const task = VSEPR_TASKS.find(t => t.id === currentTaskId) || VSEPR_TASKS[0];

  useEffect(() => {
    const generateOptions = () => {
      const correct: VseprOption = { shape: task.shape, angle: task.angle, lonePairs: task.lone };
      const newOptions: VseprOption[] = [correct];

      // Generate Distractors
      while(newOptions.length < 3) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        let randomAngle = task.angle;
        let randomLp = task.lone;
        
        if (Math.random() > 0.5) {
             // Wrong shape
             if (randomShape === 'Linear') randomAngle = 180;
             else if (randomShape === 'Trigonal Planar') randomAngle = 120;
             else if (randomShape === 'Tetrahedral') randomAngle = 109.5;
             else if (randomShape === 'Trigonal Bipyramidal') randomAngle = 90;
             else randomAngle = 90;
        } else {
             // Right shape, wrong angle or LP
             randomAngle = task.angle > 110 ? task.angle - 15 : task.angle + 15;
             randomLp = (task.lone + 1) % 3;
        }

        const distractor = { shape: randomShape, angle: parseFloat(randomAngle.toFixed(1)), lonePairs: randomLp };
        
        // Avoid duplicates
        const isDup = newOptions.some(o => o.shape === distractor.shape && o.angle === distractor.angle && o.lonePairs === distractor.lonePairs);
        if (!isDup) newOptions.push(distractor);
      }
      
      setOptions(shuffle(newOptions));
      setSelectedOptionIndex(null);
      setFeedback(null);
    };
    generateOptions();
  }, [currentTaskId, task]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    setRotation(r => ({ x: r.x + deltaY * 0.5, y: r.y + deltaX * 0.5 }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => isDragging.current = false;

  const handleSelect = (idx: number) => {
     if (feedback?.isCorrect) return;
     audioManager.playClick();
     setSelectedOptionIndex(idx);
     
     const choice = options[idx];
     const isCorrect = choice.shape === task.shape && Math.abs(choice.angle - task.angle) < 1 && choice.lonePairs === task.lone;

     if (isCorrect) {
        audioManager.playSuccess();
        setFeedback({ msg: "Correct Geometry!", isCorrect: true });
        if (!solved.includes(task.id)) setSolved(prev => [...prev, task.id]);
     } else {
        audioManager.playError();
        setFeedback({ msg: "Incorrect parameters.", isCorrect: false });
     }
  };

  // 3D Visualization Logic
  const renderModel = () => {
     const r = 90; 
     const bonds = task.bonds;
     const lp = task.lone;
     const totalDomains = bonds + lp;

     let positions: {x: number, y: number, z: number, isLp: boolean}[] = [];

     // Logic based on electron domains
     if (totalDomains === 2) { // Linear
        positions = [
          {x: -r, y:0, z:0, isLp: false}, 
          {x: r, y:0, z:0, isLp: false}
        ];
     } 
     else if (totalDomains === 3) { // Trigonal Planar Base
        positions = [
          {x:0, y:-r, z:0, isLp: false}, 
          {x:-r*0.86, y:r*0.5, z:0, isLp: false}, 
          {x:r*0.86, y:r*0.5, z:0, isLp: false}
        ];
        // Replace with LPs if needed (e.g. Bent/V-shape for 2 bonds 1 lone)
        // Usually LPs take up "top" positions visually in this simplistic model
        if (lp >= 1) positions[0].isLp = true;
     }
     else if (totalDomains === 4) { // Tetrahedral Base
        positions = [
          {x:0, y:-r, z:0, isLp: false}, // Top
          {x:-r*0.8, y:r*0.3, z:r*0.5, isLp: false}, 
          {x:r*0.8, y:r*0.3, z:r*0.5, isLp: false}, 
          {x:0, y:r*0.3, z:-r*0.8, isLp: false}
        ];
        if (lp >= 1) positions[0].isLp = true; // Trigonal Pyramidal
        if (lp >= 2) positions[3].isLp = true; // Bent (simplified logic)
     }
     else if (totalDomains === 5) { // Trigonal Bipyramidal Base
        // Axial: Top/Bottom. Equatorial: Triangle in middle.
        // LPs prefer equatorial.
        positions = [
            {x:0, y:-r, z:0, isLp: false}, // Axial Top
            {x:0, y:r, z:0, isLp: false},  // Axial Bottom
            {x: r, y:0, z:0, isLp: false}, // Eq 1
            {x: -r*0.5, y:0, z: r*0.86, isLp: false}, // Eq 2
            {x: -r*0.5, y:0, z: -r*0.86, isLp: false}, // Eq 3
        ];
        // T-shape (3 bonds, 2 LP): LPs are equatorial.
        if (lp >= 1) positions[2].isLp = true;
        if (lp >= 2) positions[3].isLp = true;
        if (lp >= 3) positions[4].isLp = true; // Linear (XeF2 etc)
     }
     else if (totalDomains === 6) { // Octahedral Base
        positions = [
            {x:0, y:-r, z:0, isLp: false}, // Top
            {x:0, y:r, z:0, isLp: false}, // Bottom
            {x:-r, y:0, z:0, isLp: false}, 
            {x:r, y:0, z:0, isLp: false}, 
            {x:0, y:0, z:-r, isLp: false}, 
            {x:0, y:0, z:r, isLp: false}
        ];
        // Square Planar (4 bonds, 2 LP): LPs are axial (Top/Bottom)
        if (lp >= 1) positions[0].isLp = true; // Square Pyramidal
        if (lp >= 2) positions[1].isLp = true; // Square Planar
     }

     // Render Atoms and Lone Pairs
     const elements = positions.map((pos, i) => {
       if (pos.isLp) {
         // Render Lone Pair
         const angle = 0; // Simplification for visuals
         return (
             <div key={`lp-${i}`} 
                className="absolute w-12 h-16 bg-yellow-400/30 border border-yellow-300/50 rounded-[50%] blur-[1px] transform-style-3d flex items-center justify-center"
                style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)` }}
             ></div>
         );
       } else {
         // Render Atom
         return (
            <div 
              key={`atom-${i}`}
              className="absolute w-10 h-10 bg-indigo-400 rounded-full shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center text-black font-bold text-xs border border-indigo-300"
              style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)` }}
            >
              X
            </div>
         );
       }
     });

     return elements;
  };

  return (
    <div className="flex h-full p-6 gap-6 max-w-7xl mx-auto">
      
      {/* Sidebar */}
      <div className="w-64 bg-chem-panel rounded-xl border border-slate-700 p-4 flex flex-col gap-2 h-[calc(100vh-150px)] overflow-y-auto shrink-0">
        <h3 className="text-xl font-bold text-purple-400 mb-4">Molecules</h3>
        {VSEPR_TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => { audioManager.playClick(); setCurrentTaskId(t.id); }}
            className={`p-3 rounded text-left flex justify-between items-center transition ${
              currentTaskId === t.id 
                ? 'bg-purple-600 text-white font-bold shadow-lg' 
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>{t.name}</span>
            {solved.includes(t.id) && <span className="text-green-300">✓</span>}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col gap-6">
        
        <h2 className="text-2xl font-bold text-white text-center">Determine Geometry for <span className="text-purple-400">{task.name}</span></h2>

        {/* 3D Viewport */}
        <div 
          className="flex-1 bg-slate-900 rounded-xl border border-slate-700 min-h-[300px] relative overflow-hidden cursor-move perspective-1000 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           <div className="absolute top-4 left-4 text-slate-500 text-sm pointer-events-none select-none z-10">Drag to Rotate Model</div>
           
           <div 
             className="relative w-0 h-0 transform-style-3d transition-transform duration-75 ease-out"
             style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
           >
              {/* Center Atom */}
              <div className="absolute w-16 h-16 bg-purple-600 rounded-full -translate-x-8 -translate-y-8 flex items-center justify-center text-white font-bold z-10 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.4)]">
                A
              </div>
              {renderModel()}
           </div>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-105 ${
                  selectedOptionIndex === idx 
                     ? (feedback?.isCorrect ? 'bg-green-900/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-900/30 border-red-500')
                     : 'bg-chem-panel border-slate-700 hover:border-purple-400'
                }`}
              >
                 <div className="text-xl font-bold text-white">{opt.shape}</div>
                 <div className="flex gap-4 text-sm text-slate-400">
                    <span>Angle: <span className="text-chem-accent">{opt.angle}°</span></span>
                    <span>Lone Pairs: <span className="text-yellow-400">{opt.lonePairs}</span></span>
                 </div>
              </button>
           ))}
        </div>

        {feedback && (
            <div className={`p-4 rounded-lg text-center font-bold text-lg animate-fade-in ${feedback.isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
              {feedback.msg} <br/>
              {!feedback.isCorrect && <span className="text-sm font-normal opacity-80">{task.hint}</span>}
            </div>
        )}

      </div>
    </div>
  );
};

export default Level4;