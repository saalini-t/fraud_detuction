import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api';
import { useAgentUpdates } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Agents() {
  const [updatingAgents, setUpdatingAgents] = useState<Set<string>>(new Set());
  const { agents: wsAgents } = useAgentUpdates();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.getAll,
    refetchInterval: 5000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      agentsApi.update(id, updates),
    onSuccess: (data, variables) => {
      toast({
        title: 'Agent Updated',
        description: `Agent ${data.name} has been updated`,
      });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setUpdatingAgents(prev => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update agent',
        variant: 'destructive'
      });
      setUpdatingAgents(prev => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    }
  });

  const handleToggleAgent = (agent: any) => {
    setUpdatingAgents(prev => new Set(prev).add(agent._id));
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({
      id: agent._id,
      updates: { status: newStatus }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-primary" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Bot className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-white">Active</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-primary text-white">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const mergedAgents = agents?.map((agent: any) => {
    const wsAgent = wsAgents.find(ws => ws.id === agent._id);
    return wsAgent ? { ...agent, ...wsAgent } : agent;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bot className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Agent Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="agents-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6" data-testid="agents-icon" />
          <h1 className="text-2xl font-bold" data-testid="agents-title">Agent Management</h1>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="agents-count">
          {mergedAgents.length} Active Agents
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="agents-grid">
        {mergedAgents.map((agent: any) => {
          const isUpdating = updatingAgents.has(agent._id);
          const progress = agent.progress || 0;
          
          return (
            <Card key={agent._id} className="fade-in" data-testid={`agent-card-${agent._id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(agent.status)}
                    <CardTitle className="text-lg" data-testid={`agent-name-${agent._id}`}>
                      {agent.name}
                    </CardTitle>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`agent-type-${agent._id}`}>
                  {agent.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Section */}
                {agent.status === 'processing' && (
                  <div className="space-y-2" data-testid={`agent-progress-${agent._id}`}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <Separator />

                {/* Agent Info */}
                <div className="space-y-3" data-testid={`agent-info-${agent._id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Interval
                    </span>
                    <span className="font-medium">{agent.intervalSeconds}s</span>
                  </div>
                  
                  {agent.lastRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Run</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(agent.lastRun), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {agent.nextRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Run</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(agent.nextRun), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Controls */}
                <div className="flex items-center justify-between" data-testid={`agent-controls-${agent._id}`}>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={agent.status === 'active' || agent.status === 'processing'}
                      onCheckedChange={() => handleToggleAgent(agent)}
                      disabled={isUpdating || updateMutation.isPending}
                      data-testid={`agent-toggle-${agent._id}`}
                    />
                    <span className="text-sm font-medium">
                      {agent.status === 'active' || agent.status === 'processing' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {agent.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAgent(agent)}
                        disabled={isUpdating || updateMutation.isPending}
                        data-testid={`agent-pause-${agent._id}`}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    ) : agent.status === 'inactive' ? (
                      <Button
                        size="sm"
                        onClick={() => handleToggleAgent(agent)}
                        disabled={isUpdating || updateMutation.isPending}
                        data-testid={`agent-start-${agent._id}`}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    ) : null}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`agent-settings-${agent._id}`}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Configuration Preview */}
                {agent.config && Object.keys(agent.config).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2" data-testid={`agent-config-${agent._id}`}>
                      <p className="text-sm font-medium">Configuration</p>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {Object.entries(agent.config).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
