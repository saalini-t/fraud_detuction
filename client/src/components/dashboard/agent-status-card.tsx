import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'processing' | 'error';
  progress: number;
  intervalSeconds: number;
  lastRun?: Date;
}

interface AgentStatusCardProps {
  agent: Agent;
}

export default function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
      case 'active':
        return 'bg-success';
      case 'error':
        return 'bg-destructive';
      case 'inactive':
        return 'bg-muted-foreground';
      default:
        return 'bg-primary';
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'error') return 'bg-destructive';
    if (status === 'inactive') return 'bg-muted';
    
    // Sequential color changes based on progress
    if (progress <= 20) return 'bg-blue-500';        // Start - Blue
    if (progress <= 40) return 'bg-yellow-500';      // Early - Yellow  
    if (progress <= 60) return 'bg-orange-500';      // Mid - Orange
    if (progress <= 80) return 'bg-purple-500';      // Late - Purple
    if (progress < 100) return 'bg-pink-500';        // Almost done - Pink
    return 'bg-green-500';                           // Complete - Green
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing';
      case 'active':
        return 'Active';
      case 'error':
        return 'Error';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getNextRunText = (intervalSeconds: number) => {
    if (agent.status === 'processing') {
      return `Next scan: ${Math.ceil(intervalSeconds * (1 - agent.progress / 100))}s`;
    }
    return `Next cycle: ${intervalSeconds}s`;
  };

  return (
    <Card className="bg-secondary border border-border" data-testid={`agent-card-${agent.type}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm" data-testid={`agent-name-${agent.type}`}>
            {agent.name}
          </h4>
          <div 
            className={cn("w-2 h-2 rounded-full pulse-dot", getStatusColor(agent.status))}
            data-testid={`agent-status-indicator-${agent.type}`}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground" data-testid={`agent-status-text-${agent.type}`}>
              {getStatusText(agent.status)}
            </span>
            <span className="font-medium" data-testid={`agent-progress-text-${agent.type}`}>
              {agent.progress}%
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2" data-testid={`agent-progress-container-${agent.type}`}>
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                agent.status === 'processing' ? 'progress-bar' : '',
                getProgressColor(agent.progress, agent.status)
              )}
              style={{ width: `${agent.progress}%` }}
              data-testid={`agent-progress-bar-${agent.type}`}
            />
          </div>
          
          <div className="text-xs text-muted-foreground" data-testid={`agent-next-run-${agent.type}`}>
            {getNextRunText(agent.intervalSeconds)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
