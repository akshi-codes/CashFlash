import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { X, Loader2, Users, RefreshCw } from "lucide-react";
import {
  activateUserApi,
  deactivateUserApi,
  getAllUsersApi,
} from "../services/admin.services";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function formatInstant(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function renderText(value) {
  return value ?? "-";
}

export default function AdminUsersTableCard({ onClose }) {
  const currentUser = useSelector((state) => state.auth.user);
  const isCurrentUserAdmin = currentUser?.role === "ADMIN";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const first = a?.userId ?? 0;
      const second = b?.userId ?? 0;
      return first - second;
    });
  }, [users]);

  const loadUsers = async (isRefresh = false) => {
    try {
      setError("");
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAllUsersApi();
      setUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load admin users.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleUserStatus = async (selectedUser) => {
    const isAdminRow = selectedUser?.role === "ADMIN";

    if (
      !selectedUser?.userId ||
      actionUserId ||
      (isCurrentUserAdmin && isAdminRow)
    ) {
      return;
    }

    try {
      setActionUserId(selectedUser.userId);
      setError("");

      if (selectedUser.isActive) {
        const response = await deactivateUserApi({
          userId: selectedUser.userId,
        });
        if (response?.data?.isDeactivated === true) {
          setUsers((prev) =>
            prev.map((item) =>
              item.userId === selectedUser.userId
                ? { ...item, isActive: false }
                : item,
            ),
          );
        }
      } else {
        const response = await activateUserApi({ userId: selectedUser.userId });
        if (response?.data?.isActivated === true) {
          setUsers((prev) =>
            prev.map((item) =>
              item.userId === selectedUser.userId
                ? { ...item, isActive: true }
                : item,
            ),
          );
        }
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to update user status.",
      );
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-10000 flex overflow-hidden items-center justify-center overscroll-none bg-background/25 p-4 backdrop-blur-sm">
      <div
        className="relative flex h-11/12 w-full max-w-screen-2xl flex-col rounded-2xl border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute right-4 top-4 text-red-600 hover:bg-red-500"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="mb-4 flex items-center justify-between gap-3 pr-12">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">All Users</h2>
            <Badge variant="outline" className="ml-3 px-3 py-2">
              {sortedUsers.length}
            </Badge>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="none"
                    onClick={() => loadUsers(true)}
                    disabled={loading || refreshing || actionUserId !== null}
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-10000">
                <p>Refresh users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
              </div>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="min-w-max">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur">
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        User ID
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Profile Image
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Full Name
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Email
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Phone Number
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        KYC Status
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Payment ID
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-4 py-3 text-left font-semibold text-foreground">
                        Created At
                      </TableHead>
                      <TableHead className="sticky right-72 z-30 min-w-28 bg-muted/95 px-4 py-3 text-left font-semibold whitespace-nowrap text-foreground">
                        Role
                      </TableHead>
                      <TableHead className="sticky right-40 z-30 min-w-32 bg-muted/95 px-4 py-3 text-left font-semibold whitespace-nowrap text-foreground">
                        Active
                      </TableHead>
                      <TableHead className="sticky right-0 z-30 min-w-40 bg-muted/95 px-4 py-3 text-left font-semibold whitespace-nowrap text-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedUsers.map((tableUser) => {
                      const isRowLoading = actionUserId === tableUser.userId;
                      const isAdminRow =
                        isCurrentUserAdmin && tableUser.role === "ADMIN";

                      return (
                        <TableRow
                          key={tableUser.userId}
                          className={`group hover:bg-muted/40 ${
                            isAdminRow ? "opacity-60" : ""
                          }`}
                        >
                          <TableCell className="whitespace-nowrap px-4 py-3">
                            {renderText(tableUser.userId)}
                          </TableCell>

                          <TableCell className="px-4 pl-8">
                            {tableUser.profileImageUrl ? (
                              <img
                                src={tableUser.profileImageUrl}
                                alt={tableUser.fullName || "Profile"}
                                className="h-10 w-10 rounded-full border object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            {renderText(tableUser.fullName)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap px-4 py-3">
                            {renderText(tableUser.email)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap px-4 py-3">
                            {renderText(tableUser.phoneNumber)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                tableUser.kycStatus == "APPROVED"
                                  ? "border-green-600 px-5 text-green-600 dark:border-green-400 dark:text-green-400"
                                  : "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                              }
                            >
                              {tableUser.kycStatus == "APPROVED"
                                ? "APPROVED"
                                : "UNAPPROVED"}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            <span
                              className="inline-block max-w-44 truncate"
                              title={tableUser.paymentId || "-"}
                            >
                              {renderText(tableUser.paymentId)}
                            </span>
                          </TableCell>

                          <TableCell className="whitespace-nowrap px-4 py-3">
                            {formatInstant(tableUser.createdAt)}
                          </TableCell>

                          <TableCell className="sticky right-72 z-10 min-w-28 bg-card px-4 py-3 group-hover:bg-muted/40">
                            <Badge variant="secondary">
                              {renderText(tableUser.role)}
                            </Badge>
                          </TableCell>

                          <TableCell className="sticky right-40 z-10 min-w-32 bg-card px-4 py-3 group-hover:bg-muted/40">
                            <Badge
                              variant="outline"
                              className={
                                tableUser.isActive
                                  ? "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                                  : "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                              }
                            >
                              {tableUser.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>

                          <TableCell className="sticky right-0 z-10 min-w-40 bg-card px-4 py-3 group-hover:bg-muted/40">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                tableUser.isActive ? "destructive" : "default"
                              }
                              onClick={() => handleToggleUserStatus(tableUser)}
                              disabled={isRowLoading || isAdminRow}
                              className={
                                tableUser.isActive
                                  ? "min-w-20 bg-red-700"
                                  : "bg-green-600 px-5"
                              }
                            >
                              {isRowLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {tableUser.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
