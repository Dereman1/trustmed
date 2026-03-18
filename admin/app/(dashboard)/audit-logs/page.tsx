"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  RefreshCw,
  Search,
  Activity,
  User,
  FileText,
  Clock,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuditLogs, type AuditLog } from "@/lib/admin";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const response = await getAuditLogs(PAGE_SIZE, pageNum * PAGE_SIZE);
      const newLogs = response.data as AuditLog[];
      setLogs(newLogs);
      setFilteredLogs(newLogs);
      setHasMore(newLogs.length === PAGE_SIZE);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) => {
            const resourceType = (log.metadata?.resource_type as string) || "Unknown";
            return log.action_type?.toLowerCase().includes(query) ||
            resourceType.toLowerCase().includes(query) ||
            log.user_id?.toLowerCase().includes(query)
          }
        )
      );
    } else {
      setFilteredLogs(logs);
    }
  }, [searchQuery, logs]);

  const getResourceType = (log: AuditLog) => {
    if (log.metadata && typeof log.metadata.resource_type === "string") {
      return log.metadata.resource_type;
    }
    return "Unknown";
  };

  const getActionBadge = (action: string) => {
    const actionLower = action?.toLowerCase() || "";
    if (actionLower.includes("create") || actionLower.includes("add")) {
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
          {action}
        </Badge>
      );
    }
    if (actionLower.includes("update") || actionLower.includes("edit")) {
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          {action}
        </Badge>
      );
    }
    if (actionLower.includes("delete") || actionLower.includes("remove")) {
      return (
        <Badge variant="destructive">
          {action}
        </Badge>
      );
    }
    if (actionLower.includes("login") || actionLower.includes("auth")) {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {action}
        </Badge>
      );
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchLogs(page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
                <p className="text-xs text-muted-foreground">Events This Page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Recent system activities and user actions
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No audit logs found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden md:table-cell">User ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                          {log.user_id ? `${log.user_id.slice(0, 8)}...` : "System"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit event.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Action</p>
                    <div className="mt-1">{getActionBadge(selectedLog.action_type)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Resource Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {getResourceType(selectedLog)}
                    </p>
                  </div>
                </div>
                {selectedLog.record_id && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Resource ID</p>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {selectedLog.record_id}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">User ID</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {selectedLog.user_id || "System"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Timestamp</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(selectedLog.created_at)}
                    </p>
                  </div>
                </div>
                {selectedLog.ip_address && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">IP Address</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedLog.ip_address}
                      </p>
                    </div>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="flex items-start gap-3">
                    <Monitor className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">User Agent</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {selectedLog.user_agent}
                      </p>
                    </div>
                  </div>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Metadata</p>
                      <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
