import React from "react";
import {
  Sparkles,
  X,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RecommendationCard = ({
  open,
  onClose,
  onRefresh,
  recommendation,
  loading,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="primary"
                  onClick={onRefresh}
                  disabled={loading}
                  className="absolute right-12 top-3"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>

              <TooltipContent
                side="top"
                className="z-120"
              >
                <p>{loading ? "Refreshing..." : "Refresh"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute right-3 top-3 text-red-600 hover:bg-red-500"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="mb-5 flex items-center gap-3 pr-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                CashFlash Recommendation
              </h2>
              <p className="text-xs text-muted-foreground">
                Smart payment suggestions for you
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-muted/30 p-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl" />

            {loading ? (
              <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                <p className="text-sm text-muted-foreground">
                  Generating recommendation...
                </p>
              </div>
            ) : (
              <div className="relative min-h-44">
                <div className="mb-4 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <h3 className="mb-2 text-xl font-semibold tracking-tight">
                  {recommendation?.title || "Payment Recommendation"}
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  {recommendation?.message ||
                    "Keep your wallet, PIN, and bank details updated for smoother and safer payments."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;