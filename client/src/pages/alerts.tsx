import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { useAlertUpdates } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus,
  Shield,
  Bot,
  TrendingUp,
  File,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { recentAlerts } = useAlertUpdates();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', page, pageSize],
    queryFn: () => alertsApi.getAll(pageSize, page * pageSize),
    refetchInterval: 5000
  });

  const { data: openAlerts } = useQuery({
    queryKey: ['alerts', 'open'],
    queryFn: alertsApi.getOpen,
    refetchInterval: 3000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      alertsApi.update(id, updates),
    onSuccess: () => {
      toast({
        title: 'Alert Updated',
        description: 'Alert status has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setIsViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update alert',
        variant: 'destructive'
      });
    }
  });

  const handleUpdateAlert = (alertId: string, updates: any) => {
    updateMutation.mutate({ id: alertId, updates });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'investigating':
        return <Badge className="bg-warning text-warning-foreground">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-success text-white">Resolved</Badge>;
      case 'false_positive':
        return <Badge variant="secondary">False Positive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud_detection':
        return <Shield className="h-4 w-4 text-destructive" />;
      case 'bot_activity':
        return <Bot className="h-4 w-4 text-warning" />;
      case 'pattern_analysis':
      case 'risk_threshold':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'compliance':
        return <File className="h-4 w-4 text-success" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredAlerts = alerts?.filter((alert: any) => {
    const matchesSearch = !searchTerm || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  }) || [];

  const alertCounts = {
    total: alerts?.length || 0,
    open: openAlerts?.length || 0,
    critical: alerts?.filter((a: any) => a.severity === 'critical').length || 0,
    recent: recentAlerts.length
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Alert Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="alerts-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6" data-testid="alerts-icon" />
          <h1 className="text-2xl font-bold" data-testid="alerts-title">Alert Management</h1>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="alerts-count">
          {filteredAlerts.length} Alerts
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alertCounts.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Alerts</p>
                <p className="text-2xl font-bold text-destructive">{alertCounts.open}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">{alertCounts.critical}</p>
              </div>
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Updates</p>
                <p className="text-2xl font-bold text-success">{alertCounts.recent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
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
                  placeholder="Search alerts, addresses, transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40" data-testid="severity-filter">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
                <SelectItem value="pattern_analysis">Pattern Analysis</SelectItem>
                <SelectItem value="risk_threshold">Risk Threshold</SelectItem>
                <SelectItem value="bot_activity">Bot Activity</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card data-testid="alerts-table-card">
        <CardHeader>
          <CardTitle>Alert Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="alerts-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert: any) => (
                    <TableRow key={alert._id} data-testid={`alert-row-${alert._id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {alert.description}
                          </p>
                          {alert.transactionHash && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {alert.transactionHash.slice(0, 16)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(alert.type)}
                          <span className="capitalize text-sm">
                            {alert.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(alert.status)}
                      </TableCell>
                      <TableCell>
                        {alert.riskScore ? (
                          <span className="font-medium">{alert.riskScore.toFixed(1)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setIsViewDialogOpen(true);
                            }}
                            data-testid={`alert-view-${alert._id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {alert.status === 'open' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateAlert(alert._id, { status: 'investigating' })}
                              data-testid={`alert-investigate-${alert._id}`}
                            >
                              Investigate
                            </Button>
                          )}
                          
                          {alert.status === 'investigating' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateAlert(alert._id, { status: 'resolved', resolvedAt: new Date() })}
                              data-testid={`alert-resolve-${alert._id}`}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
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
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
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
                disabled={filteredAlerts.length < pageSize}
                data-testid="next-page"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="alert-detail-dialog">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getTypeIcon(selectedAlert.type)}
                  <span>{selectedAlert.title}</span>
                </DialogTitle>
                <DialogDescription>
                  Alert ID: {selectedAlert._id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                  </div>
                  {selectedAlert.riskScore && (
                    <div>
                      <label className="text-sm font-medium">Risk Score</label>
                      <div className="mt-1 font-mono">{selectedAlert.riskScore.toFixed(1)}</div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <div className="mt-1 text-sm">
                      {formatDistanceToNow(new Date(selectedAlert.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedAlert.description}</p>
                </div>

                {selectedAlert.transactionHash && (
                  <div>
                    <label className="text-sm font-medium">Transaction Hash</label>
                    <p className="mt-1 font-mono text-sm">{selectedAlert.transactionHash}</p>
                  </div>
                )}

                {selectedAlert.walletAddress && (
                  <div>
                    <label className="text-sm font-medium">Wallet Address</label>
                    <p className="mt-1 font-mono text-sm">{selectedAlert.walletAddress}</p>
                  </div>
                )}

                {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Additional Information</label>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex space-x-2">
                  {selectedAlert.status === 'open' && (
                    <Button 
                      onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'investigating' })}
                      disabled={updateMutation.isPending}
                      data-testid="dialog-investigate-button"
                    >
                      Start Investigation
                    </Button>
                  )}
                  
                  {selectedAlert.status === 'investigating' && (
                    <Button 
                      onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'resolved', resolvedAt: new Date() })}
                      disabled={updateMutation.isPending}
                      data-testid="dialog-resolve-button"
                    >
                      Mark Resolved
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'false_positive' })}
                    disabled={updateMutation.isPending}
                    data-testid="dialog-false-positive-button"
                  >
                    False Positive
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
