import { Bell, BellDot } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getNotifications, markAsRead } from "@/features/notification/services/notification.services"
import { connectNotificationSocket, disconnectNotificationSocket } from "@/features/notification/services/notification.ws"

export function NotificationCard({ message, status, createdAt }) {
  const isUnread = status === "UNREAD";

  return (
    <Card
      className={`
        flex items-start gap-3 p-4 transition
        hover:bg-muted/50
        ${isUnread ? "bg-muted/80" : "bg-background"}
      `}
    >
      <div className="mt-0.5 shrink-0">
        {isUnread ? (
          <BellDot className="h-4 w-4 text-primary" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <p
          className={`text-sm leading-snug ${
            isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>

        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(createdAt)}
        </span>
      </div>
    </Card>
  );
}

export function NotificationDropdown() {
  const token = useSelector((state) => state.auth.token);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const btnRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === "UNREAD").length,
    [notifications]
  );

  useEffect(() => {
    if (!open) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await getNotifications();
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [open]);

  const handleClose = useCallback(async () => {
    setOpen(false);

    const hasUnread = notifications.some((n) => n.status === "UNREAD");
    if (!hasUnread) return;

    try {
      await markAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  }, [notifications]);

  useEffect(() => {
    if (!token) return;

    connectNotificationSocket({
      token,
      onNotification: (n) => {
        setNotifications((prev) => {
          const exists = prev.some(
            (x) => x.notificationId === n.notificationId
          );

          if (!exists && n.status === "UNREAD") {
            toast("New notification", {
              description: n.message,
              duration: 3000,
            });
          }

          const next = exists ? prev : [n, ...prev];
          return next.slice(0, 10);
        });
      },
    });

    return () => {
      disconnectNotificationSocket();
    };
  }, [token]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const [pos, setPos] = useState({ top: 0, right: 0, width: 360 });

  useEffect(() => {
    if (!open) return;

    const compute = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();

      const width = 360;
      const top = r.bottom + 8;
      const right = Math.max(12, window.innerWidth - r.right);

      setPos({ top, right, width });
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);

    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  return (
    <>
      <div className={open ? "relative z-10000" : "relative z-50"}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={btnRef}
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => {
                  if (open) handleClose();
                  else setOpen(true);
                }}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-9998 bg-black/20 backdrop-blur-sm"
              onClick={handleClose}
            />

            <div
              className="fixed z-9999 rounded-xl border bg-card shadow-xl"
              style={{ top: pos.top, right: pos.right, width: pos.width }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b px-4 py-3">
                <h4 className="text-sm font-semibold">Notifications</h4>
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-2 p-2">
                  {loading && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Loading...
                    </p>
                  )}

                  {!loading &&
                    notifications.map((n) => (
                      <NotificationCard
                        key={n.notificationId}
                        message={n.message}
                        status={n.status}
                        createdAt={n.createdAt}
                      />
                    ))}
                </div>
              </ScrollArea>

              {!loading && notifications.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </p>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
