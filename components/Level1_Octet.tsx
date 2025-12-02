import React, { useState, useEffect } from 'react';
import AtomVisual from './AtomVisual';
import { getChemistryHelp } from '../services/gemini';

interface Level1Props {
  onComplete: () => void;
}

interface AtomData {
  symbol: string;
  name: string;
  atomicNumber: number;
  correctConfig: string; // e.g. "2, 8"
  wrongConfigs: string[];
}

const ATOM_DATA: AtomData[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, correctConfig: '1', wrongConfigs: ['2', '1, 1', '8'] },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, correctConfig: '2', wrongConfigs: ['1, 1', '8', '2, 1'] },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, correctConfig: '2, 1', wrongConfigs: ['3', '1, 2', '2, 8'] },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, correctConfig: '2, 4', wrongConfigs: ['6', '4, 2', '2, 8'] },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, correctConfig: '2, 5', wrongConfigs: ['7', '2, 8, 5', '2, 3'] },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, correctConfig: '2, 6', wrongConfigs: ['8', '2, 4', '2, 8'] },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9, correctConfig: '2, 7', wrongConfigs: ['9', '2, 8', '7, 2'] },
  { symbol: 'Ne', name: 'Neon', atomicNumber: 10, correctConfig: '2, 8', wrongConfigs: ['10', '2, 8, 1', '2, 6'] },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, correctConfig: '2, 8, 1', wrongConfigs: ['2, 9', '11', '2, 8, 2'] },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, correctConfig: '2, 8, 2', wrongConfigs: ['2, 10', '12', '2, 8, 1'] },
  { symbol: 'Al', name: 'Aluminium', atomicNumber: 13, correctConfig: '2, 8, 3', wrongConfigs: ['2, 8, 1', '13', '2, 11'] },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, correctConfig: '2, 8, 7', wrongConfigs: ['2, 8, 8', '17', '2, 9, 6'] },
  { symbol: 'Ar', name: 'Argon', atomicNumber: 18, correctConfig: '2, 8, 8', wrongConfigs: ['2, 10, 6', '2, 8, 6', '18'] },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, correctConfig: '2, 8, 8, 1', wrongConfigs: ['2, 8, 9', '2, 17', '19'] },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, correctConfig: '2, 8, 8, 2', wrongConfigs: ['2, 8, 10', '20', '2, 18'] },
];

// Shuffle helper
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const Level1: React.FC<Level1Props> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string, correct: boolean } | null>(null);
  const [aiHint, setAiHint] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentAtom = ATOM_DATA[currentIndex];

  useEffect(() => {
    // Generate options: Correct + 3 wrong (or fewer if not enough provided)
    const wrong = shuffle(currentAtom.wrongConfigs).slice(0, 3);
    const all = shuffle([currentAtom.correctConfig, ...wrong]);
    setOptions(all);
    setFeedback(null);
    setSelectedOption(null);
    setAiHint("");
  }, [currentIndex, currentAtom]);

  const handleOptionClick = (opt: string) => {
    if (feedback) return; // Block clicks if already answered

    setSelectedOption(opt);
    if (opt === currentAtom.correctConfig) {
      setFeedback({ msg: "Correct Configuration!", correct: true });
    } else {
      setFeedback({ msg: "Incorrect. Remember shell capacities (2, 8, 8...)", correct: false });
    }
  };

  const handleNext = () => {
    if (currentIndex < ATOM_DATA.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleUndo = () => {
    setSelectedOption(null);
    setFeedback(null);
  };

  const askAi = async () => {
    setLoadingAi(true);
    const context = `Atom: ${currentAtom.name} (Atomic Number ${currentAtom.atomicNumber}). Task: Identify electronic configuration.`;
    const response = await getChemistryHelp(context, "How do I figure out the electronic configuration?");
    setAiHint(response);
    setLoadingAi(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-chem-accent">Level 1: Electronic Configuration</h2>
        <p className="text-slate-400">Select the correct electron distribution for the atom.</p>
        <div className="w-full bg-slate-800 h-2 rounded-full mt-4 max-w-md mx-auto">
           <div className="bg-chem-accent h-full rounded-full transition-all duration-500" style={{ width: `${((currentIndex) / ATOM_DATA.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-12">
        {/* Atom Visualization */}
        <div className="relative flex flex-col items-center gap-4">
           <div className="w-32 h-32 bg-chem-panel rounded-full border-4 border-chem-accent flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] relative">
              <span className="text-4xl font-bold text-white">{currentAtom.symbol}</span>
              <span className="absolute top-2 right-4 text-sm text-slate-400">Z={currentAtom.atomicNumber}</span>
              {/* Simple orbit visual decoration */}
              <div className="absolute inset-0 rounded-full border border-slate-500/30 animate-pulse-slow scale-110"></div>
              <div className="absolute inset-0 rounded-full border border-slate-500/20 scale-125"></div>
           </div>
           <h3 className="text-2xl text-white">{currentAtom.name}</h3>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
           {options.map((opt, idx) => (
             <button
               key={idx}
               onClick={() => handleOptionClick(opt)}
               className={`p-4 rounded-xl border-2 text-xl font-mono font-bold transition-all
                 ${selectedOption === opt 
                    ? (opt === currentAtom.correctConfig ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400')
                    : 'bg-slate-800 border-slate-600 hover:border-chem-accent hover:bg-slate-700 text-white'}
                 ${feedback && selectedOption !== opt ? 'opacity-50 cursor-not-allowed' : ''}
               `}
             >
               {opt}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-chem-panel p-6 rounded-lg max-w-xl w-full text-center border border-slate-700 min-h-[120px] flex flex-col justify-center items-center">
        {feedback ? (
          <>
            <p className={`text-xl font-bold mb-4 ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
              {feedback.msg}
            </p>
            
            <div className="flex gap-4 justify-center">
                {/* Show Undo if incorrect */}
                {!feedback.correct && (
                    <button onClick={handleUndo} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full transition shadow-lg flex items-center gap-2">
                        <span className="text-lg">↺</span> Try Again
                    </button>
                )}
                
                {/* Show Next if correct */}
                {feedback.correct && (
                  <button onClick={handleNext} className="px-6 py-2 bg-chem-accent text-white rounded-full hover:scale-105 transition shadow-lg">
                     {currentIndex === ATOM_DATA.length - 1 ? "Finish Level" : "Next Atom"}
                  </button>
                )}
            </div>
          </>
        ) : (
          <p className="text-slate-400">Choose the configuration (K, L, M, N shells)</p>
        )}

        {aiHint && (
          <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded text-sm text-indigo-200 text-left w-full">
            <strong>AI Tutor:</strong> {aiHint}
          </div>
        )}
      </div>

      {!feedback && (
        <button 
          onClick={askAi}
          disabled={loadingAi}
          className="px-4 py-2 rounded bg-indigo-600/50 hover:bg-indigo-500 text-white transition disabled:opacity-50 text-sm"
        >
          {loadingAi ? "Thinking..." : "Need a hint?"}
        </button>
      )}
    </div>
  );
};

export default Level1;