import { Entity, Knowledge, Technology, Decision, DecisionType } from '@/types/simulation';

// Advanced AI decision making
export const makeDecision = (
  human: Entity, 
  nearbyHumans: Entity[], 
  nearbyMobs: Entity[], 
  nearbyTrees: Entity[]
): DecisionType => {
  const decisions: Decision[] = [];
  
  // Social interaction
  if (nearbyHumans.length > 0 && human.personality!.social > 0.4) {
    decisions.push({ type: 'socialize', priority: human.personality!.social * 10 });
  }
  
  // Learning from others
  if (nearbyHumans.length > 0 && human.personality!.curiosity > 0.5) {
    decisions.push({ type: 'learn', priority: human.personality!.curiosity * 8 });
  }
  
  // Resource gathering
  if ((human.resources || 0) < 15 && nearbyTrees.length > 0) {
    decisions.push({ type: 'gather', priority: (15 - (human.resources || 0)) * 2 });
  }
  
  // Combat
  if (nearbyMobs.length > 0 && human.personality!.aggression > 0.6) {
    decisions.push({ type: 'fight', priority: human.personality!.aggression * 6 });
  }
  
  // Building
  if ((human.resources || 0) > 20 && human.knowledge!.crafting > 10) {
    decisions.push({ type: 'build', priority: human.knowledge!.crafting / 2 });
  }
  
  // Exploration
  if (human.personality!.curiosity > 0.3) {
    decisions.push({ type: 'explore', priority: human.personality!.curiosity * 3 });
  }
  
  // Choose best decision
  if (decisions.length > 0) {
    decisions.sort((a, b) => b.priority - a.priority);
    return decisions[0].type;
  }
  
  return 'explore';
};

// Knowledge sharing system
export const shareKnowledge = (human1: Entity, human2: Entity): string | null => {
  if (!human1.knowledge || !human2.knowledge) return null;
  
  const categories = ['science', 'crafting', 'combat', 'survival', 'social'] as const;
  const sharedCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const avgKnowledge = (human1.knowledge[sharedCategory] + human2.knowledge[sharedCategory]) / 2;
  const learningRate = 0.1;
  
  human1.knowledge[sharedCategory] += (avgKnowledge - human1.knowledge[sharedCategory]) * learningRate;
  human2.knowledge[sharedCategory] += (avgKnowledge - human2.knowledge[sharedCategory]) * learningRate;
  
  if (Math.random() < 0.1) {
    return `Люди поделились знаниями в области ${sharedCategory}`;
  }
  
  return null;
};

// Create child with inherited traits
export const createChild = (parent1: Entity, parent2: Entity): Entity => {
  return {
    id: `human-${Date.now()}-${Math.random()}`,
    x: parent1.x + (Math.random() - 0.5) * 25,
    y: parent1.y + (Math.random() - 0.5) * 25,
    type: 'human',
    hp: 100,
    age: 0,
    size: 3,
    color: '#FF4444',
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    resources: 0,
    children: 0,
    knowledge: {
      science: (parent1.knowledge!.science + parent2.knowledge!.science) / 2 * 0.1,
      crafting: (parent1.knowledge!.crafting + parent2.knowledge!.crafting) / 2 * 0.1,
      combat: (parent1.knowledge!.combat + parent2.knowledge!.combat) / 2 * 0.1,
      survival: (parent1.knowledge!.survival + parent2.knowledge!.survival) / 2 * 0.1,
      social: (parent1.knowledge!.social + parent2.knowledge!.social) / 2 * 0.1
    },
    goal: 'explore',
    memory: [],
    personality: {
      aggression: (parent1.personality!.aggression + parent2.personality!.aggression) / 2 + (Math.random() - 0.5) * 0.2,
      curiosity: (parent1.personality!.curiosity + parent2.personality!.curiosity) / 2 + (Math.random() - 0.5) * 0.2,
      social: (parent1.personality!.social + parent2.personality!.social) / 2 + (Math.random() - 0.5) * 0.2
    }
  };
};

// Create building
export const createBuilding = (human: Entity): Entity => {
  return {
    id: `building-${Date.now()}-${Math.random()}`,
    x: human.x + (Math.random() - 0.5) * 30,
    y: human.y + (Math.random() - 0.5) * 30,
    type: 'building',
    size: 8,
    color: '#8B4513',
    buildingType: Math.random() < 0.5 ? 'house' : 'workshop'
  };
};

