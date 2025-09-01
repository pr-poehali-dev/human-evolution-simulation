import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Technology {
  name: string;
  requiredKnowledge: number;
  cost: number;
  discovered: boolean;
  category: string;
}

interface Knowledge {
  science: number;
  crafting: number;
  combat: number;
  survival: number;
  social: number;
}

interface Entity {
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

interface Stats {
  population: number;
  totalDeaths: number;
  totalBuildings: number;
  time: number;
  technologies: number;
  avgKnowledge: Knowledge;
  civilizationLevel: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [events, setEvents] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number>();
  
  const [technologies, setTechnologies] = useState<Technology[]>([
    { name: 'Огонь', requiredKnowledge: 15, cost: 10, discovered: false, category: 'survival' },
    { name: 'Колесо', requiredKnowledge: 30, cost: 20, discovered: false, category: 'crafting' },
    { name: 'Письменность', requiredKnowledge: 50, cost: 35, discovered: false, category: 'social' },
    { name: 'Металлургия', requiredKnowledge: 75, cost: 50, discovered: false, category: 'crafting' },
    { name: 'Архитектура', requiredKnowledge: 100, cost: 70, discovered: false, category: 'crafting' },
    { name: 'Математика', requiredKnowledge: 120, cost: 90, discovered: false, category: 'science' },
    { name: 'Медицина', requiredKnowledge: 140, cost: 110, discovered: false, category: 'science' },
    { name: 'Философия', requiredKnowledge: 160, cost: 130, discovered: false, category: 'social' },
  ]);

  const [stats, setStats] = useState<Stats>({
    population: 0,
    totalDeaths: 0,
    totalBuildings: 0,
    time: 0,
    technologies: 0,
    avgKnowledge: { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 },
    civilizationLevel: 0
  });

  // Initialize world
  const initializeWorld = useCallback(() => {
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

    setEntities(newEntities);
    setTechnologies(prev => prev.map(t => ({ ...t, discovered: false })));
    setStats({
      population: newEntities.filter(e => e.type === 'human').length,
      totalDeaths: 0,
      totalBuildings: 0,
      time: 0,
      technologies: 0,
      avgKnowledge: { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 },
      civilizationLevel: 0
    });
    addEvent('Новый мир создан! Началась великая симуляция эволюции человечества.');
  }, []);

  const addEvent = (event: string) => {
    setEvents(prev => [`[${Math.floor(stats.time / 10)}г] ${event}`, ...prev].slice(0, 15));
  };

