import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { getNotifications } from "@/features/notification/services/notification.services";
import { Button } from "../../../components/ui/button";

const NotificationCard = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden items-center justify-center overscroll-none bg-background/25  backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl rounded-3xl border bg-background/95 shadow-2xl">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                View your latest account activity
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-128 overflow-y-auto no-scrollbar px-4 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading notifications…
            </p>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed">
              <Bell className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No notifications found</p>
              <p className="text-xs text-muted-foreground">
                Your recent updates will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`rounded-2xl border p-4 transition hover:bg-muted/40 ${
                    notification.status === "UNREAD"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 gap-3">
                      <div
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          notification.status === "UNREAD"
                            ? "bg-blue-500"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-6 text-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        notification.status === "UNREAD"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {notification.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
