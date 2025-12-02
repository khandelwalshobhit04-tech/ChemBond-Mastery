import React, { useState } from 'react';
import { Level } from './types';
import Level2 from './components/Level2_Bonds';
import Level3 from './components/Level3_Lewis';
import Level4 from './components/Level4_VSEPR';
import { audioManager } from './services/audio';

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<Level>(Level.DASHBOARD);
  const [isMuted, setIsMuted] = useState(true);

  const toggleAudio = () => {
    // Initialize audio context on first user interaction if not already done
    audioManager.init();
    
    const newState = !isMuted;
    setIsMuted(newState);
    audioManager.setMute(newState);
  };

  const renderLevel = () => {
    switch (currentLevel) {
      case Level.BONDS:
        return <Level2 onComplete={() => setCurrentLevel(Level.DASHBOARD)} />;
      case Level.LEWIS:
        return <Level3 onComplete={() => setCurrentLevel(Level.DASHBOARD)} />;
      default:
        return <Dashboard onSelect={setCurrentLevel} />;
    }
  };

  return (
    <div className="min-h-screen bg-chem-dark text-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-chem-panel border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentLevel(Level.DASHBOARD)}>
          <div className="w-8 h-8 bg-gradient-to-tr from-chem-accent to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
            Cm
          </div>
          <h1 className="text-xl font-bold tracking-wider">ChemBond Mastery</h1>
        </div>
        <div className="flex items-center gap-4">
           {/* Back to Home Screen Link */}
           <a 
             href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true"
             target="_blank" 
             rel="noopener noreferrer"
             className="hidden md:flex px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 hover:text-white transition text-sm font-medium border border-slate-600 items-center gap-2"
           >
             <span>🏠</span> Back to Home
           </a>

           {/* Audio Toggle */}
           <button 
             onClick={toggleAudio}
             className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition border border-slate-600"
             title={isMuted ? "Unmute Sound" : "Mute Sound"}
           >
             {isMuted ? '🔇' : '🔊'}
           </button>

           <div className="flex gap-2">
             {[Level.BONDS, Level.LEWIS].map((lvl, i) => (
               <button 
                 key={lvl}
                 onClick={() => { audioManager.playClick(); setCurrentLevel(lvl); }}
                 className={`px-3 py-1 rounded text-sm font-medium transition ${currentLevel === lvl ? 'bg-chem-accent text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
               >
                 Lvl {i + 1}
               </button>
             ))}
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
         {renderLevel()}
      </main>
    </div>
  );
};

const Dashboard: React.FC<{ onSelect: (l: Level) => void }> = ({ onSelect }) => {
  const cards = [
    { id: Level.BONDS, title: "1. Bond Types", desc: "Ionic vs Covalent. Master electronegativity and coordinate bonds.", color: "border-yellow-500", bg: "bg-yellow-900/20" },
    { id: Level.LEWIS, title: "2. Lewis Structures", desc: "Draw dots and lines. Build valid molecules.", color: "border-green-500", bg: "bg-green-900/20" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-12 mt-8">
         <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
           Master Atomic Interactions
         </h2>
         <p className="text-slate-400 text-lg">Select a module to begin your training.</p>
         
         <a 
            href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true"
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-slate-500 hover:text-white transition border-b border-transparent hover:border-white pb-0.5"
         >
            <span>←</span> Back to Home Screen
         </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {cards.map((c) => (
          <div 
            key={c.id}
            onClick={() => { audioManager.playClick(); onSelect(c.id); }}
            className={`group relative p-8 rounded-2xl border-2 ${c.color} ${c.bg} hover:bg-opacity-30 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden`}
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition"></div>
            <h3 className="text-2xl font-bold mb-2">{c.title}</h3>
            <p className="text-slate-300">{c.desc}</p>
            <div className="mt-6 flex items-center text-sm font-bold text-chem-accent">
               START MODULE <span className="ml-2 group-hover:translate-x-1 transition">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;