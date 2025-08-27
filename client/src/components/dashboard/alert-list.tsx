import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Bot, TrendingUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  _id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'fraud_detection' | 'pattern_analysis' | 'risk_threshold' | 'bot_activity' | 'compliance';
  createdAt: string;
}

interface AlertListProps {
  alerts: Alert[];
  isLoading: boolean;
}

export default function AlertList({ alerts, isLoading }: AlertListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive' as const;
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'outline' as const;
      case 'low':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud_detection':
        return Shield;
      case 'bot_activity':
        return Bot;
      case 'pattern_analysis':
      case 'risk_threshold':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fraud_detection':
        return 'text-destructive';
      case 'bot_activity':
        return 'text-warning';
      case 'pattern_analysis':
      case 'risk_threshold':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'fraud_detection':
        return 'bg-destructive/10';
      case 'bot_activity':
        return 'bg-warning/10';
      case 'pattern_analysis':
      case 'risk_threshold':
        return 'bg-primary/10';
      default:
        return 'bg-muted/10';
    }
  };

  return (
    <Card className="fade-in" data-testid="recent-alerts-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold" data-testid="alerts-title">
            Recent Alerts
          </CardTitle>
          <Link href="/alerts">
            <Button variant="ghost" size="sm" data-testid="manage-all-alerts">
              Manage All <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="alerts-list">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-secondary rounded-lg">
                <Skeleton className="w-8 h-8 rounded-lg mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-alerts">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent alerts</p>
            </div>
          ) : (
            alerts.slice(0, 5).map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <div 
                  key={alert._id}
                  className="flex items-start space-x-3 p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
                  data-testid={`alert-item-${alert._id}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getTypeBg(alert.type)}`}>
                    <TypeIcon className={`text-xs ${getTypeColor(alert.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium" data-testid={`alert-title-${alert._id}`}>
                        {alert.title}
                      </p>
                      <Badge variant={getSeverityColor(alert.severity)} className="text-xs" data-testid={`alert-severity-${alert._id}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1" data-testid={`alert-description-${alert._id}`}>
                      {alert.description}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`alert-timestamp-${alert._id}`}>
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs flex-shrink-0" data-testid={`alert-action-${alert._id}`}>
                    {alert.type === 'fraud_detection' ? 'Investigate' : 
                     alert.type === 'bot_activity' ? 'Review' : 'Analyze'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
