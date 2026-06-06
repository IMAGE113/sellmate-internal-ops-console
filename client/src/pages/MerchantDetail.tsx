import React, { useState, useCallback, useRef, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { opsAPI } from "@/lib/api";
import { Merchant } from "@/lib/types";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { throttle } from "@/lib/security";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function MerchantDetailContent() {
  const [match, params] = useRoute("/merchants/:shopId");
  const [, setLocation] = useLocation();
  const shopId = params?.shopId as string;
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "activate" | "suspend" | null;
  }>({ open: false, action: null });
  const [refreshKey, setRefreshKey] = useState(0);
  
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const { data: merchants, isLoading, error } = useApi<Merchant[]>(
    () => opsAPI.getMerchants(),
    [refreshKey]
  );

  const merchant = merchants?.find((m) => m.shop_id === shopId);

  // Throttled action handler to prevent double-triggering
  const performAction = useCallback(throttle(async (action: "activate" | "suspend") => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      if (action === "activate") {
        await opsAPI.activateMerchant(shopId);
        toast.success("Merchant activated successfully");
      } else {
        await opsAPI.suspendMerchant(shopId);
        toast.success("Merchant suspended successfully");
      }
      
      if (isMounted.current) {
        setRefreshKey((prev) => prev + 1);
        setConfirmDialog({ open: false, action: null });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || `Failed to ${action} merchant`;
      const correlationId = error.correlationId;
      
      toast.error(
        <div className="flex flex-col gap-1">
          <span>{errorMsg}</span>
          {correlationId && <span className="text-[10px] opacity-70 font-mono">ID: {correlationId}</span>}
        </div>
      );
    } finally {
      if (isMounted.current) {
        setActionLoading(false);
      }
    }
  }, 2000), [shopId, actionLoading]);

  if (!match) return null;

  if (isLoading && !merchants) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10 p-6 flex flex-col items-center gap-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div className="text-center">
          <p className="font-bold text-destructive">Failed to load merchant details</p>
          <p className="text-sm text-destructive/80">{error.message}</p>
        </div>
        <Button onClick={() => setRefreshKey(k => k + 1)}>Retry</Button>
      </Card>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/merchants")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Merchants
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Merchant not found</p>
        </Card>
      </div>
    );
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => setLocation("/merchants")} className="mb-4 p-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Merchants
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{merchant.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{merchant.shop_id}</p>
        </div>
        <div className="flex gap-3">
          {merchant.status !== "ACTIVE" && (
            <Button
              onClick={() => setConfirmDialog({ open: true, action: "activate" })}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          {merchant.status !== "SUSPENDED" && (
            <Button
              onClick={() => setConfirmDialog({ open: true, action: "suspend" })}
              variant="destructive"
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner Name</p>
              <p className="font-medium text-foreground">{merchant.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
              <p className="font-medium text-foreground">{merchant.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={getStatusBadge(merchant.status)} className="mt-1">
                {merchant.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created At</p>
              <p className="font-medium text-foreground">
                {new Date(merchant.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Requirements</p>
              <div className="bg-muted/50 p-4 rounded-lg min-h-[100px]">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {merchant.requirements || "No specific requirements provided."}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !actionLoading && setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "activate" ? "Activate Merchant?" : "Suspend Merchant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "activate"
                ? "This will enable all system features for this merchant account."
                : "This will immediately block all system access for this merchant."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmDialog.action) performAction(confirmDialog.action);
              }}
              disabled={actionLoading}
              className={confirmDialog.action === "suspend" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {actionLoading ? <Spinner className="w-4 h-4" /> : confirmDialog.action === "activate" ? "Activate" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MerchantDetail() {
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <MerchantDetailContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
