import React, { useState, useMemo, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { opsAPI } from "@/lib/api";
import { Merchant } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Search, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { sanitize } from "@/lib/security";
import ErrorBoundary from "@/components/ErrorBoundary";

function MerchantsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [, setLocation] = useLocation();

  const { data: merchants, isLoading, error } = useApi<Merchant[]>(
    () => opsAPI.getMerchants(statusFilter || undefined),
    [refreshKey, statusFilter]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const filteredMerchants = useMemo(() => {
    if (!merchants) return [];
    const term = searchTerm.toLowerCase();
    return merchants.filter((merchant) =>
      merchant.name.toLowerCase().includes(term) ||
      merchant.shop_id.toLowerCase().includes(term) ||
      merchant.phone.includes(term)
    );
  }, [merchants, searchTerm]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      SUSPENDED: "destructive",
      ARCHIVED: "secondary",
    };
    return variants[status] || "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Merchants</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor merchant accounts
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, shop ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(sanitize(e.target.value))}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Error loading merchants</p>
            <p className="text-sm text-destructive/80">
              {error.message || "Failed to load merchant list"}
            </p>
            {(error as any).correlationId && (
              <p className="text-[10px] font-mono mt-1 opacity-70">
                ID: {(error as any).correlationId}
              </p>
            )}
          </div>
        </Card>
      )}

      {isLoading && !merchants && (
        <Card className="p-8 flex items-center justify-center">
          <Spinner />
        </Card>
      )}

      {merchants && filteredMerchants.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No merchants found</p>
        </Card>
      )}

      {merchants && filteredMerchants.length > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMerchants.map((merchant) => (
                <TableRow key={merchant.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {merchant.shop_id}
                  </TableCell>
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell>{merchant.owner_name}</TableCell>
                  <TableCell>{merchant.phone}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(merchant.status)}>
                      {merchant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(merchant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/merchants/${merchant.shop_id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default function Merchants() {
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <MerchantsContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
