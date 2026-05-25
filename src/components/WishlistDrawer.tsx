import { motion, AnimatePresence } from "motion/react";
import { Heart, X, Trash2, ShoppingCart } from "lucide-react";
import { Product } from "../types";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCartFromWishlist: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCartFromWishlist,
}: WishlistDrawerProps) {
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
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-blue-500 fill-blue-500" />
                <h2 className="text-base font-black text-white font-sans uppercase tracking-widest">
                  SAVED SILHOUETTES
                </h2>
                {wishlist.length > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black text-white bg-blue-600 rounded-none uppercase tracking-wide">
                    {wishlist.length} SAVED
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

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <Heart className="w-12 h-12 text-white/10 mb-2" />
                  <p className="text-xs font-black text-white uppercase tracking-widest">WISHLIST IS COMPLETELY EMPTY</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-[250px] leading-relaxed">Save your favorite releases utilizing the bookmark heart index to track them here.</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-3 text-[10px] font-black text-black bg-white rounded-none uppercase tracking-widest hover:bg-neutral-200 transition"
                  >
                    EXPLORE DESIGNS
                  </button>
                </div>
              ) : (
                wishlist.map((product) => (
                  <div key={product.id} className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className={`w-16 h-16 object-center bg-neutral-900 rounded-none border border-white/10 shrink-0 ${
                        product.images[0].includes("/assets/") ? "object-contain p-2" : "object-cover"
                      }`}
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                            {product.name}
                          </h4>
                          <span className="text-xs font-mono font-black text-blue-500">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-1">{product.category}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => onAddToCartFromWishlist(product)}
                          className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest rounded-none transition cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          ADD TO BAG
                        </button>
                        <button
                          onClick={() => onRemoveFromWishlist(product.id)}
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

            <div className="p-4 border-t border-white/10 bg-[#111111]/90 text-center">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                SNEAKERS SYSTEM ARCHIVE &nbsp;|&nbsp; COLD SYNC SECURE
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
