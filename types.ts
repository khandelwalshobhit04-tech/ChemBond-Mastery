export enum Level {
  DASHBOARD = 'DASHBOARD',
  BONDS = 'BONDS',
  LEWIS = 'LEWIS'
}

export interface AtomConfig {
  symbol: string;
  name: string;
  atomicNumber: number;
  valenceElectrons: number;
  electronegativity: number;
  targetValence?: number; // Usually 8, 2 for H
  id: string;
}

export interface MoleculeChallenge {
  id: string;
  formula: string;
  name: string;
  type: 'IONIC' | 'COVALENT' | 'COORDINATE';
  atoms: string[]; // Symbols
  description: string;
  coordinateDetails?: {
    donorIndex: number;
    acceptorIndex: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}