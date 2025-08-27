import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Shield, BarChart3, Bot, ArrowRightLeft, AlertTriangle, FileText, Wallet, History } from 'lucide-react';
import { useSystemStats } from '@/hooks/use-websocket';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Audit Logs', href: '/audit-logs', icon: History },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { stats, isConnected } = useSystemStats();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border" data-testid="sidebar-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" data-testid="sidebar-logo">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="sidebar-title">CryptoGuard</h1>
            <p className="text-xs text-muted-foreground" data-testid="sidebar-subtitle">
              Fraud Detection System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" data-testid="sidebar-nav">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* MongoDB Status */}
      <div className="p-4 border-t border-border" data-testid="mongodb-status">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className={cn(
            "w-2 h-2 rounded-full pulse-dot",
            isConnected ? "bg-success" : "bg-destructive"
          )} data-testid="connection-indicator" />
          <span data-testid="connection-status">
            {isConnected ? 'MongoDB Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1" data-testid="cluster-info">
          cluster-crypto.mongodb.net
        </div>
        
        {stats?.collections && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs" data-testid="collection-stats">
            <div className="text-center" data-testid="users-count">
              <div className="font-medium text-success">{stats.collections.users.toLocaleString()}</div>
              <div className="text-muted-foreground">users</div>
            </div>
            <div className="text-center" data-testid="transactions-count">
              <div className="font-medium text-primary">
                {stats.collections.transactions > 1000 
                  ? `${Math.floor(stats.collections.transactions / 1000)}K` 
                  : stats.collections.transactions.toLocaleString()
                }
              </div>
              <div className="text-muted-foreground">transactions</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
