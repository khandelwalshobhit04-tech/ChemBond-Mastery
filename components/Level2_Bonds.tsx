import React, { useState, useEffect, useRef } from 'react';
import AtomVisual from './AtomVisual';
import { audioManager } from '../services/audio';

interface Level2Props {
  onComplete: () => void;
}

interface ExtraAtom {
  symbol: string;
  count: number;
  side: 'left' | 'right';
}

interface Challenge {
  id: string;
  name: string;
  f1: string;
  f2: string;
  v1: number;
  v2: number;
  c1: number;
  c2: number;
  en1: number;
  en2: number;
  type: 'IONIC' | 'COVALENT' | 'COORDINATE' | 'BOTH';
  hint: string;
  extras?: ExtraAtom[];
}

const challenges: Challenge[] = [
  { id: 'AlCl3', name: 'Aluminium Chloride', f1: 'Al', f2: 'Cl', v1: 3, v2: 7, c1: 1, c2: 3, en1: 1.61, en2: 3.16, type: 'COVALENT', hint: "Diff = 1.55. Although Al is a metal, the bond is Polar Covalent due to high charge density (Fajan's Rule)." },
  { id: 'BeCl2', name: 'Beryllium Chloride', f1: 'Be', f2: 'Cl', v1: 2, v2: 7, c1: 1, c2: 2, en1: 1.57, en2: 3.16, type: 'COVALENT', hint: "Beryllium is an alkaline earth metal, but it forms covalent bonds due to its small size." },
  { id: 'Li2O', name: 'Lithium Oxide', f1: 'Li', f2: 'O', v1: 1, v2: 6, c1: 2, c2: 1, en1: 0.98, en2: 3.44, type: 'IONIC', hint: "Diff > 1.7. Classic Metal + Non-metal transfer." },
  { id: 'BF3NH3', name: 'BF3-NH3 Adduct', f1: 'NH3', f2: 'BF3', v1: 5, v2: 3, c1: 1, c2: 1, en1: 3.04, en2: 2.04, type: 'COORDINATE', hint: "Nitrogen (with lone pair) donates to Boron (incomplete octet)." },
  { 
    id: 'NH4Cl', 
    name: 'Ammonium Chloride', 
    f1: 'NH3', 
    f2: 'Cl', 
    v1: 5, 
    v2: 7, 
    c1: 1, 
    c2: 1, 
    en1: 3.04, 
    en2: 3.16, 
    type: 'BOTH', 
    hint: "Formed from NH3 and HCl. Features Ionic, Covalent, and Coordinate bonding.",
    extras: [{ symbol: 'H', count: 1, side: 'right' }]
  },
  { id: 'SiO2', name: 'Silicon Dioxide', f1: 'Si', f2: 'O', v1: 4, v2: 6, c1: 1, c2: 2, en1: 1.90, en2: 3.44, type: 'COVALENT', hint: "Large electronegativity difference (1.54) but forms a covalent network solid." },
  { id: 'PCl5', name: 'Phosphorus Pentachloride', f1: 'P', f2: 'Cl', v1: 5, v2: 7, c1: 1, c2: 5, en1: 2.19, en2: 3.16, type: 'COVALENT', hint: "Non-metal + Non-metal sharing electrons." },
  { id: 'CO', name: 'Carbon Monoxide', f1: 'C', f2: 'O', v1: 4, v2: 6, c1: 1, c2: 1, en1: 2.55, en2: 3.44, type: 'BOTH', hint: "Contains two covalent bonds and one coordinate bond from Oxygen." },
  { 
    id: 'HNO3', 
    name: 'Nitric Acid', 
    f1: 'N', f2: 'O', v1: 5, v2: 6, c1: 1, c2: 3, 
    en1: 3.04, en2: 3.44, 
    type: 'BOTH', 
    hint: "Contains N-O covalent bonds and a coordinate bond for resonance stability.",
    extras: [{ symbol: 'H', count: 1, side: 'right' }]
  },
];