  // Advanced AI decision making
  const makeDecision = (human: Entity, nearbyHumans: Entity[], nearbyMobs: Entity[], nearbyTrees: Entity[]) => {
    const decisions = [];
    
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
  const shareKnowledge = (human1: Entity, human2: Entity) => {
    if (!human1.knowledge || !human2.knowledge) return;
    
    const categories = ['science', 'crafting', 'combat', 'survival', 'social'] as const;
    const sharedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const avgKnowledge = (human1.knowledge[sharedCategory] + human2.knowledge[sharedCategory]) / 2;
    const learningRate = 0.1;
    
    human1.knowledge[sharedCategory] += (avgKnowledge - human1.knowledge[sharedCategory]) * learningRate;
    human2.knowledge[sharedCategory] += (avgKnowledge - human2.knowledge[sharedCategory]) * learningRate;
    
    if (Math.random() < 0.1) {
      addEvent(`Люди поделились знаниями в области ${sharedCategory}`);
    }
  };

  // Technology discovery system
  const checkTechnologyDiscovery = () => {
    const humans = entities.filter(e => e.type === 'human') as Entity[];
    if (humans.length === 0) return;
    
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
    
    setTechnologies(prev => prev.map(tech => {
      if (!tech.discovered) {
        const relevantKnowledge = totalKnowledge[tech.category as keyof Knowledge];
        if (relevantKnowledge >= tech.requiredKnowledge) {
          addEvent(`🎉 Открыта технология: ${tech.name}!`);
          return { ...tech, discovered: true };
        }
      }
      return tech;
    }));
  };

  // Simulation logic with advanced AI
  const updateSimulation = useCallback(() => {
    setEntities(currentEntities => {
      const newEntities = [...currentEntities];
      const humans = newEntities.filter(e => e.type === 'human');
      const mobs = newEntities.filter(e => e.type === 'mob');
      const trees = newEntities.filter(e => e.type === 'tree');
      const buildings = newEntities.filter(e => e.type === 'building');
      
      // Update humans with advanced AI
      humans.forEach(human => {
        if (!human.hp || !human.age || !human.knowledge) return;

        // Find nearby entities
        const nearbyHumans = humans.filter(h => 
          h !== human && Math.abs(h.x - human.x) < 80 && Math.abs(h.y - human.y) < 80
        );
        const nearbyMobs = mobs.filter(m => 
          Math.abs(m.x - human.x) < 60 && Math.abs(m.y - human.y) < 60
        );
        const nearbyTrees = trees.filter(t => 
          Math.abs(t.x - human.x) < 40 && Math.abs(t.y - human.y) < 40
        );

        // AI Decision making
        const decision = makeDecision(human, nearbyHumans, nearbyMobs, nearbyTrees);
        human.goal = decision;

        // Execute decision
        switch (decision) {
          case 'socialize':
            if (nearbyHumans.length > 0) {
              const partner = nearbyHumans[0];
              shareKnowledge(human, partner);
              human.knowledge.social += 0.02;
              
              // Reproduction chance
              if (human.age! > 18 && partner.age! > 18 && Math.random() < 0.003) {
                const child: Entity = {
                  id: `human-${Date.now()}-${Math.random()}`,
                  x: human.x + (Math.random() - 0.5) * 25,
                  y: human.y + (Math.random() - 0.5) * 25,
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
                    science: (human.knowledge.science + partner.knowledge!.science) / 2 * 0.1,
                    crafting: (human.knowledge.crafting + partner.knowledge!.crafting) / 2 * 0.1,
                    combat: (human.knowledge.combat + partner.knowledge!.combat) / 2 * 0.1,
                    survival: (human.knowledge.survival + partner.knowledge!.survival) / 2 * 0.1,
                    social: (human.knowledge.social + partner.knowledge!.social) / 2 * 0.1
                  },
                  goal: 'explore',
                  memory: [],
                  personality: {
                    aggression: (human.personality!.aggression + partner.personality!.aggression) / 2 + (Math.random() - 0.5) * 0.2,
                    curiosity: (human.personality!.curiosity + partner.personality!.curiosity) / 2 + (Math.random() - 0.5) * 0.2,
                    social: (human.personality!.social + partner.personality!.social) / 2 + (Math.random() - 0.5) * 0.2
                  }
                };
                newEntities.push(child);
                human.children = (human.children || 0) + 1;
                addEvent('👶 Родился новый человек с наследственными знаниями!');
              }
            }
            break;
            
          case 'gather':
            if (nearbyTrees.length > 0) {
              human.resources = (human.resources || 0) + 1;
              human.knowledge.survival += 0.01;
              human.vx = (nearbyTrees[0].x - human.x) * 0.01;
              human.vy = (nearbyTrees[0].y - human.y) * 0.01;
            }
            break;
            
          case 'build':
            if ((human.resources || 0) > 25) {
              human.resources! -= 25;
              const building: Entity = {
                id: `building-${Date.now()}-${Math.random()}`,
                x: human.x + (Math.random() - 0.5) * 30,
                y: human.y + (Math.random() - 0.5) * 30,
                type: 'building',
                size: 8,
                color: '#8B4513',
                buildingType: Math.random() < 0.5 ? 'house' : 'workshop'
              };
              newEntities.push(building);
              human.knowledge.crafting += 0.05;
              setStats(prev => ({ ...prev, totalBuildings: prev.totalBuildings + 1 }));
              addEvent(`🏗️ Построено здание: ${building.buildingType}`);
            }
            break;
            
          case 'fight':
            if (nearbyMobs.length > 0) {
              const mob = nearbyMobs[0];
              mob.hp! -= 15 + human.knowledge.combat;
              human.knowledge.combat += 0.03;
              if (mob.hp! <= 0) {
                const index = newEntities.indexOf(mob);
                if (index > -1) newEntities.splice(index, 1);
                human.resources = (human.resources || 0) + 5;
                addEvent('⚔️ Человек победил моба и получил ресурсы!');
              }
            }
            break;
            
          case 'learn':
            human.knowledge.science += 0.02;
            human.knowledge.crafting += 0.01;
            break;
            
          case 'explore':
          default:
            human.vx = (human.vx || 0) + (Math.random() - 0.5) * 0.5;
            human.vy = (human.vy || 0) + (Math.random() - 0.5) * 0.5;
            break;
        }

        // Movement with bounds
        human.x += human.vx || 0;
        human.y += human.vy || 0;
        
        // Damping
        human.vx = (human.vx || 0) * 0.98;
        human.vy = (human.vy || 0) * 0.98;

        // Age and death
        human.age += 0.08;
        if (human.age > 85 + Math.random() * 20 || human.hp <= 0) {
          const index = newEntities.indexOf(human);
          if (index > -1) {
            newEntities.splice(index, 1);
            setStats(prev => ({ ...prev, totalDeaths: prev.totalDeaths + 1 }));
            addEvent(`💀 Человек умер в возрасте ${Math.floor(human.age)} лет, оставив знания потомкам`);
          }
        }
      });

      // Update mobs with smarter behavior
      mobs.forEach(mob => {
        const nearbyHumans = humans.filter(h => 
          Math.abs(h.x - mob.x) < 70 && Math.abs(h.y - mob.y) < 70
        );
        
        if (nearbyHumans.length > 0) {
          const human = nearbyHumans[0];
          const distance = Math.sqrt((human.x - mob.x) ** 2 + (human.y - mob.y) ** 2);
          
          if (mob.personality!.aggression > 0.6 && mob.hp! > 40) {
            // Aggressive mob attacks
            mob.vx = (human.x - mob.x) * 0.02;
            mob.vy = (human.y - mob.y) * 0.02;
            if (distance < 20) {
              human.hp! -= 8;
              addEvent('🐺 Агрессивный моб атакует человека!');
            }
          } else {
            // Scared mob runs away
            mob.vx = (mob.x - human.x) * 0.03;
            mob.vy = (mob.y - human.y) * 0.03;
          }
        } else {
          // Random movement
          if (Math.random() < 0.1) {
            mob.vx = (Math.random() - 0.5) * 3;
            mob.vy = (Math.random() - 0.5) * 3;
          }
        }
        
        mob.x += mob.vx || 0;
        mob.y += mob.vy || 0;
        mob.vx = (mob.vx || 0) * 0.95;
        mob.vy = (mob.vy || 0) * 0.95;
      });

      return newEntities;
    });

    // Update statistics
    const currentHumans = entities.filter(e => e.type === 'human');
    if (currentHumans.length > 0) {
      const totalKnowledge = currentHumans.reduce((acc, h) => {
        if (!h.knowledge) return acc;
        return {
          science: acc.science + h.knowledge.science,
          crafting: acc.crafting + h.knowledge.crafting,
          combat: acc.combat + h.knowledge.combat,
          survival: acc.survival + h.knowledge.survival,
          social: acc.social + h.knowledge.social
        };
      }, { science: 0, crafting: 0, combat: 0, survival: 0, social: 0 });
      
      const avgKnowledge = {
        science: totalKnowledge.science / currentHumans.length,
        crafting: totalKnowledge.crafting / currentHumans.length,
        combat: totalKnowledge.combat / currentHumans.length,
        survival: totalKnowledge.survival / currentHumans.length,
        social: totalKnowledge.social / currentHumans.length
      };
      
      const civLevel = Math.floor((avgKnowledge.science + avgKnowledge.crafting + avgKnowledge.social) / 3);
      
      setStats(prev => ({
        ...prev,
        population: currentHumans.length,
        time: prev.time + 1,
        avgKnowledge,
        civilizationLevel: civLevel,
        technologies: technologies.filter(t => t.discovered).length
      }));
    }
    
    // Check for technology discoveries periodically
    if (stats.time % 50 === 0) {
      checkTechnologyDiscovery();
    }
  }, [entities, technologies, stats.time]);

