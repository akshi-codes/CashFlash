import { CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadKycUpgradeApi } from "@/features/kyc/services/kyc.services"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function KycUpgradeCard({ onSuccess }) {
  const [uploadState, setUploadState] = useState({
    file: null,
    progress: 0,
    uploading: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const maxFileSize = 5 * 1024 * 1024;

  const statusText = useMemo(() => {
    if (uploadState.uploading) return "Uploading...";
    if (uploadState.progress === 100) return "Upload complete";
    return "Click to upload";
  }, [uploadState.uploading, uploadState.progress]);

  const isPdfFile = (file) => {
    if (!file) return false;
    const lowerName = file.name?.toLowerCase() || "";
    return file.type === "application/pdf" || lowerName.endsWith(".pdf");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const resetFile = () => {
    setUploadState({
      file: null,
      progress: 0,
      uploading: false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = (file) => {
    if (!file) return;

    if (!isPdfFile(file)) {
      toast.error("Please upload a PDF file.", {
        position: "bottom-right",
        duration: 3000,
      });
      return;
    }

    if (file.size > maxFileSize) {
      toast.error("PDF size must be 5MB or less.", {
        position: "bottom-right",
        duration: 3000,
      });
      return;
    }

    setShowSuccess(false);
    setUploadState({
      file,
      progress: 0,
      uploading: false,
    });
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!uploadState.file || uploadState.uploading) return;

    const formData = new FormData();
    formData.append("file", uploadState.file);

    let timer;

    try {
      setUploadState((prev) => ({
        ...prev,
        uploading: true,
        progress: 15,
      }));

      timer = setInterval(() => {
        setUploadState((prev) => {
          if (!prev.uploading) {
            clearInterval(timer);
            return prev;
          }

          const next = Math.min(prev.progress + 12, 90);

          return {
            ...prev,
            progress: next,
          };
        });
      }, 250);

      await uploadKycUpgradeApi(formData);

      clearInterval(timer);

      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        progress: 100,
      }));

      setShowSuccess(true);

      toast.success("KYC PDF uploaded successfully.", {
        position: "bottom-right",
        duration: 3000,
      });
    } catch (error) {
      clearInterval(timer);

      const message =
        error?.response?.data?.message || "Failed to upload KYC PDF.";

      console.error("KYC upload response:", error?.response?.data);

      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        progress: 0,
      }));

      toast.error(message, {
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="relative w-[95%] max-w-110 h-150 overflow-hidden">
        {showSuccess && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                KYC PDF Uploaded
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Your document has been submitted successfully and is now pending
                admin review.
              </p>

              <div className="mt-5 flex justify-center">
                <Button
                  type="button"
                  onClick={() => {
                    setShowSuccess(false);
                    onSuccess?.();
                  }}
                  className="min-w-28"
                >
                  Okay
                </Button>
              </div>
            </div>
          </div>
        )}

        <CardHeader className="text-center mt-4">
          <CardTitle className="text-xl">Complete your KYC</CardTitle>
          <CardDescription>
            Upload your KYC document as a PDF.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6  mt-10">
          <form onSubmit={handleUpload} className="space-y-5">
            <div
              className="flex min-h-52 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 transition hover:bg-muted/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  <UploadCloud className="h-7 w-7 text-muted-foreground" />
                </div>

                <p className="text-sm text-muted-foreground">
                  Drag and drop your PDF here or{" "}
                  <span className="font-medium text-primary hover:underline">
                    choose file
                  </span>
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Accepted file type: PDF • Max size: 5MB
                </p>
              </div>
            </div>

            {uploadState.file && (
              <Card className="relative gap-4 rounded-xl border-border/60 bg-muted/50 p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={resetFile}
                  disabled={uploadState.uploading}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border">
                    <FileText className="h-5 w-5 text-foreground" />
                  </span>

                  <div className="min-w-0 flex-1 pr-8">
                    <p className="truncate text-sm font-medium text-foreground">
                      {uploadState.file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatFileSize(uploadState.file.size)}
                    </p>
                  </div>

                  {uploadState.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Progress value={uploadState.progress} className="h-2" />
                  <span className="min-w-12 text-right text-xs text-muted-foreground">
                    {uploadState.progress}%
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">{statusText}</p>
              </Card>
            )}

            <div className="absolute bottom-6 right-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetFile}
                disabled={!uploadState.file || uploadState.uploading}
              >
                Reset
              </Button>

              <Button
                type="submit"
                disabled={!uploadState.file || uploadState.uploading}
              >
                {uploadState.uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}