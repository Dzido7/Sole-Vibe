import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Package, Truck, Compass, CheckCircle2, RefreshCw, Calendar, Clock } from "lucide-react";
import { Order } from "../types";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTrackingId?: string;
}

export default function TrackOrderModal({
  isOpen,
  onClose,
  defaultTrackingId = "",
}: TrackOrderModalProps) {
  const [searchId, setSearchId] = useState(defaultTrackingId);
  const [order, setOrder] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (defaultTrackingId) {
      setSearchId(defaultTrackingId);
      lookupOrder(defaultTrackingId);
    } else {
      setOrder(null);
      setError("");
    }
  }, [defaultTrackingId, isOpen]);

  const lookupOrder = async (id: string) => {
    if (!id.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const err = await res.json();
        setError(err.error || "Order not found. Check ID form.");
        setOrder(null);
      }
    } catch (err) {
      console.error(err);
      setError("Server communications failure.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(searchId);
  };

  const advanceOrderProgression = async () => {
    if (!order) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/orders/${order.trackingId}/advance`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  const stages: { label: string; status: Order["status"]; icon: any; color: string }[] = [
    { label: "Authorized", status: "processing", icon: Package, color: "text-neutral-500" },
    { label: "Left Warehouse", status: "shipped", icon: Truck, color: "text-amber-500" },
    { label: "In Transit", status: "in-transit", icon: Compass, color: "text-sky-500" },
    { label: "Delivered", status: "delivered", icon: CheckCircle2, color: "text-emerald-500" },
  ];

  const getActiveStageIndex = (status: Order["status"]) => {
    return ["processing", "shipped", "in-transit", "delivered"].indexOf(status);
  };

  const activeIndex = order ? getActiveStageIndex(order.status) : -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-xs"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-2xl bg-[#0C0C0C] rounded-none shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col text-white animate-fade-in"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#0C0C0C]">
              <div>
                <h3 className="text-base font-black text-white font-sans uppercase tracking-widest">
                  REAL-TIME ORDER LOGGER
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono mt-0.5">Track live delivery status and routing stages securely.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/50 hover:text-white rounded-none hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search forms */}
            <div className="p-6 border-b border-white/10 bg-[#111111]">
              <form onSubmit={handleSearchSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="ENTER ORDER TRACKING ID (E.G. SV-2039-XE)"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-white/5 border border-white/10 rounded-none focus:outline-none focus:border-blue-500 font-mono uppercase tracking-wider text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 bg-white hover:bg-neutral-200 text-black rounded-none text-xs font-black uppercase tracking-widest transition disabled:opacity-50 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  {searching ? "LAUNCHING..." : "QUERY STATUS"}
                </button>
              </form>
              {error && <p className="text-[10px] text-rose-500 font-mono uppercase tracking-wider mt-2">{error}</p>}
            </div>

            {/* Order Content */}
            <div className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-6">
              {!order ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-white/10 mb-2 animate-pulse" />
                  <p className="text-xs font-black text-white uppercase tracking-widest">NO LOGISTICS TARGET SEEDED</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-xs leading-relaxed">
                    Complete a checkout booking or paste your generated tracking credentials into the search bar.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Overview */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-white/10 rounded-none bg-[#111111]">
                    <div>
                      <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">TRACKING SEQUENCE</p>
                      <h4 className="text-base font-black text-blue-500 font-mono tracking-widest mt-0.5">{order.trackingId}</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px]">
                      <div>
                        <span className="text-white/40 block uppercase tracking-wider font-mono">DATE RECORDED</span>
                        <span className="font-bold text-white flex items-center gap-1 mt-0.5 uppercase tracking-wider font-mono">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {new Date(order.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block uppercase tracking-wider font-mono">DISPATCH STATUS</span>
                        <span className="font-black text-white uppercase bg-blue-600 px-2.5 py-0.5 rounded-none text-[9px] tracking-widest mt-1 inline-block shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Timeline Stepper */}
                  <div className="py-6 overflow-x-auto">
                    <div className="min-w-[450px] relative flex justify-between items-center">
                      {/* Connection track line */}
                      <div className="absolute left-[35px] right-[35px] top-[24px] h-[2px] bg-white/10 -z-1" />
                      
                      {/* Interactive dynamic trace line */}
                      <div
                        className="absolute left-[35px] top-[24px] h-[2px] bg-blue-500 transition-all duration-500 -z-1 shadow-[0_0_10px_rgba(37,99,235,0.6)]"
                        style={{
                          width: `${(activeIndex / 3) * (94)}%`,
                        }}
                      />

                      {stages.map((stg, idx) => {
                        const Icon = stg.icon;
                        const isCompleted = idx < activeIndex;
                        const isActive = idx === activeIndex;

                        return (
                          <div key={stg.label} className="flex flex-col items-center flex-1 text-center relative z-2">
                            <div
                              className={`w-12 h-12 rounded-none border flex items-center justify-center transition-all duration-300 ${
                                isCompleted
                                  ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                  : isActive
                                  ? "bg-[#0C0C0C] border-blue-500 text-blue-500 ring-4 ring-blue-500/15"
                                  : "bg-[#0C0C0C] border-white/10 text-white/30"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-3.5 ${isActive ? "text-blue-500" : isCompleted ? "text-white/80" : "text-white/40"}`}>
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Speed Simulation Controller */}
                  {activeIndex < 3 && (
                    <div className="p-4 bg-blue-900/10 rounded-none border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                          LOGISTICS TIMELINE ADVANCER
                        </h4>
                        <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider leading-relaxed font-sans">
                          SIMULATE DISPATCH TIMELINES BY INCREMENTALLY ADVANCING REAL-TIME STEPS.
                        </p>
                      </div>
                      <button
                        onClick={advanceOrderProgression}
                        disabled={advancing}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-none transition whitespace-nowrap cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                      >
                        {advancing ? "ADVANCING CARRIER..." : "STEP HIGHLIGHTS"}
                      </button>
                    </div>
                  )}

                  {/* Parcels Content */}
                  <div>
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 font-mono">PARCEL INVENTORY RESERVES</h4>
                    <div className="space-y-2 border border-white/10 rounded-none p-4 bg-[#111111]/40">
                      {order.items.map((item, id) => (
                        <div key={id} className="flex items-center gap-3 text-xs justify-between">
                          <div className="flex items-center gap-3">
                            <img src={item.image} referrerPolicy="no-referrer" className={`w-8 h-8 rounded-none object-center border border-white/10 ${
                              item.image.includes("/assets/") ? "object-contain p-1" : "object-cover"
                            }`} />
                            <div>
                              <p className="font-black text-white uppercase tracking-wider text-[11px]">{item.name}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono mt-0.5">SIZE {item.selectedSize} // {item.selectedColor.split("/")[0]}</p>
                            </div>
                          </div>
                          <span className="font-mono text-blue-500 font-bold whitespace-nowrap text-[11px]">
                            x{item.quantity} &middot; ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History List */}
                  <div>
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      LOGISTICS ACTIVITY TELEMETRY
                    </h4>
                    <div className="border border-white/10 rounded-none overflow-hidden divide-y divide-white/5 bg-[#111111]/20">
                      {order.history.map((hist, index) => (
                        <div key={index} className="p-4 flex gap-4 text-xs">
                          <div className="mt-0.5 text-white/40 shrink-0 font-mono text-[9px] text-right w-16 uppercase tracking-wider">
                            {new Date(hist.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                          <div className="w-[1px] bg-white/10 shrink-0 relative">
                            {index === 0 && (
                              <span className="absolute -left-[3px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-white uppercase tracking-wider text-[11px]">{hist.status}</p>
                            <p className="text-white/50 leading-relaxed mt-0.5 text-[11px] uppercase tracking-wide font-sans">{hist.description}</p>
                            <span className="text-[8px] font-mono text-white/30 block mt-1.5 uppercase tracking-widest">
                              {new Date(hist.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/10 bg-[#111111]/90 text-center">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                SOLE_VIBE CARRIER NETWORK // CLOUD INTEGRATED
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