const Level2: React.FC<Level2Props> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCoordinateUI, setShowCoordinateUI] = useState(false);
  const [coordinateStep, setCoordinateStep] = useState<'IDLE' | 'DRAGGING' | 'SUCCESS'>('IDLE');
  
  // Scoring & Timer
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Animation states
  const [isExploding, setIsExploding] = useState(false);
  const [showBondAnimation, setShowBondAnimation] = useState<'TRANSFER' | 'SHARE' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentChallenge = challenges[currentIndex];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset state on new level
    setFeedback(null);
    setShowCoordinateUI(false); // ALWAYS start with standard UI, even for Coordinate bonds
    setCoordinateStep('IDLE');
    setIsExploding(false);
    setShowBondAnimation(null);
    setIsAnswered(false);
    setTimeLeft(30);

    // Start Timer
    startTimer();

    return () => stopTimer();
  }, [currentIndex, currentChallenge]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
           handleTimeout();
           return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTimeout = () => {
    stopTimer();
    setIsAnswered(true);
    setIsExploding(true);
    setFeedback("Time's Up! Molecule Unstable!");
    setStreak(0);
    setScore(s => Math.max(0, s - 20));
    audioManager.playExplosion();
  };

  const handleChoice = (choice: 'IONIC' | 'COVALENT' | 'COORDINATE' | 'BOTH') => {
    if (isExploding || showBondAnimation || isAnswered) return;
    stopTimer();
    setIsAnswered(true);

    if (choice === currentChallenge.type) {
      // Correct!
      setScore(s => s + 100 + (timeLeft * 2)); // Score + Time Bonus
      setStreak(s => s + 1);
      audioManager.playSuccess();

      if (choice === 'COORDINATE' || choice === 'BOTH') {
        setFeedback("Correct! Identifying Coordinate interaction...");
        // Switch to Coordinate UI for visual reinforcement AFTER correct ID
        setTimeout(() => setShowCoordinateUI(true), 500); 
      } else {
        setShowBondAnimation(choice === 'IONIC' ? 'TRANSFER' : 'SHARE');
        setFeedback("Correct! Bonding Successful.");
      }
    } else {
      // Wrong!
      setIsExploding(true);
      setStreak(0);
      setScore(s => Math.max(0, s - 50));
      setFeedback("Unstable! Wrong Bond Type!");
      audioManager.playExplosion();
    }
  };

  const handleSkip = () => {
    if (isAnswered) return;
    stopTimer();
    setStreak(0);
    setScore(s => Math.max(0, s - 20));
    setIsAnswered(true);
    setFeedback("Skipped.");
    audioManager.playError();
  };

  const handleNext = () => {
    audioManager.playClick();
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete();
    }
  };

  const handleRetry = () => {
    audioManager.playClick();
    setFeedback(null);
    setIsExploding(false);
    setIsAnswered(false);
    setShowBondAnimation(null);
    setShowCoordinateUI(false);
    setCoordinateStep('IDLE');
    setTimeLeft(30);
    startTimer();
  };

  const handleCoordinateDrop = () => {
    setCoordinateStep('SUCCESS');
    setScore(s => s + 50); // Bonus for drag action
    setFeedback("Coordinate Bond Formed!");
    audioManager.playSuccess();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 max-w-5xl mx-auto">
      
      {/* Header with Scoreboard & Timer */}
      <div className="w-full flex justify-between items-end mb-4">
        <div>
           <h2 className="text-3xl font-bold text-chem-covalent">Level 1: Bond Types</h2>
           <div className="text-slate-400 text-sm">Question {currentIndex + 1} / {challenges.length}</div>
        </div>
        <div className="flex gap-6">
           <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest">Score</div>
              <div className="text-2xl font-mono text-yellow-400">{score}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest">Streak</div>
              <div className="text-2xl font-mono text-green-400">x{streak}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest">Time</div>
              <div className={`text-3xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
              </div>
           </div>
        </div>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 mb-8 overflow-hidden">
        <div 
          className="bg-chem-accent h-full transition-all duration-1000 ease-linear" 
          style={{ width: `${((timeLeft) / 30) * 100}%` }}
        />
      </div>

      <div className="bg-chem-panel p-8 rounded-2xl shadow-2xl border border-slate-700 w-full flex flex-col items-center relative overflow-hidden min-h-[450px]">
        
        {/* Header Info */}
        <div className="text-center mb-8 relative z-20">
          <h3 className="text-2xl font-bold text-white mb-1">{currentChallenge.name} ({currentChallenge.id})</h3>
          <p className="text-sm text-slate-400">
             {/* Always show EN Diff to avoid giving away the answer */}
             EN Diff: {Math.abs(currentChallenge.en1 - currentChallenge.en2).toFixed(2)}
          </p>
        </div>

        {/* Visualization Area */}
        <div className="flex items-center justify-center gap-16 mb-10 w-full h-48 relative z-10">
            
           {/* Left Species (Donor usually) */}
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${showBondAnimation === 'SHARE' ? 'translate-x-12' : ''}`}>
             <div className="flex items-center gap-2">
                {/* Extras Left */}
                {currentChallenge.extras?.filter(e => e.side === 'left').map((extra, idx) => (
                    <div key={`extra-l-${idx}`} className="flex flex-col gap-1 justify-center">
                       {[...Array(extra.count)].map((_, i) => (
                          <AtomVisual key={`xl-${i}`} symbol={extra.symbol} valence={1} size="sm" isExploding={isExploding} />
                       ))}
                    </div>
                ))}
                
                <div className={`grid gap-2 ${currentChallenge.c1 > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {[...Array(currentChallenge.c1 || 1)].map((_, i) => (
                    <AtomVisual 
                       key={`l-${i}`}
                       symbol={currentChallenge.f1} 
                       valence={currentChallenge.v1} 
                       size={(currentChallenge.c1 > 2 || currentChallenge.c2 > 2) ? 'sm' : 'md'}
                       highlight={showCoordinateUI} 
                       isExploding={isExploding}
                    />
                  ))}
                </div>
             </div>
             {/* Show EN initially, switch to Role label if Coordinate UI active */}
             {!showCoordinateUI && <span className="text-xs text-slate-500 font-mono">EN: {currentChallenge.en1}</span>}
             {showCoordinateUI && <span className="text-xs text-chem-accent">Donor</span>}
           </div>

           {/* Interaction Zone */}
           <div className="flex flex-col items-center justify-center w-32 h-full relative">
              
              {/* Animation for Ionic Transfer */}
              {showBondAnimation === 'TRANSFER' && (
                <div className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 overflow-hidden">
                   <div className="w-4 h-4 bg-yellow-300 rounded-full animate-[ping_1s_infinite] absolute left-0"></div>
                   <div className="w-full h-0.5 bg-yellow-300/50 absolute top-1/2"></div>
                   <div className="w-3 h-3 bg-yellow-400 rounded-full absolute top-1/2 -translate-y-1/2 animate-[bounce_1s_infinite] left-[100%] transition-all duration-1000" style={{left: '100%'}}>→</div>
                </div>
              )}

              {/* Animation for Covalent Sharing */}
              {showBondAnimation === 'SHARE' && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-12 rounded-full border-4 border-chem-covalent animate-pulse opacity-50"></div>
                   <div className="absolute flex gap-2">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-spin"></div>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></div>
                   </div>
                </div>
              )}

              {/* Coordinate UI (Only shows AFTER successful answer) */}
              {showCoordinateUI ? (
                <div className="relative w-full h-32 flex items-center justify-center">
                   
                   {/* Curved Arrow Visual for Coordinate Bond */}
                   {coordinateStep === 'SUCCESS' && (
                     <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-30">
                        <defs>
                          <marker id="coordArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" fill="#22d3ee">
                            <path d="M0,0 L6,3 L0,6 Z" />
                          </marker>
                        </defs>
                        {/* Curve starting near left atom, going up, landing near right atom */}
                        <path 
                          d="M -20,60 Q 64,-30 148,60" 
                          fill="none" 
                          stroke="#22d3ee" 
                          strokeWidth="3" 
                          strokeDasharray="8 4"
                          markerEnd="url(#coordArrow)"
                          className="animate-[pulse_2s_infinite]"
                        />
                     </svg>
                   )}

                   {/* Drag Container */}
                   <div className={`relative w-full h-24 flex items-center justify-center bg-slate-800/50 rounded-lg border border-dashed border-slate-600 ${coordinateStep === 'SUCCESS' ? 'border-transparent bg-transparent' : ''}`}>
                     
                     {/* Draggable Lone Pair */}
                     {coordinateStep !== 'SUCCESS' && !isExploding && (
                       <div 
                         className={`w-12 h-8 bg-yellow-400 rounded-full flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing animate-bounce z-40 hover:scale-110 transition shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-2 ring-white`}
                         draggable={true}
                         onDragStart={() => audioManager.playClick()}
                         onDragEnd={(e) => {
                           if(e.clientX > 0) handleCoordinateDrop(); 
                         }}
                       >
                         <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                         <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                       </div>
                     )}

                     {/* Success Label */}
                     {coordinateStep === 'SUCCESS' && (
                       <div className="absolute top-4 text-cyan-400 font-bold text-sm tracking-wider bg-slate-900/80 px-2 py-1 rounded shadow-lg border border-cyan-500/30">
                          COORDINATE BOND
                       </div>
                     )}

                     {/* Instructions */}
                     {coordinateStep !== 'SUCCESS' && (
                        <p className="absolute -bottom-8 text-xs text-chem-accent whitespace-nowrap font-mono animate-pulse">
                         DRAG LONE PAIR TO DONATE
                        </p>
                     )}
                   </div>
                </div>
              ) : (
                !showBondAnimation && <div className={`text-4xl text-slate-600 font-bold ${isExploding ? 'animate-ping text-red-500' : 'animate-pulse'}`}>?</div>
              )}
           </div>

           {/* Right Species (Acceptor) */}
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${showBondAnimation === 'SHARE' ? '-translate-x-12' : ''}`}>
             <div className="flex items-center gap-2">
               <div className={`grid gap-2 ${currentChallenge.c2 > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                 {[...Array(currentChallenge.c2 || 1)].map((_, i) => (
                   <AtomVisual 
                      key={`r-${i}`}
                      symbol={currentChallenge.f2} 
                      valence={currentChallenge.v2}
                      size={(currentChallenge.c1 > 2 || currentChallenge.c2 > 2) ? 'sm' : 'md'}
                      isExploding={isExploding}
                   />
                 ))}
               </div>
               
               {/* Extras Right */}
               {currentChallenge.extras?.filter(e => e.side === 'right').map((extra, idx) => (
                   <div key={`extra-r-${idx}`} className="flex flex-col gap-1 justify-center">
                      {[...Array(extra.count)].map((_, i) => (
                         <AtomVisual key={`xr-${i}`} symbol={extra.symbol} valence={1} size="sm" isExploding={isExploding} />
                      ))}
                   </div>
               ))}
             </div>

             {/* Show EN initially, switch to Role label if Coordinate UI active */}
             {!showCoordinateUI && <span className="text-xs text-slate-500 font-mono">EN: {currentChallenge.en2}</span>}
             {showCoordinateUI && <span className="text-xs text-chem-accent">Acceptor</span>}
           </div>

        </div>

        {/* Controls */}
        {!showCoordinateUI ? (
          <div className="flex flex-col gap-4 w-full max-w-4xl z-10">
            <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => handleChoice('IONIC')}
                  disabled={isAnswered}
                  className="py-4 bg-chem-ionic/10 border-2 border-chem-ionic text-chem-ionic rounded-xl font-bold hover:bg-chem-ionic hover:text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  TRANSFER (Ionic)
                </button>
                <button 
                  onClick={() => handleChoice('COVALENT')}
                  disabled={isAnswered}
                  className="py-4 bg-chem-covalent/10 border-2 border-chem-covalent text-chem-covalent rounded-xl font-bold hover:bg-chem-covalent hover:text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SHARE (Covalent)
                </button>
                <button 
                  onClick={() => handleChoice('COORDINATE')}
                  disabled={isAnswered}
                  className="py-4 bg-chem-accent/10 border-2 border-chem-accent text-chem-accent rounded-xl font-bold hover:bg-chem-accent hover:text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  COORD (Only)
                </button>
                <button 
                  onClick={() => handleChoice('BOTH')}
                  disabled={isAnswered}
                  className="py-4 bg-purple-500/10 border-2 border-purple-500 text-purple-400 rounded-xl font-bold hover:bg-purple-600 hover:text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  BOTH (Cov + Coord)
                </button>
            </div>
            {!isAnswered && (
                <button 
                    onClick={handleSkip}
                    className="self-center px-4 py-2 text-slate-500 hover:text-white transition text-sm"
                >
                    Skip Question (-20 pts)
                </button>
            )}
          </div>
        ) : (
          <div className="text-center z-10 flex flex-col gap-4 items-center animate-fade-in min-h-[100px] justify-center">
             {coordinateStep !== 'SUCCESS' && (
                <div className="text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
                   Identify the <b>Donor</b> (Rich) and <b>Acceptor</b> (Poor)
                </div>
             )}
             <div className="flex gap-4 justify-center opacity-50 pointer-events-none">
                <button className="px-4 py-2 border border-slate-600 rounded text-slate-500">Ionic</button>
                <button className="px-4 py-2 border border-slate-600 rounded text-slate-500">Covalent</button>
                <button className="px-6 py-2 border-2 border-chem-accent rounded bg-chem-accent text-white font-bold">BOTH (Cov + Coord)</button>
             </div>
          </div>
        )}

        {/* Feedback Overlay */}
        {feedback && (
           <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-md z-50 flex-col p-8 text-center animate-fade-in ${feedback.includes('Correct') ? 'bg-slate-900/90' : 'bg-red-900/90'}`}>
             <h2 className={`text-4xl font-bold mb-4 drop-shadow-lg ${feedback.includes('Correct') ? 'text-green-400' : 'text-red-400'}`}>
               {feedback}
             </h2>
             {(feedback.includes('Unstable') || feedback.includes('Time')) && <div className="text-6xl mb-4">💥</div>}
             <p className="text-white font-medium max-w-md text-lg bg-slate-800/80 p-4 rounded-lg border border-slate-600 shadow-xl mb-8">
                {currentChallenge.hint}
             </p>

             <div className="flex gap-4">
                {/* Retry Button */}
                {!feedback.includes('Correct') && (
                    <button 
                        onClick={handleRetry}
                        className="px-8 py-3 bg-yellow-500 text-slate-900 font-bold rounded-full shadow-xl hover:scale-110 transition hover:bg-yellow-400 flex items-center gap-2"
                    >
                        <span>↺</span> Retry
                    </button>
                )}

                {/* Next Button */}
                <button 
                    onClick={handleNext}
                    className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full shadow-xl hover:scale-110 transition hover:bg-cyan-50"
                >
                    {currentIndex < challenges.length - 1 ? "Next Question →" : "Complete Level"}
                </button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Level2;