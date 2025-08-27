import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  iconColor: string;
  iconBg: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendType,
  iconColor,
  iconBg
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trendType) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="fade-in" data-testid="stats-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground" data-testid="stats-title">
              {title}
            </p>
            <p className="text-3xl font-bold" data-testid="stats-value">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="stats-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("text-lg", iconColor)} data-testid="stats-icon" />
          </div>
        </div>
        
        {trend && (
          <div className={cn("text-xs mt-2 flex items-center", getTrendColor())} data-testid="stats-trend">
            <TrendIcon className="w-3 h-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
