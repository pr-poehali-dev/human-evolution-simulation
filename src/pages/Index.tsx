import React, { useRef, useEffect, useState, useCallback } from 'react';
import SimulationCanvas, { SimulationCanvasRef } from '@/components/SimulationCanvas';
import StatsPanel from '@/components/StatsPanel';
import { Entity, Stats, Technology, Camera, Knowledge } from '@/types/simulation';
import { 
  makeDecision, 
  shareKnowledge, 
  createChild, 
  createBuilding, 
  checkTechnologyDiscovery,
  initializeEntities,
  calculateAverageKnowledge
} from '@/utils/simulationLogic';

const Index = () => {
  const canvasRef = useRef<SimulationCanvasRef>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
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
    const newEntities = initializeEntities();
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

  // Simulation logic with advanced AI
  const updateSimulation = useCallback(() => {
    setEntities(currentEntities => {
      const newEntities = [...currentEntities];
      const humans = newEntities.filter(e => e.type === 'human');
      const mobs = newEntities.filter(e => e.type === 'mob');
      const trees = newEntities.filter(e => e.type === 'tree');
      
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

        // AI Decision making - pass total population for survival decisions
        const decision = makeDecision(human, nearbyHumans, nearbyMobs, nearbyTrees, humans.length);
        human.goal = decision;

        // Execute decision
        switch (decision) {
          case 'socialize':
            if (nearbyHumans.length > 0) {
              const partner = nearbyHumans[0];
              const knowledgeEvent = shareKnowledge(human, partner);
              if (knowledgeEvent) addEvent(knowledgeEvent);
              human.knowledge.social += 0.02;
              
              // Enhanced reproduction system - more babies when needed
              const populationPressure = humans.length < 20 ? 0.01 : humans.length < 40 ? 0.006 : 0.003;
              const ageBonus = (human.age! > 18 && human.age! < 45) && (partner.age! > 18 && partner.age! < 45) ? 1.3 : 1;
              const reproductionChance = populationPressure * ageBonus;
              
              if (Math.random() < reproductionChance) {
                const child = createChild(human, partner);
                newEntities.push(child);
                human.children = (human.children || 0) + 1;
                partner.children = (partner.children || 0) + 1;
                addEvent(`👶 Родился новый человек! Население: ${humans.length + 1}`);
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
              const building = createBuilding(human);
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
            // Solo learning with gradual improvement
            human.knowledge.science += 0.03 + (Math.random() * 0.02);
            human.knowledge.crafting += 0.02 + (Math.random() * 0.01);
            human.knowledge.survival += 0.015;
            human.knowledge.social += 0.01;
            
            // Chance for breakthrough when learning alone
            if (Math.random() < 0.02) {
              const categories = ['science', 'crafting', 'survival', 'social'] as const;
              const category = categories[Math.floor(Math.random() * categories.length)];
              human.knowledge[category] += Math.random() * 2;
              addEvent(`💡 ${human.id} сделал открытие в области ${category}!`);
            }
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

        // Age and improved longevity system
        human.age += 0.05; // Even slower aging
        
        // Knowledge extends life - wiser people live longer
        const totalKnowledge = Object.values(human.knowledge).reduce((sum, val) => sum + val, 0);
        const knowledgeBonus = Math.min(20, totalKnowledge / 8); // Up to 20 years bonus
        const populationBonus = humans.length < 15 ? 15 : humans.length < 30 ? 5 : 0;
        const deathAge = 85 + Math.random() * 20 + knowledgeBonus + populationBonus;
        const minHp = humans.length < 10 ? -30 : 0; // Can survive longer when population is critical
        
        if (human.age > deathAge || human.hp <= minHp) {
          const index = newEntities.indexOf(human);
          if (index > -1) {
            // Transfer some knowledge to nearby humans before death
            nearbyHumans.forEach(nearby => {
              if (nearby.knowledge && human.knowledge) {
                Object.keys(nearby.knowledge).forEach(key => {
                  nearby.knowledge![key as keyof Knowledge] += human.knowledge![key as keyof Knowledge] * 0.1;
                });
              }
            });
            
            newEntities.splice(index, 1);
            setStats(prev => ({ ...prev, totalDeaths: prev.totalDeaths + 1 }));
            if (totalKnowledge > 30) {
              addEvent(`📚 Мудрец ушел в возрасте ${Math.floor(human.age)} лет, передав знания молодым`);
            } else {
              addEvent(`💀 Человек умер в возрасте ${Math.floor(human.age)} лет`);
            }
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
    
    // Population emergency system - spawn new humans if critically low
    if (currentHumans.length < 8 && Math.random() < 0.15) {
      const emergencyHuman: Entity = {
        id: `emergency-human-${Date.now()}`,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        type: 'human',
        hp: 100,
        age: Math.random() * 10 + 20,
        size: Math.random() * 3 + 5,
        color: '#FF4444',
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        resources: Math.floor(Math.random() * 8) + 3,
        children: 0,
        knowledge: {
          science: Math.random() * 4 + 1,
          crafting: Math.random() * 4 + 1,
          combat: Math.random() * 3 + 1,
          survival: Math.random() * 5 + 2,
          social: Math.random() * 4 + 1
        },
        goal: 'socialize',
        memory: [],
        personality: {
          aggression: Math.random() * 0.6,
          curiosity: Math.random() * 0.8 + 0.2,
          social: Math.random() * 0.8 + 0.2
        }
      };
      
      setEntities(prev => [...prev, emergencyHuman]);
      addEvent('🚨 Экстренное появление: новый человек присоединился к цивилизации!');
    }
    
    if (currentHumans.length > 0) {
      const avgKnowledge = calculateAverageKnowledge(currentHumans);
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
    
    // Check for technology discoveries more frequently
    if (stats.time % 30 === 0) {
      const { updatedTechnologies, discoveredTech } = checkTechnologyDiscovery(entities, technologies);
      if (discoveredTech) {
        addEvent(`🎉 Открыта технология: ${discoveredTech.name}! Цивилизация развивается!`);
        
        // Technology discovery boosts all humans' knowledge
        currentHumans.forEach(human => {
          if (human.knowledge) {
            Object.keys(human.knowledge).forEach(key => {
              human.knowledge![key as keyof Knowledge] += 0.5;
            });
          }
        });
      }
      setTechnologies(updatedTechnologies);
    }
  }, [entities, technologies, stats.time]);

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      let lastTime = 0;
      const gameLoop = (currentTime: number) => {
        if (currentTime - lastTime >= 80 / timeSpeed) {
          updateSimulation();
          lastTime = currentTime;
        }
        canvasRef.current?.render();
        animationRef.current = requestAnimationFrame(gameLoop);
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      canvasRef.current?.render();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, timeSpeed, updateSimulation]);

  // Initialize on mount
  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  // Enhanced camera controls like WorldBox
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
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

  const handleCameraReset = () => {
    setCamera({x: 0, y: 0, zoom: 1});
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="flex h-screen">
        <SimulationCanvas
          ref={canvasRef}
          entities={entities}
          camera={camera}
          timeSpeed={timeSpeed}
          isRunning={isRunning}
          isDragging={isDragging}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onToggleRunning={() => setIsRunning(!isRunning)}
          onReset={initializeWorld}
          onSpeedChange={setTimeSpeed}
        />
        
        <StatsPanel
          stats={stats}
          technologies={technologies}
          camera={camera}
          events={events}
          onCameraReset={handleCameraReset}
        />
      </div>
    </div>
  );
};

export default Index;