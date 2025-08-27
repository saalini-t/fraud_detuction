import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { reportsApi } from '@/lib/api';
import { CalendarDays, PieChart, File, History, Download, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const reportTypes = [
  {
    id: 'daily_summary',
    title: 'Daily Summary',
    icon: CalendarDays,
    description: 'Comprehensive daily transaction analysis',
    format: 'pdf'
  },
  {
    id: 'risk_analysis',
    title: 'Risk Analysis',
    icon: PieChart,
    description: 'Detailed risk scoring and pattern analysis',
    format: 'excel'
  },
  {
    id: 'compliance',
    title: 'Compliance Report',
    icon: File,
    description: 'Regulatory compliance and audit summary',
    format: 'excel'
  },
  {
    id: 'audit_trail',
    title: 'Audit Trail',
    icon: History,
    description: 'Complete system activity log',
    format: 'csv'
  }
];

export default function ReportGeneration() {
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll(10, 0),
    refetchInterval: 5000
  });

  const generateMutation = useMutation({
    mutationFn: (reportData: any) => reportsApi.create(reportData),
    onSuccess: (data) => {
      toast({
        title: 'Report Generation Started',
        description: `${data.title} is being generated`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start report generation',
        variant: 'destructive'
      });
    }
  });

  const handleGenerateReport = (reportType: typeof reportTypes[0]) => {
    setGeneratingReports(prev => new Set(prev).add(reportType.id));
    
    generateMutation.mutate({
      title: `${reportType.title} - ${new Date().toISOString().split('T')[0]}`,
      type: reportType.id,
      format: reportType.format,
      parameters: {
        generatedAt: new Date().toISOString(),
        type: reportType.id
      }
    });

    // Simulate generation progress
    setTimeout(() => {
      setGeneratingReports(prev => {
        const next = new Set(prev);
        next.delete(reportType.id);
        return next;
      });
    }, 3000);
  };

  const getReportProgress = (reportId: string) => {
    const isGenerating = generatingReports.has(reportId);
    if (!isGenerating) return 0;
    
    // Simulate progress
    return Math.min(90, Math.random() * 100);
  };

  const getReportStatus = (reportId: string) => {
    const report = reports?.find((r: any) => r.type === reportId);
    if (generatingReports.has(reportId)) return 'generating';
    if (report?.status === 'completed') return 'ready';
    return 'pending';
  };

  return (
    <Card className="fade-in" data-testid="report-generation-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold" data-testid="report-title">
              Report Generation
            </CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="report-subtitle">
              Generate comprehensive fraud detection reports
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full pulse-dot" data-testid="auto-generation-indicator" />
            <span className="text-sm text-muted-foreground" data-testid="auto-generation-text">
              Auto-generation: Active
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="report-grid">
          {reportTypes.map((reportType) => {
            const Icon = reportType.icon;
            const status = getReportStatus(reportType.id);
            const progress = getReportProgress(reportType.id);
            const isGenerating = generatingReports.has(reportType.id);

            return (
              <Card 
                key={reportType.id}
                className="bg-secondary border border-border"
                data-testid={`report-card-${reportType.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm" data-testid={`report-name-${reportType.id}`}>
                      {reportType.title}
                    </h4>
                    <Icon className="text-muted-foreground h-4 w-4" data-testid={`report-icon-${reportType.id}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground" data-testid={`report-status-${reportType.id}`}>
                      {isGenerating ? 'Progress: Generating...' : 
                       status === 'ready' ? 'Ready for download' :
                       status === 'pending' ? 'Progress: Queuing...' : 'Unknown'}
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2" data-testid={`report-progress-container-${reportType.id}`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status === 'ready' ? 'bg-success' :
                          isGenerating ? 'bg-primary progress-bar' :
                          'bg-muted'
                        }`}
                        style={{ 
                          width: status === 'ready' ? '100%' : 
                                 isGenerating ? `${progress}%` : 
                                 '15%' 
                        }}
                        data-testid={`report-progress-bar-${reportType.id}`}
                      />
                    </div>
                    
                    <Button 
                      className={`w-full mt-3 text-xs font-medium transition-colors ${
                        status === 'ready' ? 'bg-success hover:bg-success/90 text-white' :
                        isGenerating ? 'bg-secondary border border-border text-foreground hover:bg-accent' :
                        'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                      size="sm"
                      disabled={isGenerating || generateMutation.isPending}
                      onClick={() => handleGenerateReport(reportType)}
                      data-testid={`report-button-${reportType.id}`}
                    >
                      {status === 'ready' ? (
                        <>
                          <Download className="mr-1 h-3 w-3" />
                          Download {reportType.format.toUpperCase()}
                        </>
                      ) : isGenerating ? (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Generating...
                        </>
                      ) : status === 'pending' ? (
                        'Preparing...'
                      ) : (
                        'Generate Report'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
