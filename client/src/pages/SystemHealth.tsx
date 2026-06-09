import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { healthAPI } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, AlertTriangle, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HealthResponse {
  status?: string;
  database?: string;
  api?: string;
  response_time?: number;
  timestamp?: string;
}

export default function SystemHealth() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: health, isLoading, error } = useApi<HealthResponse>(
    () => healthAPI.checkHealth(),
    [refreshKey]
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getHealthStatus = (status?: string) => {
    if (!status) return 'unknown';
    const lower = status.toLowerCase();
    if (lower.includes('healthy') || lower.includes('ok')) return 'healthy';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('critical') || lower.includes('error')) return 'critical';
    return 'unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'critical':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-muted/10 border-muted/20';
    }
  };

  const apiStatus = getHealthStatus(health?.api || health?.status);
  const dbStatus = getHealthStatus(health?.database);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground mt-1">
              Monitor backend infrastructure status
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RotateCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/10 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                Error checking system health
              </p>
              <p className="text-sm text-destructive/80">
                {error.message || 'Failed to check system health'}
              </p>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !health && (
          <Card className="p-8 flex items-center justify-center">
            <Spinner />
          </Card>
        )}

        {/* Health Status Cards */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Status */}
            <Card className={`p-6 border-2 ${getStatusColor(apiStatus)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">API Status</p>
                  <h3 className="text-2xl font-bold text-foreground capitalize">
                    {apiStatus}
                  </h3>
                </div>
                {getStatusIcon(apiStatus)}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Backend API Service
              </p>
            </Card>

            {/* Database Status */}
            <Card className={`p-6 border-2 ${getStatusColor(dbStatus)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Database Status
                  </p>
                  <h3 className="text-2xl font-bold text-foreground capitalize">
                    {dbStatus}
                  </h3>
                </div>
                {getStatusIcon(dbStatus)}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                PostgreSQL Database
              </p>
            </Card>
          </div>
        )}

        {/* Response Time */}
        {health && health.response_time !== undefined && (
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Response Time
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {health.response_time}ms
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${Math.min((health.response_time / 1000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Timestamp */}
        {health && health.timestamp && (
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Last checked:{' '}
              <span className="font-mono">
                {new Date(health.timestamp).toLocaleString()}
              </span>
            </p>
          </Card>
        )}

        {/* Status Legend */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Status Legend</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-foreground">
                Healthy - System operating normally
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-foreground">
                Warning - Minor issues detected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-foreground">
                Critical - Immediate attention required
              </span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
