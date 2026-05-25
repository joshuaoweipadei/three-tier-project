import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, Briefcase, Star } from "lucide-react";
import { useNotificationStore, type Notification } from "@/stores/notification-store";
import { useWebSocket } from "@/hooks/use-web-socket";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/auth-store";

// ─── Icon per notification type
function NotificationIcon({ type }: { type: string }) {
  const props = { className: "w-4 h-4 flex-shrink-0", "aria-hidden": true as const };

  switch (type) {
    case "NEW_APPLICATION":          return <Briefcase   {...props} className="w-4 h-4 flex-shrink-0 text-brand-500" />;
    case "APPLICATION_STATUS_CHANGED":
      return <Star {...props} className="w-4 h-4 flex-shrink-0 text-purple-500" />;
    default: return <Bell {...props} className="w-4 h-4 flex-shrink-0 text-gray-400" />;
  }
}

// ─── Single notification row
function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const timeAgo = (dateStr: string) => {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "Just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={clsx(
        "w-full text-left px-4 py-3 flex items-start gap-3",
        "hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
        !notification.read && "bg-brand-50"
      )}
    >
      <div className="mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx(
          "text-sm leading-snug",
          notification.read ? "text-gray-600" : "text-gray-900 font-medium"
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span
          className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5"
          aria-label="Unread"
        />
      )}
    </button>
  );
}

// ─── Main component
export default function NotificationBell() {
  const { isAuthenticated }                                    = useAuthStore();
  const { notifications, unreadCount, addNotification, markRead, markAllRead, clearNotifications } =
    useNotificationStore();
  const { onMessage, isConnected }                             = useWebSocket();
  const [open, setOpen]                                        = useState(false);
  const panelRef                                               = useRef<HTMLDivElement>(null);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (["NEW_APPLICATION", "APPLICATION_STATUS_CHANGED"].includes(msg.type)) {
        addNotification({ type: msg.type, message: msg.message, data: msg.data });
      }
    });
    return unsub;
  }, [onMessage, addNotification]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100
                   hover:text-gray-700 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                       bg-red-500 text-white text-[10px] font-bold rounded-full
                       flex items-center justify-center px-1"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Live connection indicator */}
        <span
          className={clsx(
            "absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full",
            isConnected ? "bg-green-400" : "bg-gray-300"
          )}
          title={isConnected ? "Connected" : "Disconnected"}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-xl border
                     border-gray-200 shadow-lg z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">
              Notifications
            </h2>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-600
                             hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50
                             transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={(id) => {
                    markRead(id);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end">
              <button
                onClick={clearNotifications}
                className="text-xs text-gray-400 hover:text-red-500
                           transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}