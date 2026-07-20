import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { getLastTransaction } from "@/features/transaction/services/transaction.services";
import { ArrowUpRight, Handshake, RefreshCcw, ScanQrCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import QrReader from "@/features/qr/components/QrScanner";
import { SendMoneyCard } from "@/features/wallet/components/SendMoneyCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CountUp from "@/components/shared/CountUp";
import { useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function PaymentServiceCard({
  onWalletChanged,
  showPastTransactionsArrow,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const [loadingTxn, setLoadingTxn] = useState(true);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showSendCard, setShowSendCard] = useState(false);

  const user = useSelector((state) => state.auth.user);

  const fetchLastTxn = useCallback(async () => {
    try {
      setLoadingTxn(true);
      const res = await getLastTransaction();
      setLastTxn(res.data ?? null);
    } catch {
      setLastTxn(null);
    } finally {
      setLoadingTxn(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLastTxn();
    setRefreshing(false);
  }, [fetchLastTxn]);

  useEffect(() => {
    fetchLastTxn();
  }, [fetchLastTxn]);

  useEffect(() => {
    if (showPastTransactionsArrow) {
      handleRefresh();
    }
  }, [showPastTransactionsArrow, handleRefresh]);

  const displayAmount =
    user?.role === "MERCHANT"
      ? (lastTxn?.finalAmount ?? lastTxn?.amount ?? 0)
      : (lastTxn?.amount ?? 0);

  const statusToneClassName =
    lastTxn?.status === "SUCCESSFUL"
      ? "text-green-600 dark:text-green-400"
      : lastTxn?.status === "FAILED"
        ? "text-red-600 dark:text-red-400"
        : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="relative rounded-xl border bg-card p-6 shadow-sm card-glow">
      {showPastTransactionsArrow && (
        <div className="pointer-events-none absolute top-20 right-28 z-20">
          {/* Light mode */}
          <div className="block dark:hidden">
            <DotLottieReact
              src="/animations/arrow-black.lottie"
              autoplay
              loop
              className="h-20 w-20"
            />
          </div>

          {/* Dark mode */}
          <div className="hidden dark:block">
            <DotLottieReact
              src="/animations/arrow-white.lottie"
              autoplay
              loop
              className="h-20 w-20"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Handshake className="h-5 w-5" />
          <span className="text-md font-medium">My Payments</span>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Refresh</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 space-y-1">
        {loadingTxn ? (
          <p className="text-sm py-4 text-muted-foreground">
            Fetching latest payment...
          </p>
        ) : lastTxn ? (
          <>
            <div className="flex gap-3 text-2xl font-semibold tracking-tight">
              <div className="font-semibold tracking-tight w-32">
                ₹ <span></span>
                <CountUp
                  from={0}
                  to={displayAmount}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                  startCounting={false}
                />
              </div>
              <Badge
                variant="outline"
                className={`border-none text-sm font-medium ${
                  lastTxn.direction === "SELF-TRANSFER"
                    ? " text-yellow-600"
                    : lastTxn.direction === "SENT"
                      ? "text-red-600"
                      : "text-green-600"
                }`}
              >
                {lastTxn.direction === "SELF-TRANSFER"
                  ? "Self-transfer"
                  : lastTxn.direction === "SENT"
                    ? "Sent"
                    : "Received"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(lastTxn.timestamp)} ·{" "}
              <span className={statusToneClassName}>{lastTxn.status}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No recent payments
          </p>
        )}
      </div>

      <div className="mt-6 justify-end hidden min-[1140px]:flex max-sm:flex gap-2">
        <Button
          size="sm"
          onClick={() => setShowSendCard(true)}
          className="flex items-center gap-2 w-30"
        >
          <ArrowUpRight className="h-4 w-4" />
          Send
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowQrScanner(true)}
          className="flex items-center gap-2  sm:col-span-1 col-span-2"
        >
          <ScanQrCode className="h-4 w-4" />
          Scan & Pay
        </Button>
      </div>

      {showSendCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
          <SendMoneyCard
            onClose={() => setShowSendCard(false)}
            onWalletChanged={onWalletChanged}
          />
        </div>
      )}

      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
          <QrReader onClose={() => setShowQrScanner(false)} />
        </div>
      )}
    </div>
  );
}
