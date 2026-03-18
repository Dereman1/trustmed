"use client";

import { useEffect, useState } from "react";
import {
  Stethoscope,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  BadgeCheck,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPendingProviders, approveProvider, getProviderById, type Provider } from "@/lib/admin";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [approving, setApproving] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await getPendingProviders();
      setProviders(response.data);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleViewDetails = async (provider: Provider) => {
    setDetailsLoading(true);
    try {
      const response = await getProviderById(provider.id);
      setSelectedProvider(response.data);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
      setSelectedProvider(provider);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving(true);
    try {
      await approveProvider(id);
      toast.success("Provider approved successfully");
      setSelectedProvider(null);
      fetchProviders();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Providers
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and approve pending healthcare provider registrations
          </p>
        </div>
        <Button variant="outline" onClick={fetchProviders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{providers.length}</p>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Pending Providers
          </CardTitle>
          <CardDescription>
            Healthcare providers awaiting approval from administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No pending providers at the moment
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider ID</TableHead>
                    <TableHead className="hidden md:table-cell">Specialization</TableHead>
                    <TableHead className="hidden sm:table-cell">License No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {provider.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {provider.specialization || "Not specified"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {provider.license_number || "Not provided"}
                      </TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(provider.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(provider)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Provider</DialogTitle>
            <DialogDescription>
              Review the provider details and approve or reject the registration.
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : selectedProvider ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Specialization</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProvider.specialization || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">License Number</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProvider.license_number || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Facility ID</p>
                    <p className="text-sm text-muted-foreground font-mono text-xs">
                      {selectedProvider.facility_id || "Independent"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Verification Docs</p>
                    {selectedProvider.verification_docs ? (
                      <a
                        href={selectedProvider.verification_docs}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Verification Doc
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Registered On</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedProvider.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedProvider(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedProvider && handleApprove(selectedProvider.id)}
              disabled={approving || detailsLoading}
            >
              {approving ? "Approving..." : "Approve Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
