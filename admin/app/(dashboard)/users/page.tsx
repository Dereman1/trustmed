"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Stethoscope,
  Building2,
  Shield,
  Search,
  RefreshCw,
  Mail,
  Calendar,
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
import { getUsers, type AdminUser } from "@/lib/admin";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers(500);
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.fullName?.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "patient":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <UserCheck className="h-3 w-3 mr-1" />
            Patient
          </Badge>
        );
      case "provider":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
            <Stethoscope className="h-3 w-3 mr-1" />
            Provider
          </Badge>
        );
      case "facility":
        return (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            <Building2 className="h-3 w-3 mr-1" />
            Facility
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const roleStats = {
    all: users.length,
    patient: users.filter((u) => u.role === "patient").length,
    provider: users.filter((u) => u.role === "provider").length,
    facility: users.filter((u) => u.role === "facility").length,
    admin: users.filter((u) => u.role === "admin").length,
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
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all users registered in the system
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-all ${
            roleFilter === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setRoleFilter("all")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold text-foreground">{roleStats.all}</p>
                <p className="text-xs text-muted-foreground">All Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            roleFilter === "patient" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setRoleFilter("patient")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold text-foreground">{roleStats.patient}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            roleFilter === "provider" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setRoleFilter("provider")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xl font-bold text-foreground">{roleStats.provider}</p>
                <p className="text-xs text-muted-foreground">Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            roleFilter === "facility" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setRoleFilter("facility")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xl font-bold text-foreground">{roleStats.facility}</p>
                <p className="text-xs text-muted-foreground">Facilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            roleFilter === "admin" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setRoleFilter("admin")}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold text-foreground">{roleStats.admin}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Directory
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No users found matching your criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {user.fullName || "No name"}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {user.email || "No email"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {user.email || "No email"}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
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

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Name</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.fullName || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Role</p>
                    <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Created On</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedUser.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-0.5 text-muted-foreground font-mono text-xs">#</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">User ID</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {selectedUser.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
