import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, X, Trash2, ShieldCheck, ArrowRight } from "lucide-react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveFromCart: (productId: string, size: number, color: string) => void;
  onUpdateQuantity: (productId: string, size: number, color: string, quantity: number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal > 150;
  const shippingCost = subtotal === 0 ? 0 : isFreeShipping ? 0 : 15.0;
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

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

          {/* Catalog Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-md bg-[#0C0C0C] border-l border-white/10 text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 animate-fade-in">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500 animate-pulse" />
                <h2 className="text-base font-black text-white font-sans uppercase tracking-widest">
                  CHECKOUT BAG
                </h2>
                {cartItems.length > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black text-white bg-blue-600 rounded-none uppercase tracking-wide">
                    {cartItems.reduce((a, b) => a + b.quantity, 0)} IN BAG
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

            {/* Free Shipping Meter */}
            {cartItems.length > 0 && (
              <div className="px-6 py-4 bg-[#111111] border-b border-white/10 text-xs">
                {isFreeShipping ? (
                  <p className="font-black text-blue-500 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    🎉 FREE EXPRESS DELIVERY UNLOCKED!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white/60 uppercase tracking-wider text-[10px]">
                      ADD <span className="font-extrabold text-blue-500">${(150 - subtotal).toFixed(2)}</span> FOR COMPLIMENTARY EXPRESS DESPATCH
                    </p>
                    <div className="w-full h-1.5 bg-white/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        style={{ width: `${Math.min((subtotal / 150) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-white/10 mb-2" />
                  <p className="text-xs font-black text-white uppercase tracking-widest">YOUR BAG IS COMPLETELY EMPTY</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-[250px] leading-relaxed">View our high engineering and limited footwear catalogs to get started.</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-3 text-[10px] font-black text-black bg-white rounded-none uppercase tracking-widest hover:bg-neutral-200 transition"
                  >
                    START CATALOG SEARCH
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className={`w-16 h-16 object-center bg-neutral-900 rounded-none border border-white/10 shrink-0 ${
                        item.product.images[0].includes("/assets/") ? "object-contain p-2" : "object-cover"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">{item.product.name}</h4>
                        <span className="text-xs font-mono font-black text-blue-500 ml-2">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-1">
                        US SIZE {item.selectedSize} // {item.selectedColor.split("/")[0].trim()}
                      </p>
                      
                      {/* Quantity Toggles */}
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border border-white/10 bg-white/5 rounded-none font-mono">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="px-2.5 py-1 text-white/50 hover:text-white hover:bg-white/5 transition"
                          >
                            -
                          </button>
                          <span className="px-3 text-xs font-black text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            className="px-2.5 py-1 text-white/50 hover:text-white hover:bg-white/5 transition"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(item.productId, item.selectedSize, item.selectedColor)}
                          className="p-1.5 text-white/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-none transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#111111]/95 border-t border-white/10 space-y-4">
                <div className="space-y-2 uppercase text-[10px] tracking-widest">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Delivery despatch</span>
                    <span className="font-mono text-white">
                      {shippingCost === 0 ? "FREE EXPRESS" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Duty / Tax</span>
                    <span className="font-mono text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-white pt-2.5 border-t border-white/10">
                    <span>TOTAL AMOUNT</span>
                    <span className="font-mono text-base text-blue-500">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-widest rounded-none transition duration-150 shadow-[0_0_20px_rgba(255,255,255,0.1)] group cursor-pointer"
                >
                  PROCEED TO SECURE CHECKOUT
                  <ArrowRight className="w-4 h-4 text-blue-600 transition-transform group-hover:translate-x-1 shrink-0" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/40 uppercase tracking-[0.2em] text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  SSL ENCRYPTED SECURE PAYMENT PORTAL
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
