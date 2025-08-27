import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { useTransactionUpdates } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowRightLeft, 
  Search, 
  Filter, 
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { recentTransactions } = useTransactionUpdates();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', page, pageSize],
    queryFn: () => transactionsApi.getAll(pageSize, page * pageSize),
    refetchInterval: 10000
  });

  const { data: highRiskTransactions } = useQuery({
    queryKey: ['transactions', 'high-risk'],
    queryFn: () => transactionsApi.getHighRisk(20),
    refetchInterval: 5000
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 9) return <Badge variant="destructive">Critical</Badge>;
    if (score >= 7) return <Badge variant="destructive">High</Badge>;
    if (score >= 5) return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
    if (score >= 3) return <Badge variant="secondary">Low</Badge>;
    return <Badge variant="outline">Safe</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-success text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredTransactions = transactions?.filter((tx: any) => {
    const matchesSearch = !searchTerm || 
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || 
      (riskFilter === 'high' && tx.riskScore >= 7) ||
      (riskFilter === 'medium' && tx.riskScore >= 4 && tx.riskScore < 7) ||
      (riskFilter === 'low' && tx.riskScore < 4);
    
    const matchesNetwork = networkFilter === 'all' || tx.network === networkFilter;
    
    return matchesSearch && matchesRisk && matchesNetwork;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <ArrowRightLeft className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Transaction Monitoring</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="transactions-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="h-6 w-6" data-testid="transactions-icon" />
          <h1 className="text-2xl font-bold" data-testid="transactions-title">Transaction Monitoring</h1>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="transactions-count">
          {filteredTransactions.length} Transactions
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Monitored</p>
                <p className="text-2xl font-bold">{transactions?.length || 0}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-destructive">{highRiskTransactions?.length || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Updates</p>
                <p className="text-2xl font-bold text-success">{recentTransactions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                <p className="text-2xl font-bold text-warning">6.8</p>
              </div>
              <TrendingDown className="h-8 w-8 text-warning" />
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
                  placeholder="Search by hash, address..."
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
                <SelectItem value="high">High Risk (7+)</SelectItem>
                <SelectItem value="medium">Medium Risk (4-7)</SelectItem>
                <SelectItem value="low">Low Risk (&lt; 4)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-48" data-testid="network-filter">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card data-testid="transactions-table-card">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="transactions-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction: any) => (
                    <TableRow key={transaction._id} data-testid={`transaction-row-${transaction._id}`}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{formatAddress(transaction.hash)}</span>
                          {transaction.riskScore >= 7 && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(transaction.fromAddress)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(transaction.toAddress)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.network}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{transaction.riskScore.toFixed(1)}</span>
                          {getRiskBadge(transaction.riskScore)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" data-testid={`transaction-view-${transaction._id}`}>
                          <ExternalLink className="h-3 w-3" />
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
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
                disabled={filteredTransactions.length < pageSize}
                data-testid="next-page"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
