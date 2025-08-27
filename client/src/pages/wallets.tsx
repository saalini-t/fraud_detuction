import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletsApi, transactionsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Search, 
  Filter, 
  ExternalLink,
  AlertTriangle,
  Shield,
  TrendingUp,
  Eye,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Wallets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk');
  const [page, setPage] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const pageSize = 25;

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets', page, pageSize],
    queryFn: () => walletsApi.getAll(pageSize, page * pageSize),
    refetchInterval: 10000
  });

  const { data: highRiskWallets } = useQuery({
    queryKey: ['wallets', 'high-risk'],
    queryFn: () => walletsApi.getHighRisk(20),
    refetchInterval: 5000
  });

  const { data: walletTransactions } = useQuery({
    queryKey: ['wallet-transactions', selectedWallet?.address],
    queryFn: () => selectedWallet ? transactionsApi.getByWallet(selectedWallet.address, 20) : null,
    enabled: !!selectedWallet
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredWallets = wallets?.filter((wallet: any) => {
    const matchesSearch = !searchTerm || 
      wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRisk = riskFilter === 'all' || wallet.riskLevel === riskFilter;
    
    return matchesSearch && matchesRisk;
  })?.sort((a: any, b: any) => {
    switch (sortBy) {
      case 'risk':
        return b.averageRiskScore - a.averageRiskScore;
      case 'value':
        return parseFloat(b.totalValue) - parseFloat(a.totalValue);
      case 'transactions':
        return b.totalTransactions - a.totalTransactions;
      case 'recent':
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      default:
        return 0;
    }
  }) || [];

  const walletCounts = {
    total: wallets?.length || 0,
    highRisk: highRiskWallets?.length || 0,
    critical: wallets?.filter((w: any) => w.riskLevel === 'critical').length || 0,
    monitored: wallets?.filter((w: any) => w.totalTransactions > 10).length || 0
  };

  const handleViewWallet = (wallet: any) => {
    setSelectedWallet(wallet);
    setIsDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Wallet className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Wallet Profiles</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="wallets-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" data-testid="wallets-icon" />
          <h1 className="text-2xl font-bold" data-testid="wallets-title">Wallet Profiles</h1>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="wallets-count">
          {filteredWallets.length} Wallets
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Wallets</p>
                <p className="text-2xl font-bold">{walletCounts.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-destructive">{walletCounts.highRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Risk</p>
                <p className="text-2xl font-bold text-destructive">{walletCounts.critical}</p>
              </div>
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Monitored</p>
                <p className="text-2xl font-bold text-success">{walletCounts.monitored}</p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="filters-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-48" data-testid="risk-filter">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" data-testid="sort-filter">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Score</SelectItem>
                <SelectItem value="value">Total Value</SelectItem>
                <SelectItem value="transactions">Transaction Count</SelectItem>
                <SelectItem value="recent">Last Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <Card data-testid="wallets-table-card">
        <CardHeader>
          <CardTitle>Wallet Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="wallets-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No wallets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((wallet: any) => (
                    <TableRow key={wallet._id} data-testid={`wallet-row-${wallet._id}`}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{formatAddress(wallet.address)}</span>
                          {wallet.riskLevel === 'critical' && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskLevelBadge(wallet.riskLevel)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getRiskColor(wallet.riskLevel)}`}>
                            {wallet.averageRiskScore.toFixed(1)}
                          </span>
                          <div className="w-16">
                            <Progress 
                              value={wallet.averageRiskScore * 10} 
                              className="h-1"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatValue(wallet.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{wallet.totalTransactions}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(wallet.firstSeen), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(wallet.lastSeen), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {wallet.tags?.slice(0, 2).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          )) || '-'}
                          {wallet.tags?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{wallet.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewWallet(wallet)}
                          data-testid={`wallet-view-${wallet._id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4" data-testid="pagination">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredWallets.length)} of {filteredWallets.length} wallets
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="prev-page"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={filteredWallets.length < pageSize}
                data-testid="next-page"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl" data-testid="wallet-detail-dialog">
          {selectedWallet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet Profile</span>
                </DialogTitle>
                <DialogDescription className="font-mono">
                  {selectedWallet.address}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Wallet Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <div className="mt-1">{getRiskLevelBadge(selectedWallet.riskLevel)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className={`text-2xl font-bold ${getRiskColor(selectedWallet.riskLevel)}`}>
                          {selectedWallet.averageRiskScore.toFixed(1)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">
                          {formatValue(selectedWallet.totalValue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="text-2xl font-bold">{selectedWallet.totalTransactions}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First Seen</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(selectedWallet.firstSeen), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Activity</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(selectedWallet.lastSeen), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Transaction</span>
                        <span className="font-medium">
                          {formatValue((parseFloat(selectedWallet.totalValue) / selectedWallet.totalTransactions).toString())}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tags & Classification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedWallet.tags?.length > 0 ? (
                          selectedWallet.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No tags assigned</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {walletTransactions?.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {walletTransactions.slice(0, 10).map((tx: any) => (
                          <div key={tx._id} className="flex items-center justify-between p-2 bg-secondary rounded">
                            <div>
                              <p className="font-mono text-sm">{formatAddress(tx.hash)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatValue(tx.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                Risk: {tx.riskScore.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No recent transactions found
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
