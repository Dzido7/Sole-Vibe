import React from "react";
import { Heart, Star, ShoppingBag, Eye } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
  onQuickAdd: () => void;
  key?: string;
}

export default function ProductCard({
  product,
  onSelect,
  onToggleWishlist,
  isInWishlist,
  onQuickAdd,
}: ProductCardProps) {
  // Check aggregate low stock across sizes
  const totalStock = Object.values(product.sizesStock).reduce((a, b) => a + b, 0);

  return (
    <div className="group relative flex flex-col justify-between border border-white/10 bg-[#0c0c0c] rounded-none hover:border-blue-600 transition-all duration-300 overflow-hidden shadow-2xl">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#151515] overflow-hidden select-none flex items-center justify-center">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-center mx-auto block transition-transform duration-500 group-hover:scale-105 ${
            product.images[0].includes("/assets/") ? "object-contain p-6" : "object-cover"
          }`}
          onClick={onSelect}
        />

        {/* Wishlist click absolute */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-3 right-3 p-2.5 rounded-none bg-black/85 backdrop-blur-xs hover:bg-black border border-white/10 text-white/40 hover:text-rose-505 hover:text-rose-500 transition select-none z-10 cursor-pointer"
        >
          <Heart className={`w-4 h-4 transition ${isInWishlist ? "text-rose-500 fill-rose-500" : ""}`} />
        </button>

        {/* Out of Stock banner overlay */}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xs flex items-center justify-center text-[10px] text-white uppercase font-black tracking-[0.2em] pointer-events-none z-2">
            Fully Sold Out
          </div>
        )}

        {/* Hover Shortcut Controls */}
        {totalStock > 0 && (
          <div className="absolute bottom-3 left-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-1.5 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex-1 bg-black/90 backdrop-blur-xs border border-white/10 hover:border-white text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-none flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> SPECS
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-none flex items-center justify-center shadow-lg transition cursor-pointer"
              title="Quick Add Size"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Info Details footer */}
      <div className="p-4 space-y-2 content-end relative bg-[#0c0c0c] border-t border-white/5">
        <div className="flex justify-between items-start gap-2">
          <p onClick={onSelect} className="text-xs font-black text-white hover:text-blue-500 transition truncate tracking-wider uppercase cursor-pointer">
            {product.name}
          </p>
          <span className="font-mono text-xs font-extrabold text-blue-500 whitespace-nowrap">
            ${product.price.toFixed(0)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] tracking-widest">
          <span className="text-white/40 uppercase font-black font-mono text-[9px]">
            {product.category}
          </span>
          <div className="flex items-center gap-0.5 font-bold font-sans text-white/80">
            <Star className="w-3 h-3 text-blue-550 fill-blue-500 text-blue-500" />
            <span>{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
