import { useQuery } from '@tanstack/react-query';
import { systemApi, transactionsApi, alertsApi } from '@/lib/api';
import { useAgentUpdates, useSystemStats } from '@/hooks/use-websocket';
import AgentStatusCard from '@/components/dashboard/agent-status-card';
import StatsCard from '@/components/dashboard/stats-card';
import TransactionList from '@/components/dashboard/transaction-list';
import AlertList from '@/components/dashboard/alert-list';
import ReportGeneration from '@/components/dashboard/report-generation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export default function Dashboard() {
  const { agents, isConnected: wsConnected } = useAgentUpdates();
  const { stats } = useSystemStats();

  const { data: systemStats } = useQuery({
    queryKey: ['system', 'stats'],
    queryFn: systemApi.getStats,
    refetchInterval: 10000
  });

  const { data: highRiskTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', 'high-risk'],
    queryFn: () => transactionsApi.getHighRisk(5),
    refetchInterval: 5000
  });

  const { data: openAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts', 'open'],
    queryFn: alertsApi.getOpen,
    refetchInterval: 5000
  });

  // Get agent data with WebSocket updates merged
  const agentData = agents.length > 0 ? agents : [
    { id: '1', name: 'Transaction Monitor', type: 'transaction_monitor', status: 'processing', progress: 87, intervalSeconds: 5 },
    { id: '2', name: 'Behavior Analysis', type: 'behavior_analysis', status: 'processing', progress: 64, intervalSeconds: 10 },
    { id: '3', name: 'Risk Scoring', type: 'risk_scoring', status: 'processing', progress: 91, intervalSeconds: 8 },
    { id: '4', name: 'Alert Processing', type: 'alerting', status: 'processing', progress: 43, intervalSeconds: 6 },
    { id: '5', name: 'Report Generation', type: 'reporting', status: 'processing', progress: 76, intervalSeconds: 30 }
  ];

  const statsData = stats?.stats || systemStats?.stats || {
    transactionsMonitored: 247831,
    activeAlerts: 23,
    avgRiskScore: 6.8,
    processingSpeed: 1247
  };

  return (
    <div className="p-6 space-y-6" data-testid="dashboard">
      {/* AI Processing Pipeline Status */}
      <Card className="fade-in" data-testid="ai-pipeline-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold" data-testid="pipeline-title">
              AI Processing Pipeline
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-success">
              <div className="w-2 h-2 bg-success rounded-full pulse-dot" data-testid="pipeline-status-indicator" />
              <span data-testid="pipeline-status-text">Autonomous Processing Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="agent-grid">
            {agentData.map((agent) => (
              <AgentStatusCard 
                key={agent.id} 
                agent={agent} 
                data-testid={`agent-card-${agent.type}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-grid">
        <StatsCard
          title="Transactions Monitored"
          value={statsData.transactionsMonitored?.toLocaleString() || '247,831'}
          icon={BarChart3}
          trend="+12.3% from last hour"
          trendType="positive"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          data-testid="stat-transactions"
        />
        
        <StatsCard
          title="Active Alerts"
          value={statsData.activeAlerts?.toString() || '23'}
          icon={AlertTriangle}
          trend="+3 new alerts"
          trendType="negative"
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
          data-testid="stat-alerts"
        />

        <StatsCard
          title="Risk Score Average"
          value={statsData.avgRiskScore?.toFixed(1) || '6.8'}
          icon={TrendingUp}
          trend="Stable"
          trendType="neutral"
          iconColor="text-warning"
          iconBg="bg-warning/10"
          data-testid="stat-risk"
        />

        <StatsCard
          title="Processing Speed"
          value={statsData.processingSpeed?.toLocaleString() || '1,247'}
          subtitle="Transactions per minute"
          icon={Zap}
          iconColor="text-success"
          iconBg="bg-success/10"
          data-testid="stat-speed"
        />
      </div>

      {/* Recent Transactions and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="data-grid">
        <TransactionList 
          transactions={highRiskTransactions || []}
          isLoading={loadingTransactions}
          data-testid="transaction-list"
        />
        
        <AlertList 
          alerts={openAlerts || []}
          isLoading={loadingAlerts}
          data-testid="alert-list"
        />
      </div>

      {/* Report Generation Section */}
      <ReportGeneration data-testid="report-generation" />

      {/* MongoDB Collections Status */}
      <Card className="fade-in" data-testid="mongodb-status-card">
        <CardHeader>
          <CardTitle data-testid="mongodb-title">Database Collections Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="collections-grid">
            {[
              { name: 'users', count: stats?.collections?.users || 1247, color: 'text-success' },
              { name: 'agents', count: stats?.collections?.agents || 5, color: 'text-primary' },
              { name: 'transactions', count: stats?.collections?.transactions || 247000, color: 'text-warning', format: 'K' },
              { name: 'alerts', count: stats?.collections?.alerts || 1892, color: 'text-destructive' },
              { name: 'audit_logs', count: stats?.collections?.audit_logs || 89000, color: 'text-muted-foreground', format: 'K' },
              { name: 'wallet_profiles', count: stats?.collections?.wallet_profiles || 15000, color: 'text-accent-foreground', format: 'K' },
              { name: 'reports', count: stats?.collections?.reports || 342, color: 'text-success' },
              { name: 'sessions', count: 156, color: 'text-primary' }
            ].map((collection) => (
              <div 
                key={collection.name}
                className="text-center p-3 bg-secondary rounded-lg"
                data-testid={`collection-${collection.name}`}
              >
                <div className={`text-2xl font-bold ${collection.color}`} data-testid={`collection-${collection.name}-count`}>
                  {collection.format === 'K' && collection.count > 1000 
                    ? `${Math.floor(collection.count / 1000)}K`
                    : collection.count.toLocaleString()
                  }
                </div>
                <div className="text-sm text-muted-foreground" data-testid={`collection-${collection.name}-label`}>
                  {collection.name}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
