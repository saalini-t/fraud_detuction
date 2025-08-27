import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Database, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function DataInput() {
  const [transactionData, setTransactionData] = useState({
    hash: '',
    fromAddress: '',
    toAddress: '',
    amount: '',
    network: 'ethereum',
    gasPrice: '',
    gasUsed: ''
  });
  
  const [alertData, setAlertData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    type: 'manual_review',
    walletAddress: '',
    metadata: '{}'
  });

  const [bulkData, setBulkData] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Transaction added successfully' });
      setTransactionData({
        hash: '',
        fromAddress: '',
        toAddress: '',
        amount: '',
        network: 'ethereum',
        gasPrice: '',
        gasUsed: ''
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: () => {
      toast({ title: 'Error adding transaction', variant: 'destructive' });
    }
  });

  const createAlert = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/alerts', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Alert created successfully' });
      setAlertData({
        title: '',
        description: '',
        severity: 'medium',
        type: 'manual_review',
        walletAddress: '',
        metadata: '{}'
      });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast({ title: 'Error creating alert', variant: 'destructive' });
    }
  });

  const processBulkData = useMutation({
    mutationFn: async (data: string) => {
      const response = await apiRequest('POST', '/api/transactions/bulk', { data });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Bulk data processed successfully' });
      setBulkData('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: () => {
      toast({ title: 'Error processing bulk data', variant: 'destructive' });
    }
  });

  const generateSampleData = async () => {
    try {
      const response = await apiRequest('POST', '/api/system/generate-sample-data');
      const result = await response.json();
      toast({ title: `Generated ${result.count} sample transactions` });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (error) {
      toast({ title: 'Error generating sample data', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="page-title">Data Input</h1>
        <div className="flex gap-2">
          <Button onClick={generateSampleData} variant="outline" data-testid="generate-sample-btn">
            <Database className="h-4 w-4 mr-2" />
            Generate Sample Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Transaction Input */}
        <Card data-testid="transaction-input-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Transaction Hash</label>
                <Input
                  placeholder="0x..."
                  value={transactionData.hash}
                  onChange={(e) => setTransactionData({...transactionData, hash: e.target.value})}
                  data-testid="input-hash"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Network</label>
                <Select value={transactionData.network} onValueChange={(value) => setTransactionData({...transactionData, network: value})}>
                  <SelectTrigger data-testid="select-network">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Address</label>
                <Input
                  placeholder="0x..."
                  value={transactionData.fromAddress}
                  onChange={(e) => setTransactionData({...transactionData, fromAddress: e.target.value})}
                  data-testid="input-from"
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Address</label>
                <Input
                  placeholder="0x..."
                  value={transactionData.toAddress}
                  onChange={(e) => setTransactionData({...transactionData, toAddress: e.target.value})}
                  data-testid="input-to"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  data-testid="input-amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Gas Price</label>
                <Input
                  type="number"
                  placeholder="20"
                  value={transactionData.gasPrice}
                  onChange={(e) => setTransactionData({...transactionData, gasPrice: e.target.value})}
                  data-testid="input-gas-price"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Gas Used</label>
                <Input
                  type="number"
                  placeholder="21000"
                  value={transactionData.gasUsed}
                  onChange={(e) => setTransactionData({...transactionData, gasUsed: e.target.value})}
                  data-testid="input-gas-used"
                />
              </div>
            </div>

            <Button 
              onClick={() => createTransaction.mutate(transactionData)} 
              disabled={createTransaction.isPending || !transactionData.hash || !transactionData.fromAddress}
              className="w-full"
              data-testid="submit-transaction-btn"
            >
              {createTransaction.isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Alert Creation */}
        <Card data-testid="alert-input-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Alert title..."
                value={alertData.title}
                onChange={(e) => setAlertData({...alertData, title: e.target.value})}
                data-testid="input-alert-title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Alert description..."
                value={alertData.description}
                onChange={(e) => setAlertData({...alertData, description: e.target.value})}
                data-testid="input-alert-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={alertData.severity} onValueChange={(value) => setAlertData({...alertData, severity: value})}>
                  <SelectTrigger data-testid="select-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={alertData.type} onValueChange={(value) => setAlertData({...alertData, type: value})}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_review">Manual Review</SelectItem>
                    <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
                    <SelectItem value="pattern_analysis">Pattern Analysis</SelectItem>
                    <SelectItem value="risk_threshold">Risk Threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Wallet Address (Optional)</label>
              <Input
                placeholder="0x..."
                value={alertData.walletAddress}
                onChange={(e) => setAlertData({...alertData, walletAddress: e.target.value})}
                data-testid="input-wallet-address"
              />
            </div>

            <Button 
              onClick={() => createAlert.mutate(alertData)} 
              disabled={createAlert.isPending || !alertData.title || !alertData.description}
              className="w-full"
              data-testid="submit-alert-btn"
            >
              {createAlert.isPending ? 'Creating...' : 'Create Alert'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Data Input */}
      <Card data-testid="bulk-input-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Bulk Data Input</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">JSON Data (Array of transactions)</label>
            <Textarea
              placeholder={`[{"hash": "0x...", "fromAddress": "0x...", "toAddress": "0x...", "amount": "1.5", "network": "ethereum"}]`}
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="min-h-[120px]"
              data-testid="input-bulk-data"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => processBulkData.mutate(bulkData)} 
              disabled={processBulkData.isPending || !bulkData}
              data-testid="submit-bulk-btn"
            >
              {processBulkData.isPending ? 'Processing...' : 'Process Bulk Data'}
            </Button>
            <Button variant="outline" onClick={() => setBulkData('')} data-testid="clear-bulk-btn">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card data-testid="instructions-card">
        <CardHeader>
          <CardTitle>Data Input Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Single Transactions</h4>
              <p className="text-sm text-muted-foreground">
                Add individual transactions with hash, addresses, and amounts. The system will automatically calculate risk scores.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Manual Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Create custom alerts for specific wallets or patterns you want to monitor manually.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bulk Processing</h4>
              <p className="text-sm text-muted-foreground">
                Upload multiple transactions at once using JSON format. Useful for importing historical data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}