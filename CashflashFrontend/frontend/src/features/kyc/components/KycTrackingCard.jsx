import {
  Download,
  Eye,
  Loader2,
  RefreshCcw,
  UploadCloud,
  X,
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
import KycUpgradeCard from "./KycUpgradeCard";
import { getKycUpgradeDocumentApi, getKycUpgradeStatusApi } from "../services/kyc.services";

export function KycTrackingCard({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [showUploadCard, setShowUploadCard] = useState(false);

  const canReupload = status === "NOT_SUBMITTED" || status === "REJECTED";

  const hasDocument =
    status === "PENDING" || status === "APPROVED" || status === "REJECTED";

  const badgeClassName = useMemo(() => {
    switch (status) {
      case "APPROVED":
        return "border-green-600 text-green-700 dark:border-green-500 dark:text-green-300";
      case "PENDING":
        return "border-yellow-600 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300";
      case "REJECTED":
        return "border-red-600 text-red-700 dark:border-red-500 dark:text-red-300";
      default:
        return "border-muted-foreground/40 text-muted-foreground";
    }
  }, [status]);

  const statusDescription = useMemo(() => {
    switch (status) {
      case "APPROVED":
        return "Your KYC has been approved.";
      case "PENDING":
        return "Your uploaded document is under admin review.";
      case "REJECTED":
        return "Your KYC was rejected, upload a new PDF.";
      case "NOT_SUBMITTED":
      default:
        return "You have not uploaded any KYC document yet.";
    }
  }, [status]);

  const cleanupDocumentUrl = useCallback(() => {
    setDocumentUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const checkHasDocument = (nextStatus) => {
    return (
      nextStatus === "PENDING" ||
      nextStatus === "APPROVED" ||
      nextStatus === "REJECTED"
    );
  };

  const loadDocument = useCallback(
    async (nextStatus) => {
      if (!checkHasDocument(nextStatus)) {
        cleanupDocumentUrl();
        return;
      }

      try {
        setDocumentLoading(true);

        const response = await getKycUpgradeDocumentApi();
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setDocumentUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (error) {
        cleanupDocumentUrl();
        console.error("Failed to load KYC document", error);
      } finally {
        setDocumentLoading(false);
      }
    },
    [cleanupDocumentUrl],
  );

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getKycUpgradeStatusApi();
      const nextStatus = response.data?.kycStatus || "NOT_SUBMITTED";
      setStatus(nextStatus);

      await loadDocument(nextStatus);
    } catch (error) {
      console.error("Failed to load KYC status", error);
      toast.error(
        error?.response?.data?.message || "Failed to load KYC status.",
        { position: "bottom-right", duration: 3000 },
      );
    } finally {
      setLoading(false);
    }
  }, [loadDocument]);

  useEffect(() => {
    if (!open) return;

    loadPage();

    return () => {
      cleanupDocumentUrl();
    };
  }, [open, loadPage, cleanupDocumentUrl]);

  const handleOpenDocument = () => {
    if (!documentUrl || !hasDocument) return;
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDocument = () => {
    if (!documentUrl || !hasDocument) return;

    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = "kyc-document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex overflow-hidden items-center justify-center overscroll-none bg-background/25  backdrop-blur-sm">
        <Card className="relative w-[96%] h-120 max-w-130 max-h-[90vh] overflow-y-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="text-center mt-6">
            <CardTitle className="text-xl">KYC Tracking</CardTitle>
            <CardDescription>
              Track your KYC status and view your uploaded document.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 mt-10 px-6 pb-6">
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading KYC tracking...
              </div>
            ) : (
              <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Current Status{" "}
                      <span className="ml-4">
                        <Badge variant="outline" className={badgeClassName}>
                          {status || "NOT_SUBMITTED"}
                        </Badge>
                      </span>
                    </CardTitle>
                    <CardDescription>{statusDescription}</CardDescription>
                  </div>
                  <Button variant="ghost" onClick={loadPage}>
                    <RefreshCcw />
                  </Button>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-3 mt-31">
                    <Button
                      variant="outline"
                      onClick={handleOpenDocument}
                      disabled={!hasDocument || !documentUrl || documentLoading}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View PDF
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleDownloadDocument}
                      disabled={!hasDocument || !documentUrl || documentLoading}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>

                    <Button
                      onClick={() => setShowUploadCard(true)}
                      disabled={!canReupload}
                      className="gap-2 ml-13"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {status === "REJECTED" ? "Redo" : "Upload"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {showUploadCard && (
        <KycUpgradeCard
          onSuccess={async () => {
            setShowUploadCard(false);
            await loadPage();
          }}
        />
      )}
    </>
  );
}
