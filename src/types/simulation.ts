export interface Technology {
  name: string;
  requiredKnowledge: number;
  cost: number;
  discovered: boolean;
  category: string;
}

export interface Knowledge {
  science: number;
  crafting: number;
  combat: number;
  survival: number;
  social: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  type: 'human' | 'mob' | 'tree' | 'building';
  hp?: number;
  age?: number;
  size: number;
  color: string;
  vx?: number;
  vy?: number;
  resources?: number;
  children?: number;
  knowledge?: Knowledge;
  goal?: string;
  memory?: string[];
  personality?: { aggression: number; curiosity: number; social: number };
  buildingType?: string;
  targetId?: string;
}

export interface Stats {
  population: number;
  totalDeaths: number;
  totalBuildings: number;
  time: number;
  technologies: number;
  avgKnowledge: Knowledge;
  civilizationLevel: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export type DecisionType = 'socialize' | 'gather' | 'build' | 'fight' | 'learn' | 'explore';

export interface Decision {
  type: DecisionType;
  priority: number;
}