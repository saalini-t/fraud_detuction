import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  Search, 
  Filter, 
  User,
  Shield,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize],
    queryFn: () => auditLogsApi.getAll(pageSize, page * pageSize),
    refetchInterval: 5000
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4 text-primary" />;
      case 'create':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'update':
        return <Settings className="h-4 w-4 text-warning" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'view':
        return <Eye className="h-4 w-4 text-muted-foreground" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge variant="default" className="bg-success text-white">Login</Badge>;
      case 'logout':
        return <Badge variant="secondary">Logout</Badge>;
      case 'create':
        return <Badge variant="default" className="bg-primary text-white">Create</Badge>;
      case 'update':
        return <Badge className="bg-warning text-warning-foreground">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      case 'view':
        return <Badge variant="outline">View</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'authentication':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'agent':
        return <Settings className="h-4 w-4 text-success" />;
      case 'transaction':
        return <History className="h-4 w-4 text-warning" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'report':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const filteredLogs = auditLogs?.filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource === resourceFilter;
    const matchesUser = userFilter === 'all' || log.username === userFilter;
    
    return matchesSearch && matchesAction && matchesResource && matchesUser;
  }) || [];

  // Get unique values for filters
  const uniqueActions = [...new Set(auditLogs?.map((log: any) => log.action) || [])];
  const uniqueResources = [...new Set(auditLogs?.map((log: any) => log.resource) || [])];
  const uniqueUsers = [...new Set(auditLogs?.map((log: any) => log.username) || [])];

  const logCounts = {
    total: auditLogs?.length || 0,
    today: auditLogs?.filter((log: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(log.timestamp) >= today;
    }).length || 0,
    logins: auditLogs?.filter((log: any) => log.action === 'login').length || 0,
    errors: auditLogs?.filter((log: any) => log.action === 'delete' || log.details?.error).length || 0
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Audit Logs</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="audit-logs-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6" data-testid="audit-logs-icon" />
          <h1 className="text-2xl font-bold" data-testid="audit-logs-title">Audit Logs</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" data-testid="export-logs">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <div className="text-sm text-muted-foreground" data-testid="logs-count">
            {filteredLogs.length} Log Entries
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{logCounts.total}</p>
              </div>
              <History className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Activity</p>
                <p className="text-2xl font-bold text-success">{logCounts.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">User Logins</p>
                <p className="text-2xl font-bold text-primary">{logCounts.logins}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Actions</p>
                <p className="text-2xl font-bold text-destructive">{logCounts.errors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
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
                  placeholder="Search users, actions, resources, IP addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40" data-testid="action-filter">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-48" data-testid="resource-filter">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48" data-testid="user-filter">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card data-testid="audit-logs-table-card">
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="audit-logs-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log._id} data-testid={`log-row-${log._id}`}>
                      <TableCell className="font-mono text-sm">
                        <div>
                          <div>{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getResourceIcon(log.resource)}
                          <span className="capitalize">{log.resource}</span>
                          {log.resourceId && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.resourceId.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatUserAgent(log.userAgent)}
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="text-xs text-muted-foreground bg-muted p-1 rounded max-w-xs overflow-hidden">
                            {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="truncate">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                            {Object.keys(log.details).length > 2 && (
                              <div className="text-xs">+{Object.keys(log.details).length - 2} more</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} logs
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
                disabled={filteredLogs.length < pageSize}
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
