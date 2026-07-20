import {
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  RefreshCcw,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAdminKycUpgradeDocumentApi,
  getAdminPendingKycUpgradesApi,
  reviewKycUpgradeApi,
} from "@/features/kyc/services/kyc.services";

export function AdminKycTrackingCard({ open, onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documentLoadingUserId, setDocumentLoadingUserId] = useState(null);
  const [reviewingAction, setReviewingAction] = useState({
    userId: null,
    status: null,
  });

  const hasRequests = useMemo(() => requests.length > 0, [requests]);

  const loadPendingRequests = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAdminPendingKycUpgradesApi();
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to load pending KYC requests", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to load pending KYC requests.",
        { position: "bottom-right", duration: 3000 },
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadPendingRequests();
  }, [open, loadPendingRequests]);

  const getDisplayName = (request) => {
    const fullName =
      [request?.firstName, request?.lastName].filter(Boolean).join(" ") ||
      request?.fullName;

    return fullName || request?.email || `User #${request?.userId}`;
  };

  const getPdfBlob = async (userId) => {
    const response = await getAdminKycUpgradeDocumentApi(userId);
    return new Blob([response.data], { type: "application/pdf" });
  };

  const handleViewDocument = async (userId) => {
    try {
      setDocumentLoadingUserId(userId);

      const blob = await getPdfBlob(userId);
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error("Failed to open KYC document", error);
      toast.error(
        error?.response?.data?.message || "Failed to open KYC document.",
        { position: "bottom-right", duration: 3000 },
      );
    } finally {
      setDocumentLoadingUserId(null);
    }
  };

  const handleDownloadDocument = async (userId) => {
    try {
      setDocumentLoadingUserId(userId);

      const blob = await getPdfBlob(userId);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `kyc-document-${userId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download KYC document", error);
      toast.error(
        error?.response?.data?.message || "Failed to download KYC document.",
        { position: "bottom-right", duration: 3000 },
      );
    } finally {
      setDocumentLoadingUserId(null);
    }
  };

  const handleReview = async (userId, kycStatus) => {
    try {
      setReviewingAction({ userId, status: kycStatus });

      await reviewKycUpgradeApi({
        userId,
        kycStatus,
      });

      toast.success(
        kycStatus === "APPROVED"
          ? "KYC request approved successfully."
          : "KYC request rejected successfully.",
        { position: "bottom-right", duration: 3000 },
      );

      await loadPendingRequests(true);
    } catch (error) {
      console.error("Failed to review KYC request", error);
      toast.error(
        error?.response?.data?.message || "Failed to review KYC request.",
        { position: "bottom-right", duration: 3000 },
      );
    } finally {
      setReviewingAction({ userId: null, status: null });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden items-center justify-center overscroll-none bg-background/25  p-4 backdrop-blur-sm">
      <Card className="relative flex h-120 max-h-[90vh] w-[96%] max-w-150 flex-col overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="mt-6 shrink-0 text-center">
          <CardTitle className="text-xl">KYC Requests</CardTitle>
          <CardDescription>
            Review pending KYC upgrade requests.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col px-6 pb-6">
          <div className="mb-6 flex shrink-0 justify-end">
            <Button
              variant="ghost"
              onClick={() => loadPendingRequests(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCcw />
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading pending KYC requests...
            </div>
          ) : !hasRequests ? (
            <Card className="flex-1">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No pending KYC requests found.
              </CardContent>
            </Card>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-md overscroll-contain">
              <ScrollArea
                className="h-full w-full overscroll-contain"
                onWheelCapture={(event) => event.stopPropagation()}
              >
                <div className="flex flex-col gap-4 pr-1">
                  {requests.map((request) => {
                    const isDocumentLoading =
                      documentLoadingUserId === request.userId;
                    const isApproving =
                      reviewingAction.userId === request.userId &&
                      reviewingAction.status === "APPROVED";
                    const isRejecting =
                      reviewingAction.userId === request.userId &&
                      reviewingAction.status === "REJECTED";
                    const isReviewing =
                      reviewingAction.userId === request.userId;

                    return (
                      <Card key={request.userId}>
                        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {getDisplayName(request)}
                            </CardTitle>

                            {request?.email && (
                              <CardDescription>{request.email}</CardDescription>
                            )}

                            <p className="text-sm text-muted-foreground">
                              User ID: {request.userId}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className="mt-2 border-yellow-600 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300"
                          >
                            {request?.kycStatus || "PENDING"}
                          </Badge>
                        </CardHeader>

                        <CardContent>
                          <div className="flex flex-wrap gap-3">
                            <Button
                              variant="outline"
                              onClick={() => handleViewDocument(request.userId)}
                              disabled={isDocumentLoading || isReviewing}
                              className="gap-2"
                            >
                              {isDocumentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              View PDF
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() =>
                                handleDownloadDocument(request.userId)
                              }
                              disabled={isDocumentLoading || isReviewing}
                              className="gap-2"
                            >
                              {isDocumentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Download
                            </Button>

                            <Button
                              onClick={() =>
                                handleReview(request.userId, "APPROVED")
                              }
                              disabled={isReviewing || isDocumentLoading}
                              className="ml-6 gap-2 bg-white text-green-600 hover:bg-green-500 hover:text-white"
                            >
                              {isApproving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Accept
                            </Button>

                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleReview(request.userId, "REJECTED")
                              }
                              disabled={isReviewing || isDocumentLoading}
                              className="gap-2 bg-white text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              {isRejecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>

              {requests.length > 1 ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-background to-transparent" />
                  <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
                    <div className="bg-background/70 shadow-sm backdrop-blur">
                      <ChevronDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
