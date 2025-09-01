import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Stats, Technology, Camera } from '@/types/simulation';

interface StatsPanelProps {
  stats: Stats;
  technologies: Technology[];
  camera: Camera;
  events: string[];
  onCameraReset: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  technologies,
  camera,
  events,
  onCameraReset
}) => {
  return (
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
          onClick={onCameraReset}
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
  );
};

export default StatsPanel;