// Technology discovery system
export const checkTechnologyDiscovery = (
  entities: Entity[], 
  technologies: Technology[]
): { updatedTechnologies: Technology[]; discoveredTech?: Technology } => {
  const humans = entities.filter(e => e.type === 'human') as Entity[];
  if (humans.length === 0) return { updatedTechnologies: technologies };
  
  const totalKnowledge = humans.reduce((acc, h) => {
    if (!h.knowledge) return acc;
    return {
      science: acc.science + h.knowledge.science,
      crafting: acc.crafting + h.knowledge.crafting,
      combat: acc.combat + h.knowledge.combat,
      survival: acc.survival + h.knowledge.survival,
      social: acc.social + h.knowledge.social
    };
  }, { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 });
  
  let discoveredTech: Technology | undefined;
  
  const updatedTechnologies = technologies.map(tech => {
    if (!tech.discovered) {
      const relevantKnowledge = totalKnowledge[tech.category as keyof Knowledge];
      if (relevantKnowledge >= tech.requiredKnowledge) {
        discoveredTech = tech;
        return { ...tech, discovered: true };
      }
    }
    return tech;
  });
  
  return { updatedTechnologies, discoveredTech };
};

// Initialize world entities
export const initializeEntities = (): Entity[] => {
  const newEntities: Entity[] = [];
  
  // Generate trees
  for (let i = 0; i < 80; i++) {
    newEntities.push({
      id: `tree-${i}`,
      x: (Math.random() - 0.5) * 3000,
      y: (Math.random() - 0.5) * 3000,
      type: 'tree',
      size: Math.random() * 8 + 4,
      color: '#8FBC8F'
    });
  }

  // Generate initial humans
  for (let i = 0; i < 15; i++) {
    newEntities.push({
      id: `human-${i}`,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      type: 'human',
      hp: 100,
      age: Math.random() * 25 + 18,
      size: Math.random() * 3 + 5,
      color: '#FF4444',
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      resources: Math.floor(Math.random() * 8),
      children: 0,
      knowledge: {
        science: Math.random() * 3,
        crafting: Math.random() * 3,
        combat: Math.random() * 3,
        survival: Math.random() * 3,
        social: Math.random() * 3
      },
      goal: ['explore', 'gather', 'socialize', 'build', 'learn'][Math.floor(Math.random() * 5)],
      memory: [],
      personality: {
        aggression: Math.random(),
        curiosity: Math.random(),
        social: Math.random()
      }
    });
  }

  // Generate mobs with different behaviors
  for (let i = 0; i < 40; i++) {
    const isSmart = Math.random() < 0.3;
    newEntities.push({
      id: `mob-${i}`,
      x: (Math.random() - 0.5) * 2500,
      y: (Math.random() - 0.5) * 2500,
      type: 'mob',
      hp: Math.random() * 60 + 30,
      size: Math.random() * 5 + 3,
      color: isSmart ? '#CCCCCC' : '#FFFFFF',
      vx: (Math.random() - 0.5) * (isSmart ? 2.5 : 4),
      vy: (Math.random() - 0.5) * (isSmart ? 2.5 : 4),
      personality: {
        aggression: isSmart ? Math.random() * 0.7 : Math.random(),
        curiosity: isSmart ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3,
        social: Math.random() * 0.4
      }
    });
  }

  return newEntities;
};

// Calculate average knowledge
export const calculateAverageKnowledge = (entities: Entity[]): Knowledge => {
  const humans = entities.filter(e => e.type === 'human' && e.knowledge);
  if (humans.length === 0) {
    return { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 };
  }

  const totalKnowledge = humans.reduce((acc, h) => {
    if (!h.knowledge) return acc;
    return {
      science: acc.science + h.knowledge.science,
      crafting: acc.crafting + h.knowledge.crafting,
      combat: acc.combat + h.knowledge.combat,
      survival: acc.survival + h.knowledge.survival,
      social: acc.social + h.knowledge.social
    };
  }, { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 });

  return {
    science: totalKnowledge.science / humans.length,
    crafting: totalKnowledge.crafting / humans.length,
    combat: totalKnowledge.combat / humans.length,
    survival: totalKnowledge.survival / humans.length,
    social: totalKnowledge.social / humans.length
  };
};