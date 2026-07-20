import { useEffect, useMemo, useState } from "react";
import {
  Send,
  Plus,
  List,
  CheckCircle2,
  XCircle,
  MoveDownLeft,
  MoveUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SendRequestForm } from "./SendRequestForm";
import {
  cancelPaymentRequestApi,
  getAllPaymentRequestApi,
  respondToPaymentRequestApi,
} from "../services/payment-request.services";

export function SendRequestCard() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchReceived = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await getAllPaymentRequestApi();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceived();
  }, []);

  const RequestTypeIcon = ({ type }) => {
    const t = String(type || "").toUpperCase();

    if (t === "RECEIVED") {
      return <MoveDownLeft className="h-4 w-4 text-red-500 shrink-0" />;
    }

    if (t === "SENT") {
      return <MoveUpRight className="h-4 w-4 text-green-600 shrink-0" />;
    }

    return null;
  };

  const requestsInCard = useMemo(() => {
    if (!Array.isArray(requests) || requests.length === 0) return [];
    const activeUnpaid = requests.filter(
      (r) => r?.isActive && String(r?.status || "").toUpperCase() === "UNPAID",
    );
    const others = requests.filter(
      (r) =>
        !(r?.isActive && String(r?.status || "").toUpperCase() === "UNPAID"),
    );
    const combined = [...activeUnpaid, ...others];
    return combined.slice(0, 3);
  }, [requests]);

  const allRequests = requests;

  const badgeForStatus = (status) => {
    const s = String(status || "").toUpperCase();

    if (s === "UNPAID")
      return "mr-8 px-4 rounded-full gap-1.5 border-amber-600/40 bg-amber-600/10 text-amber-500 shadow-none hover:bg-amber-600/10 dark:bg-amber-600/20";

    if (s === "REJECTED")
      return "mr-8 rounded-full gap-1.5 border-red-600/40 bg-red-600/10 text-red-400 shadow-none hover:bg-red-600/10 dark:bg-red-600/30";

    if (s === "PAID")
      return "mr-8 px-6 rounded-full gap-1.5 border-emerald-600/40 bg-emerald-600/10 text-emerald-500 shadow-none hover:bg-emerald-600/10 dark:bg-emerald-600/20";

    if (s === "CANCELLED")
      return "mr-8 rounded-full gap-1.5 border-slate-500/40 bg-slate-500/10 text-slate-400 shadow-none hover:bg-slate-500/10 dark:bg-slate-500/20";

    return "mr-10 rounded-full gap-1.5 border-muted-foreground/30 bg-muted/40 text-muted-foreground shadow-none";
  };

  const canActOn = (r) =>
    String(r?.type || "").toUpperCase() === "RECEIVED" &&
    Boolean(r?.isActive) &&
    String(r?.status || "").toUpperCase() === "UNPAID";

  const canCancel = (r) =>
    String(r?.type || "").toUpperCase() === "SENT" && Boolean(r?.isActive);

  const handleRespond = async (r, status) => {
    const id = r?.requestId;
    if (!id) {
      setError("Backend response missing requestId. Add it to /received DTO.");
      return;
    }

    setError("");
    try {
      await respondToPaymentRequestApi({
        requestId: Number(id),
        status,
      });
      await fetchReceived();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update request");
    }
  };

  const handleCancel = async (r) => {
    const id = r?.requestId;
    if (!id) {
      setError("Backend response missing requestId.");
      return;
    }

    setError("");
    try {
      await cancelPaymentRequestApi({
        requestId: Number(id),
      });
      await fetchReceived();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel request");
    }
  };

  const RequestRow = ({ r, compact = false }) => {
    const isActive = Boolean(r?.isActive);
    const statusText = String(r?.status || "UNPAID").toUpperCase();
    const typeText = String(r?.type || "").toUpperCase();

    const titleClass = isActive
      ? "font-semibold"
      : "font-normal text-muted-foreground";
    const amountClass = isActive
      ? "font-semibold"
      : "font-normal text-muted-foreground";

    return (
      <div
        className={[
          "flex items-center justify-between gap-3",
          compact ? "mt-2" : "px-2 py-3 hover:bg-muted/30 transition-colors",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <RequestTypeIcon type={r.type} />
            <span className={`${titleClass} truncate`}>{r.name || "-"}</span>
          </div>

          <div className={`mt-1 text-sm text-foreground/90 ${amountClass}`}>
            ₹ {Number(r.amount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={badgeForStatus(r.status)}>
            {statusText}
          </Badge>

          {typeText === "RECEIVED" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 px-5 text-green-700 hover:bg-green-700 hover:text-gray-50"
                onClick={() => handleRespond(r, "PAID")}
                disabled={!canActOn(r)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Paid
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-red-600 hover:bg-red-500"
                onClick={() => handleRespond(r, "REJECTED")}
                disabled={!canActOn(r)}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          {typeText === "SENT" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-red-600 hover:bg-red-500 ml-22"
              onClick={() => handleCancel(r)}
              disabled={!canCancel(r)}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  const RequestRowReadOnly = ({ r, compact = false }) => {
    const isActive = Boolean(r?.isActive);
    const statusText = String(r?.status || "UNPAID").toUpperCase();

    const titleClass = isActive
      ? "font-semibold"
      : "font-normal text-muted-foreground";
    const amountClass = isActive
      ? "font-semibold"
      : "font-normal text-muted-foreground";

    return (
      <div
        className={[
          "flex items-center justify-between gap-3",
          compact ? "mt-2" : "px-2 py-3 hover:bg-muted/30 transition-colors",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <RequestTypeIcon type={r.type} />
            <span className={`${titleClass} truncate`}>{r.name || "-"}</span>
          </div>

          <div className={`mt-1 text-sm text-foreground/90 ${amountClass}`}>
            ₹ {Number(r.amount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={badgeForStatus(r.status).replace(/mr-\d+/, "mr-1")}
          >
            {statusText}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-60 rounded-2xl border bg-card p-6 shadow-sm relative card-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Send className="h-5 w-5 text-muted-foreground" />
            <span className="text-md font-medium">Request Money</span>
          </div>
          <div className="space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 border-none p-2"
                  onClick={() => setShowNew(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="center" side="top">
                <p>New request</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 border-none p-2"
                  onClick={() => setShowAll(true)}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="center" side="top">
                <p>View all</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {error ? (
          <p className="text-xs text-red-600 font-medium mt-3">{error}</p>
        ) : null}

        <div className="mt-5 p-3 px-4">
          {loading ? (
            <p className="text-sm text-muted-foreground px-45">Loading...</p>
          ) : requestsInCard.length === 0 ? (
            <p className="text-sm text-muted-foreground px-45 ">
              No received requests yet
            </p>
          ) : (
            <div className="flex flex-col">
              {requestsInCard.map((r, idx) => (
                <div
                  key={`${r.requestId}-${idx}`}
                  className={idx === 0 ? "pt-2 pb-2" : "py-2"}
                >
                  <RequestRowReadOnly r={r} compact />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute right-5 bottom-5 flex gap-2"></div>
      </div>

      <SendRequestForm
        open={showNew}
        onClose={() => setShowNew(false)}
        onSuccess={async () => {
          await fetchReceived();
        }}
      />

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm p-3">
          <div
            className="
              w-full max-w-140 md:max-w-140
              h-[92vh] md:h-[85vh]
              rounded-2xl border bg-card p-6 shadow-xl
              relative animate-in scale-in duration-200
              flex flex-col
            "
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowAll(false)}
              className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
            >
              <span className="sr-only">Close</span>✕
            </Button>

            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <List className="h-5 w-5" />
              <span className="text-md font-medium">All Requests</span>
            </div>

            {error ? (
              <p className="text-xs text-red-600 font-medium mb-3">{error}</p>
            ) : null}

            <div className="rounded-xl flex-1 min-h-0">
              <ScrollArea className="h-full w-full **:data-radix-scroll-area-scrollbar:hidden">
                <div className="flex flex-col divide-y">
                  {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : allRequests.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No requests found
                    </div>
                  ) : (
                    allRequests.map((r, idx) => (
                      <div key={`${r.requestId}-${idx}`} className="py-2">
                        <RequestRow r={r} />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </>
  );
}