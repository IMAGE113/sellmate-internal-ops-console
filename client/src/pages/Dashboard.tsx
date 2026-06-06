import React, { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { opsAPI } from "@/lib/api";
import { SystemStats } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";

function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: stats, isLoading, error } = useApi<SystemStats>(
    () => opsAPI.getStats(),
    [refreshKey]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and statistics</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? <Spinner className="w-4 h-4" /> : "Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Error loading stats</p>
            <p className="text-sm text-destructive/80">
              {error.message || "Failed to load system statistics"}
            </p>
            {(error as any).correlationId && (
              <p className="text-[10px] font-mono mt-1 opacity-70">
                ID: {(error as any).correlationId}
              </p>
            )}
          </div>
        </Card>
      )}

      {isLoading && !stats && (
        <Card className="p-8 flex items-center justify-center">
          <Spinner />
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Merchants</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.total_merchants || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Merchants</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.active_merchants || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.suspended_merchants || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.total_orders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Queue Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Tasks</span>
                <span className="font-semibold text-foreground">{stats.pending_tasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed Tasks</span>
                <span className="font-semibold text-destructive">{stats.failed_tasks || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">System Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