  // Enhanced rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with gradient background
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
    gradient.addColorStop(0, '#2D5016');
    gradient.addColorStop(1, '#1A3009');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Render entities with enhanced visuals
    entities.forEach(entity => {
      ctx.fillStyle = entity.color;
      
      // Add glow effect for humans with high knowledge
      if (entity.type === 'human' && entity.knowledge) {
        const totalKnowledge = Object.values(entity.knowledge).reduce((a, b) => a + b, 0);
        if (totalKnowledge > 20) {
          ctx.shadowColor = entity.color;
          ctx.shadowBlur = 5;
        }
      }
      
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // Enhanced UI for humans
      if (entity.type === 'human' && entity.hp && entity.knowledge) {
        // Health bar
        const barWidth = 24;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(entity.x - barWidth/2, entity.y - entity.size - 12, barWidth, barHeight);
        ctx.fillStyle = entity.hp > 50 ? '#4CAF50' : entity.hp > 25 ? '#FFC107' : '#F44336';
        ctx.fillRect(entity.x - barWidth/2, entity.y - entity.size - 12, barWidth * (entity.hp / 100), barHeight);
        
        // Knowledge indicator
        const totalKnowledge = Object.values(entity.knowledge).reduce((a, b) => a + b, 0);
        if (totalKnowledge > 10) {
          ctx.fillStyle = '#9B87F5';
          ctx.fillRect(entity.x - barWidth/2, entity.y - entity.size - 8, barWidth * Math.min(1, totalKnowledge / 50), 2);
        }
        
        // Goal indicator
        if (entity.goal) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          const goalSymbols = {
            socialize: '💬', gather: '🌳', build: '🏗️', fight: '⚔️', learn: '📚', explore: '🔍'
          };
          ctx.fillText(goalSymbols[entity.goal as keyof typeof goalSymbols] || '?', entity.x, entity.y + entity.size + 12);
        }
      }
      
      // Building indicators
      if (entity.type === 'building') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(entity.buildingType === 'house' ? '🏠' : '⚒️', entity.x, entity.y + 2);
      }
    });

    ctx.restore();
  }, [entities, camera]);

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      let lastTime = 0;
      const gameLoop = (currentTime: number) => {
        if (currentTime - lastTime >= 80 / timeSpeed) {
          updateSimulation();
          lastTime = currentTime;
        }
        render();
        animationRef.current = requestAnimationFrame(gameLoop);
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      render();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, timeSpeed, updateSimulation, render]);

  // Initialize on mount
  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  // Enhanced camera controls like WorldBox
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(8, camera.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const zoomRatio = newZoom / camera.zoom;
    setCamera(prev => ({
      x: prev.x + (mouseX / prev.zoom) * (1 - zoomRatio),
      y: prev.y + (mouseY / prev.zoom) * (1 - zoomRatio),
      zoom: newZoom
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startCameraX = camera.x;
    const startCameraY = camera.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / camera.zoom;
      const deltaY = (e.clientY - startY) / camera.zoom;
      setCamera({
        x: startCameraX - deltaX,
        y: startCameraY - deltaY,
        zoom: camera.zoom
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case ' ':
          e.preventDefault();
          setIsRunning(!isRunning);
          break;
        case 'r':
          initializeWorld();
          break;
        case '1':
          setTimeSpeed(1);
          break;
        case '2':
          setTimeSpeed(5);
          break;
        case '3':
          setTimeSpeed(30);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, initializeWorld]);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="flex h-screen">
        {/* Main simulation area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={1000}
            height={700}
            className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Enhanced overlay controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Button 
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
              size="sm"
            >
              <Icon name={isRunning ? "Pause" : "Play"} size={16} />
              {isRunning ? 'Пауза' : 'Старт'}
            </Button>
            <Button onClick={initializeWorld} variant="outline" size="sm">
              <Icon name="RotateCcw" size={16} />
              Новый мир
            </Button>
          </div>

          <div className="absolute top-4 right-4 flex gap-1">
            {[1, 5, 30].map(speed => (
              <Button 
                key={speed}
                onClick={() => setTimeSpeed(speed)}
                variant={timeSpeed === speed ? "default" : "outline"}
                size="sm"
              >
                {speed}x
              </Button>
            ))}
          </div>
          
          <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded">
            Управление: Колесо - зум, Перетаскивание - перемещение, Пробел - пауза, R - новый мир
          </div>
        </div>

        {/* Enhanced side panel */}
        <div className="w-96 bg-card border-l border-border p-4 space-y-3 overflow-y-auto">
          <div className="text-xl font-bold text-center text-primary">
            HUMAN EVOLUTION SIM
          </div>

          <Separator />

          {/* Civilization Level */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="Crown" size={16} />
              Уровень цивилизации: {stats.civilizationLevel}
            </h3>
            <Progress value={Math.min(100, stats.civilizationLevel * 2)} className="h-2" />
          </Card>

          {/* Statistics */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
              Статистика
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Население:</span>
                <span className="text-primary font-mono">{stats.population}</span>
              </div>
              <div className="flex justify-between">
                <span>Всего смертей:</span>
                <span className="text-destructive font-mono">{stats.totalDeaths}</span>
              </div>
              <div className="flex justify-between">
                <span>Построек:</span>
                <span className="text-accent font-mono">{stats.totalBuildings}</span>
              </div>
              <div className="flex justify-between">
                <span>Технологий:</span>
                <span className="text-blue-400 font-mono">{stats.technologies}</span>
              </div>
              <div className="flex justify-between">
                <span>Время:</span>
                <span className="font-mono">{Math.floor(stats.time / 10)} лет</span>
              </div>
            </div>
          </Card>

          {/* Knowledge levels */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="Brain" size={16} />
              Средние знания
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(stats.avgKnowledge).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="capitalize">{key}:</span>
                    <span>{value.toFixed(1)}</span>
                  </div>
                  <Progress value={Math.min(100, value * 2)} className="h-1" />
                </div>
              ))}
            </div>
          </Card>

          {/* Technologies */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="Lightbulb" size={16} />
              Технологии
            </h3>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {technologies.map((tech, index) => (
                <div key={index} className={`flex justify-between ${tech.discovered ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <span>{tech.discovered ? '✅' : '⏳'} {tech.name}</span>
                  <span>{tech.requiredKnowledge}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Camera info */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="Camera" size={16} />
              Камера
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Масштаб:</span>
                <span className="font-mono">{camera.zoom.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Позиция:</span>
                <span className="font-mono">{Math.floor(camera.x)}, {Math.floor(camera.y)}</span>
              </div>
            </div>
            <Button 
              onClick={() => setCamera({x: 0, y: 0, zoom: 1})}
              className="w-full mt-2"
              variant="outline"
              size="sm"
            >
              <Icon name="Home" size={14} />
              В центр
            </Button>
          </Card>

          {/* Events log */}
          <Card className="p-3">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="ScrollText" size={16} />
              События
            </h3>
            <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="text-muted-foreground">
                  {event}
                </div>
              ))}
            </div>
          </Card>

          {/* Enhanced Legend */}
          <Card className="p-3">
            <h3 className="font-bold mb-2">Легенда</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Люди с ИИ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Мобы (трусливые)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>Умные мобы</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>Деревья</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-700"></div>
                <span>Здания</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;