import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Tag, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { Notification } from "../types";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (id: string) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onSelectProduct,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time vibe
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const simulateNotification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/simulate", { method: "POST" });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "sale":
        return <Tag className="w-4 h-4 text-emerald-500" />;
      case "new-arrival":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "low-stock":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-md bg-[#0C0C0C] border-l border-white/10 text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500 animate-pulse" />
                <h2 className="text-base font-black text-white font-sans uppercase tracking-widest">
                  ALERT TELEMETRY
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black text-white bg-blue-600 rounded-none uppercase tracking-wide">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-white/50 hover:text-white rounded-none hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Actions */}
            <div className="flex gap-3 p-4 bg-[#111111] border-b border-white/10">
              <button
                onClick={markAllAsRead}
                className="flex-1 py-3 text-[10px] font-black text-center text-white/80 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 hover:text-white transition cursor-pointer uppercase tracking-wider"
              >
                Mark all as read
              </button>
              <button
                onClick={simulateNotification}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 flex-1 py-3 text-[10px] font-black text-white bg-blue-600 rounded-none hover:bg-blue-705 hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Simulate Push Alert
              </button>
            </div>

            {/* Notification Lists */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
                  <Bell className="w-8 h-8 text-white/10 mb-2 animate-bounce" />
                  <p className="text-xs uppercase tracking-widest font-black text-white/40">NO BRAODCAST LOG AVAILABLE</p>
                </div>
              ) : (
                notifications.map((not) => (
                  <div
                    key={not.id}
                    onClick={() => {
                      if (not.productId) {
                        onSelectProduct(not.productId);
                        onClose();
                      }
                    }}
                    className={`p-4 rounded-none border transition-all duration-300 ${
                      not.productId ? "cursor-pointer" : ""
                    } ${
                      not.read
                        ? "bg-[#111111]/40 border-white/5 text-white/55 hover:border-white/20"
                        : "bg-blue-900/10 border-blue-600/50 shadow-[0_0_15px_rgba(37,99,235,0.1)] text-white hover:border-blue-500"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 p-1.5 bg-[#0C0C0C] border border-white/10 rounded-none shrink-0 shadow-sm">
                        {getTypeIcon(not.type)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-black uppercase tracking-wider truncate ${not.read ? "text-white/70" : "text-white"}`}>
                            {not.title}
                          </h4>
                          {!not.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/50 uppercase tracking-wide font-sans">{not.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                            {new Date(not.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {not.productId && (
                            <span className="text-[9px] uppercase tracking-widest font-black text-blue-500 hover:underline">
                              VIEW DROP // LIVE &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-white/10 bg-[#111111]/90 text-center">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                SOLE_VIBE LIVE BROADCAST LOG // STABLE
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
