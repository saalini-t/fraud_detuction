import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Plus, 
  Filter,
  Calendar,
  PieChart,
  File,
  History,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
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
import { Label } from '@/components/ui/label';

const reportTypes = [
  {
    id: 'daily_summary',
    name: 'Daily Summary',
    icon: Calendar,
    description: 'Comprehensive daily transaction analysis and risk assessment',
    format: 'pdf'
  },
  {
    id: 'risk_analysis',
    name: 'Risk Analysis',
    icon: PieChart,
    description: 'Detailed risk scoring patterns and fraud indicators',
    format: 'excel'
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    icon: File,
    description: 'Regulatory compliance summary and audit findings',
    format: 'excel'
  },
  {
    id: 'audit_trail',
    name: 'Audit Trail',
    icon: History,
    description: 'Complete system activity log and user actions',
    format: 'csv'
  }
];

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReportType, setNewReportType] = useState('');
  const [newReportFormat, setNewReportFormat] = useState('pdf');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll(50, 0),
    refetchInterval: 5000
  });

  const createMutation = useMutation({
    mutationFn: (reportData: any) => reportsApi.create(reportData),
    onSuccess: () => {
      toast({
        title: 'Report Scheduled',
        description: 'Your report has been scheduled for generation',
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsCreateDialogOpen(false);
      setNewReportType('');
    },
    onError: (error: any) => {
      toast({
        title: 'Scheduling Failed',
        description: error.message || 'Failed to schedule report generation',
        variant: 'destructive'
      });
    }
  });

  const handleCreateReport = () => {
    const reportTypeData = reportTypes.find(type => type.id === newReportType);
    if (!reportTypeData) return;

    createMutation.mutate({
      title: `${reportTypeData.name} - ${new Date().toISOString().split('T')[0]}`,
      type: newReportType,
      format: newReportFormat,
      parameters: {
        generatedAt: new Date().toISOString(),
        includeCharts: true,
        dateRange: 'last_24_hours'
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success text-white">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-primary text-primary-foreground">Generating</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'scheduled':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.id === type);
    if (reportType) {
      const Icon = reportType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const filteredReports = reports?.filter((report: any) => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const reportCounts = {
    total: reports?.length || 0,
    completed: reports?.filter((r: any) => r.status === 'completed').length || 0,
    generating: reports?.filter((r: any) => r.status === 'generating').length || 0,
    scheduled: reports?.filter((r: any) => r.status === 'scheduled').length || 0
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Report Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="reports-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6" data-testid="reports-icon" />
          <h1 className="text-2xl font-bold" data-testid="reports-title">Report Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-report-button">
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-report-dialog">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Choose the type of report you want to generate
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={newReportType} onValueChange={setNewReportType}>
                  <SelectTrigger data-testid="report-type-select">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="report-format">Format</Label>
                <Select value={newReportFormat} onValueChange={setNewReportFormat}>
                  <SelectTrigger data-testid="report-format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newReportType && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportTypes.find(type => type.id === newReportType)?.description}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleCreateReport}
                disabled={!newReportType || createMutation.isPending}
                data-testid="confirm-create-report"
              >
                {createMutation.isPending ? 'Scheduling...' : 'Generate Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reportCounts.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{reportCounts.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Generating</p>
                <p className="text-2xl font-bold text-primary">{reportCounts.generating}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-warning">{reportCounts.scheduled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
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
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card data-testid="reports-table-card">
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="reports-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report: any) => (
                    <TableRow key={report._id} data-testid={`report-row-${report._id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.status)}
                          <div>
                            <p className="font-medium">{report.title}</p>
                            {report.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                Completed {formatDistanceToNow(new Date(report.completedAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(report.type)}
                          <span className="capitalize text-sm">
                            {report.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        {report.status === 'generating' ? (
                          <div className="space-y-1">
                            <Progress value={report.progress || 0} className="w-20" />
                            <span className="text-xs text-muted-foreground">
                              {report.progress || 0}%
                            </span>
                          </div>
                        ) : report.status === 'completed' ? (
                          <span className="text-success text-sm">100%</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {report.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.generatedBy}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {report.status === 'completed' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`report-download-${report._id}`}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : report.status === 'failed' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`report-retry-${report._id}`}
                          >
                            Retry
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {report.status === 'generating' ? 'Processing...' : 'Queued'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
