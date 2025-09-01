import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Entity, Camera } from '@/types/simulation';

interface SimulationCanvasProps {
  entities: Entity[];
  camera: Camera;
  timeSpeed: number;
  isRunning: boolean;
  isDragging: boolean;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export interface SimulationCanvasRef {
  render: () => void;
}

const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>(({
  entities,
  camera,
  timeSpeed,
  isRunning,
  isDragging,
  onWheel,
  onMouseDown,
  onToggleRunning,
  onReset,
  onSpeedChange
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width/2, 
      canvas.height/2, 
      0, 
      canvas.width/2, 
      canvas.height/2, 
      Math.max(canvas.width, canvas.height)
    );
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
            socialize: '💬', 
            gather: '🌳', 
            build: '🏗️', 
            fight: '⚔️', 
            learn: '📚', 
            explore: '🔍'
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

  useImperativeHandle(ref, () => ({
    render
  }), [render]);

  return (
    <div className="flex-1 relative">
      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Enhanced overlay controls */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Button 
          onClick={onToggleRunning}
          variant={isRunning ? "destructive" : "default"}
          size="sm"
        >
          <Icon name={isRunning ? "Pause" : "Play"} size={16} />
          {isRunning ? 'Пауза' : 'Старт'}
        </Button>
        <Button onClick={onReset} variant="outline" size="sm">
          <Icon name="RotateCcw" size={16} />
          Новый мир
        </Button>
      </div>

      <div className="absolute top-4 right-4 flex gap-1">
        {[1, 5, 30].map(speed => (
          <Button 
            key={speed}
            onClick={() => onSpeedChange(speed)}
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
  );
});

SimulationCanvas.displayName = 'SimulationCanvas';

export default SimulationCanvas;