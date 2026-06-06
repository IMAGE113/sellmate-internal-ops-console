import React, { useState, useMemo, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { opsAPI } from "@/lib/api";
import { AuditLog } from "@/lib/types";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Search, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sanitize } from "@/lib/security";
import ErrorBoundary from "@/components/ErrorBoundary";

function AuditLogsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: logs, isLoading, error } = useApi<AuditLog[]>(
    () => opsAPI.getAuditLogs(100),
    [refreshKey]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const term = searchTerm.toLowerCase();
    return logs.filter((log) =>
      log.event_type.toLowerCase().includes(term) ||
      log.shop_id.toLowerCase().includes(term) ||
      log.description.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const getActorBadge = (actor: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      bot: "default",
      system: "secondary",
      admin: "destructive",
      customer: "secondary",
    };
    return variants[actor.toLowerCase()] || "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">System activity and event tracking</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by event type, shop ID, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(sanitize(e.target.value))}
            className="pl-10"
          />
        </div>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Error loading logs</p>
            <p className="text-sm text-destructive/80">
              {error.message || "Failed to load audit logs"}
            </p>
            {(error as any).correlationId && (
              <p className="text-[10px] font-mono mt-1 opacity-70">
                ID: {(error as any).correlationId}
              </p>
            )}
          </div>
        </Card>
      )}

      {isLoading && !logs && (
        <Card className="p-8 flex items-center justify-center">
          <Spinner />
        </Card>
      )}

      {logs && filteredLogs.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No audit logs found</p>
        </Card>
      )}

      {logs && filteredLogs.length > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Shop ID</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.event_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.shop_id}</TableCell>
                  <TableCell>
                    <Badge variant={getActorBadge(log.actor_source)}>
                      {log.actor_source}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default function AuditLogs() {
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <AuditLogsContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
