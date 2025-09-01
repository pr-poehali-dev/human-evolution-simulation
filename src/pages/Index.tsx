import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface Entity {
  id: string;
  x: number;
  y: number;
  type: 'human' | 'mob' | 'tree';
  hp?: number;
  age?: number;
  size: number;
  color: string;
  vx?: number;
  vy?: number;
  resources?: number;
  children?: number;
}

interface Stats {
  population: number;
  totalDeaths: number;
  totalBuildings: number;
  time: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [stats, setStats] = useState<Stats>({ population: 0, totalDeaths: 0, totalBuildings: 0, time: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [events, setEvents] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number>();

  // Initialize world
  const initializeWorld = useCallback(() => {
    const newEntities: Entity[] = [];
    
    // Generate trees
    for (let i = 0; i < 50; i++) {
      newEntities.push({
        id: `tree-${i}`,
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        type: 'tree',
        size: Math.random() * 8 + 4,
        color: '#8FBC8F'
      });
    }

    // Generate initial humans
    for (let i = 0; i < 10; i++) {
      newEntities.push({
        id: `human-${i}`,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        type: 'human',
        hp: 100,
        age: Math.random() * 20 + 20,
        size: Math.random() * 4 + 6,
        color: '#FF4444',
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        resources: Math.floor(Math.random() * 10),
        children: 0
      });
    }

    // Generate mobs
    for (let i = 0; i < 30; i++) {
      newEntities.push({
        id: `mob-${i}`,
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1500,
        type: 'mob',
        hp: Math.random() * 50 + 20,
        size: Math.random() * 6 + 3,
        color: '#FFFFFF',
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3
      });
    }

    setEntities(newEntities);
    setStats({
      population: newEntities.filter(e => e.type === 'human').length,
      totalDeaths: 0,
      totalBuildings: 0,
      time: 0
    });
    addEvent('Мир создан! Началась эволюция человечества.');
  }, []);

  const addEvent = (event: string) => {
    setEvents(prev => [event, ...prev].slice(0, 10));
  };

  // Simulation logic
  const updateSimulation = useCallback(() => {
    setEntities(currentEntities => {
      const newEntities = [...currentEntities];
      const humans = newEntities.filter(e => e.type === 'human');
      const mobs = newEntities.filter(e => e.type === 'mob');
      
      // Update humans
      humans.forEach(human => {
        if (!human.hp || !human.age) return;

        // Movement
        human.x += human.vx || 0;
        human.y += human.vy || 0;

        // Age and death
        human.age += 0.1;
        if (human.age > 80 || human.hp <= 0) {
          const index = newEntities.indexOf(human);
          if (index > -1) {
            newEntities.splice(index, 1);
            setStats(prev => ({ ...prev, totalDeaths: prev.totalDeaths + 1 }));
            addEvent(`Человек умер в возрасте ${Math.floor(human.age)} лет`);
          }
          return;
        }

        // Random direction change
        if (Math.random() < 0.1) {
          human.vx = (Math.random() - 0.5) * 2;
          human.vy = (Math.random() - 0.5) * 2;
        }

        // Reproduction
        if (human.age > 18 && Math.random() < 0.001) {
          const nearbyHumans = humans.filter(h => 
            h !== human && 
            h.age! > 18 && 
            Math.abs(h.x - human.x) < 50 && 
            Math.abs(h.y - human.y) < 50
          );
          
          if (nearbyHumans.length > 0) {
            const child: Entity = {
              id: `human-${Date.now()}-${Math.random()}`,
              x: human.x + (Math.random() - 0.5) * 20,
              y: human.y + (Math.random() - 0.5) * 20,
              type: 'human',
              hp: 100,
              age: 0,
              size: 4,
              color: '#FF4444',
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              resources: 0,
              children: 0
            };
            newEntities.push(child);
            human.children = (human.children || 0) + 1;
            addEvent('Родился новый человек!');
          }
        }

        // Resource gathering
        if (Math.random() < 0.05) {
          human.resources = (human.resources || 0) + 1;
        }

        // Building construction
        if (human.resources! > 10 && Math.random() < 0.01) {
          human.resources! -= 10;
          setStats(prev => ({ ...prev, totalBuildings: prev.totalBuildings + 1 }));
          addEvent('Построено новое здание!');
        }
      });

      // Update mobs
      mobs.forEach(mob => {
        // Movement
        mob.x += mob.vx || 0;
        mob.y += mob.vy || 0;

        // Random direction change
        if (Math.random() < 0.2) {
          mob.vx = (Math.random() - 0.5) * 3;
          mob.vy = (Math.random() - 0.5) * 3;
        }

        // Interaction with humans
        const nearbyHumans = humans.filter(h => 
          Math.abs(h.x - mob.x) < 30 && Math.abs(h.y - mob.y) < 30
        );
        
        if (nearbyHumans.length > 0 && Math.random() < 0.1) {
          const human = nearbyHumans[0];
          if (mob.hp! > 30) {
            // Strong mob attacks
            human.hp! -= 10;
            addEvent('Моб атаковал человека!');
          } else {
            // Weak mob runs away
            mob.vx = Math.sign(mob.x - human.x) * 4;
            mob.vy = Math.sign(mob.y - human.y) * 4;
          }
        }
      });

      return newEntities;
    });

    setStats(prev => ({
      ...prev,
      population: entities.filter(e => e.type === 'human').length,
      time: prev.time + 1
    }));
  }, [entities]);

  // Rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Render entities
    entities.forEach(entity => {
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
      ctx.fill();

      // Health bar for humans
      if (entity.type === 'human' && entity.hp) {
        const barWidth = 20;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(entity.x - barWidth/2, entity.y - entity.size - 8, barWidth, barHeight);
        ctx.fillStyle = entity.hp > 50 ? '#4CAF50' : entity.hp > 25 ? '#FFC107' : '#F44336';
        ctx.fillRect(entity.x - barWidth/2, entity.y - entity.size - 8, barWidth * (entity.hp / 100), barHeight);
      }
    });

    ctx.restore();
  }, [entities, camera]);

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      let lastTime = 0;
      const gameLoop = (currentTime: number) => {
        if (currentTime - lastTime >= 100 / timeSpeed) {
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

  // Camera controls
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom * zoomFactor))
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startCameraX = camera.x;
    const startCameraY = camera.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / camera.zoom;
      const deltaY = (e.clientY - startY) / camera.zoom;
      setCamera(prev => ({
        ...prev,
        x: startCameraX - deltaX,
        y: startCameraY - deltaY
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="flex h-screen">
        {/* Main simulation area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Overlay controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Button 
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
            >
              <Icon name={isRunning ? "Pause" : "Play"} size={16} />
              {isRunning ? 'Пауза' : 'Старт'}
            </Button>
            <Button onClick={initializeWorld} variant="outline">
              <Icon name="RotateCcw" size={16} />
              Сброс
            </Button>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <Button 
              onClick={() => setTimeSpeed(1)}
              variant={timeSpeed === 1 ? "default" : "outline"}
              size="sm"
            >
              1x
            </Button>
            <Button 
              onClick={() => setTimeSpeed(5)}
              variant={timeSpeed === 5 ? "default" : "outline"}
              size="sm"
            >
              5x
            </Button>
            <Button 
              onClick={() => setTimeSpeed(30)}
              variant={timeSpeed === 30 ? "default" : "outline"}
              size="sm"
            >
              30x
            </Button>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 bg-card border-l border-border p-4 space-y-4">
          <div className="text-xl font-bold text-center">
            HUMAN EVOLUTION SIM
          </div>

          <Separator />

          {/* Statistics */}
          <Card className="p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
              Статистика
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Население:</span>
                <span className="text-primary">{stats.population}</span>
              </div>
              <div className="flex justify-between">
                <span>Всего смертей:</span>
                <span className="text-destructive">{stats.totalDeaths}</span>
              </div>
              <div className="flex justify-between">
                <span>Построек:</span>
                <span className="text-accent">{stats.totalBuildings}</span>
              </div>
              <div className="flex justify-between">
                <span>Время:</span>
                <span>{Math.floor(stats.time / 10)} лет</span>
              </div>
            </div>
          </Card>

          {/* Camera info */}
          <Card className="p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Icon name="Camera" size={16} />
              Камера
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Масштаб:</span>
                <span>{camera.zoom.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Позиция:</span>
                <span>{Math.floor(camera.x)}, {Math.floor(camera.y)}</span>
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
          <Card className="p-4 flex-1">
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

          {/* Legend */}
          <Card className="p-4">
            <h3 className="font-bold mb-2">Легенда</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Люди</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <span>Мобы</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>Деревья</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;