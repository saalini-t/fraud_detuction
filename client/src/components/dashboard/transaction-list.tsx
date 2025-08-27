import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface Transaction {
  _id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  riskScore: number;
  timestamp: string;
  network: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const getRiskColor = (score: number) => {
    if (score >= 9) return 'text-destructive';
    if (score >= 7) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getRiskBg = (score: number) => {
    if (score >= 9) return 'bg-destructive/10';
    if (score >= 7) return 'bg-warning/10';
    return 'bg-muted/10';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card className="fade-in" data-testid="high-risk-transactions-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold" data-testid="transactions-title">
            High-Risk Transactions
          </CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" data-testid="view-all-transactions">
              View All <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="transactions-list">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-transactions">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No high-risk transactions found</p>
            </div>
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <div 
                key={transaction._id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
                data-testid={`transaction-item-${transaction._id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRiskBg(transaction.riskScore)}`}>
                    <AlertTriangle className={`text-sm ${getRiskColor(transaction.riskScore)}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" data-testid={`transaction-hash-${transaction._id}`}>
                      {formatAddress(transaction.hash)}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`transaction-from-${transaction._id}`}>
                      From: {formatAddress(transaction.fromAddress)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getRiskColor(transaction.riskScore)}`} data-testid={`transaction-risk-${transaction._id}`}>
                    {transaction.riskScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`transaction-amount-${transaction._id}`}>
                    {formatAmount(transaction.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
