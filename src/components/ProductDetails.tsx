import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShoppingBag, Star, Share2, CornerDownRight, ShieldAlert, Award, ArrowLeft, Check, Copy } from "lucide-react";
import { Product, Review } from "../types";

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, size: number, color: string) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: boolean;
}

export default function ProductDetails({
  product,
  onBack,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
}: ProductDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [ratingStats, setRatingStats] = useState({ avg: product.rating, count: product.reviewCount });

  // Reviews submission state
  const [reviewForm, setReviewForm] = useState({
    username: "",
    title: "",
    comment: "",
    rating: 5,
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    setSelectedColor(product.colors[0]);
    setSelectedSize(null);
    setShareOpen(false);
    setRatingStats({ avg: product.rating, count: product.reviewCount });
  }, [product]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3000);
  };

  const handleShare = (network: 'copy' | 'twitter' | 'facebook' | 'pinterest') => {
    const shareUrl = window.location.href;
    const shareText = `Lacing up SoleVibe's premium ${product.name}! Check out this elite sneaker release.`;
    
    if (network === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      showToast("Share page link copied to clipboard!");
    } else if (network === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (network === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (network === 'pinterest') {
      window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(shareText)}`, '_blank');
    }
    setShareOpen(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.username.trim() || !reviewForm.title.trim() || !reviewForm.comment.trim()) {
      setReviewError("Provide all review details.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });

      if (res.ok) {
        setReviewForm({ username: "", title: "", comment: "", rating: 5 });
        fetchReviews();
        showToast("Review submitted successfully! Updated averages.");
        
        // Slightly increment average on screen manually or re-fetch product stats
        const currentCount = ratingStats.count + 1;
        const currentAvg = parseFloat(((ratingStats.avg * ratingStats.count + reviewForm.rating) / currentCount).toFixed(1));
        setRatingStats({ avg: currentAvg, count: currentCount });
      } else {
        setReviewError("Could not submit your review. Clean outputs.");
      }
    } catch (err) {
      setReviewError("Communications error. Retry lacing records.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStockCount = (size: number) => {
    return product.sizesStock[size] ?? 0;
  };

  const handleAddToCartClick = () => {
    if (selectedSize === null) {
      showToast("⚠️ Select a foot size first to checkout.");
      return;
    }
    onAddToCart(product, selectedSize, selectedColor);
    showToast(`🛒 ${product.name} (Size ${selectedSize}) added to bag!`);
  };

  return (
    <div className="space-y-10">
      {/* Toast Alert popup overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -55, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-neutral-800 text-white font-sans text-xs font-semibold py-3 px-6 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Breadcrumb bar */}
      <div className="flex justify-between items-center bg-neutral-50 p-4 border border-neutral-100 rounded-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:text-neutral-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Catalog
        </button>
        <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest text-right">
          Exclusive Silhouette / {product.category}
        </div>
      </div>

      {/* Core Detail Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Product Images Viewer */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden bg-neutral-50 rounded-2xl border border-neutral-100 shadow-sm group flex items-center justify-center">
            <img
              src={product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-center mx-auto block transition-transform duration-500 hover:scale-102 ${
                product.images[0].includes("/assets/") ? "object-contain p-8" : "object-cover"
              }`}
            />
            {/* Quick Heart overlay */}
            <button
              onClick={() => onToggleWishlist(product)}
              className="absolute top-4 right-4 p-3 bg-white hover:bg-neutral-50 rounded-full border border-neutral-100 shadow-lg text-neutral-400 transition"
            >
              <Heart className={`w-5 h-5 transition-transform duration-300 hover:scale-110 active:scale-90 ${isInWishlist ? "text-rose-500 fill-rose-500" : ""}`} />
            </button>
          </div>

          {/* Core premium quality details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-neutral-100 rounded-xl p-4 bg-white shadow-3xs flex items-center gap-3 text-xs leading-tight">
              <Award className="w-8 h-8 text-neutral-800 shrink-0" />
              <div>
                <p className="font-bold text-neutral-900 font-sans">Handcrafted Leather / Filament</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Tested for long distance structural resilience.</p>
              </div>
            </div>
            <div className="border border-neutral-100 rounded-xl p-4 bg-white shadow-3xs flex items-center gap-3 text-xs leading-tight">
              <ShieldAlert className="w-8 h-8 text-neutral-800 shrink-0" />
              <div>
                <p className="font-bold text-neutral-900 font-sans">Guaranteed Fit</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Complimentary 30-day wear trial exchanges.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(ratingStats.avg)
                      ? "text-neutral-905 fill-neutral-900 text-neutral-900"
                      : "text-neutral-230 text-neutral-200"
                  }`}
                />
              ))}
              <span className="text-[11px] font-mono text-neutral-500 font-bold ml-1.5">
                {ratingStats.avg} &middot; ({ratingStats.count} verified comments)
              </span>
            </div>
            <h1 className="text-2xl font-black text-neutral-950 tracking-tight font-sans uppercase">
              {product.name}
            </h1>
            <p className="text-xl font-mono font-bold text-neutral-900 tracking-tight block">
              ${product.price.toFixed(2)}
            </p>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed font-sans font-medium">
            {product.description}
          </p>

          <div className="border-t border-b border-neutral-100 py-5 space-y-4">
            {/* Color swatches */}
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">Color Release</span>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 text-xs font-bold font-sans border rounded-full transition-all duration-150 ${
                      selectedColor === c
                        ? "border-neutral-900 bg-neutral-950 text-white"
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector & stock levels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Available US Sizes</span>
                {selectedSize !== null && (
                  <span className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded text-white ${
                    getStockCount(selectedSize) === 0
                      ? "bg-rose-500"
                      : getStockCount(selectedSize) <= 2
                      ? "bg-rose-500 animate-pulse"
                      : "bg-emerald-600"
                  }`}>
                    {getStockCount(selectedSize) === 0
                      ? "OUT OF STOCK"
                      : getStockCount(selectedSize) <= 2
                      ? `CRITICAL: ONLY ${getStockCount(selectedSize)} LEFT!`
                      : `${getStockCount(selectedSize)} pairs in stock`}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {[7, 8, 9, 10, 11, 12].map((sz) => {
                  const stock = getStockCount(sz);
                  const isAvailable = product.sizes.includes(sz);
                  const hasStock = stock > 0;
                  const isSelected = selectedSize === sz;

                  let styleClass = "border-neutral-200 text-neutral-400 line-through cursor-not-allowed";
                  if (isAvailable) {
                    if (!hasStock) {
                      styleClass = "border-rose-100 text-rose-300 line-through bg-rose-50/50 cursor-not-allowed";
                    } else if (isSelected) {
                      styleClass = "border-neutral-900 bg-neutral-950 text-white font-black shadow-md scale-102";
                    } else {
                      styleClass = "border-neutral-200 text-neutral-800 hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer";
                    }
                  }

                  return (
                    <button
                      key={sz}
                      disabled={!isAvailable || !hasStock}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 text-xs font-semibold font-mono transition-all duration-150 border rounded-lg text-center ${styleClass}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCartClick}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-neutral-950 hover:bg-neutral-850 text-white text-sm font-semibold rounded-lg shadow-md transition group"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Add to Bag
            </button>

            {/* Social Share Trigger */}
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="p-3.5 border border-neutral-200 rounded-lg hover:border-neutral-400 select-none cursor-pointer text-neutral-500 hover:text-neutral-900 font-sans text-xs transition flex items-center gap-1"
              >
                <Share2 className="w-5 h-5 shrink-0" />
              </button>

              {/* Share Popover Drawer */}
              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="absolute right-0 bottom-full mb-2 z-30 w-48 bg-white border border-neutral-100 shadow-2xl rounded-xl p-2 py-3 space-y-1 block"
                  >
                    <button
                      type="button"
                      onClick={() => handleShare('copy')}
                      className="w-full text-left text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-neutral-400" /> Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition"
                    >
                      <span>Share on X</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('facebook')}
                      className="w-full text-left text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition"
                    >
                      <span>Share on Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('pinterest')}
                      className="w-full text-left text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition"
                    >
                      <span>Pin on Pinterest</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bullet specifications list */}
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Premium Specs &amp; Engineering</span>
            <ul className="space-y-1 text-xs text-neutral-500 font-medium">
              {product.features.map((ft, id) => (
                <li key={id} className="flex gap-2 items-start leading-relaxed">
                  <CornerDownRight className="w-3.5 h-3.5 text-neutral-800 mt-1 shrink-0" />
                  <span>{ft}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews Section Breakdown */}
      <div className="border-t border-neutral-100 pt-8 space-y-8">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 font-sans tracking-tight uppercase">Product Review Hub</h2>
          <p className="text-xs text-neutral-405 text-neutral-400">Read lacing feedback and submit your verified ratings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* List of comments */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="p-10 border border-neutral-100 rounded-xl text-center text-xs text-neutral-400 font-sans">
                No ratings logged. Be the original lacing critic below!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-5 border border-neutral-100 bg-neutral-50/50 rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? "text-neutral-901 fill-neutral-900 text-neutral-900"
                                : "text-neutral-201 text-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 tracking-tight">{rev.title}</h4>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase bg-white border border-neutral-200 px-2 py-0.5 rounded-full shadow-xs">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans">{rev.comment}</p>
                  <div className="flex justify-between pt-2 border-t border-neutral-200/50 text-[10px] text-neutral-400 font-mono">
                    <span className="font-bold text-neutral-600">@{rev.username}</span>
                    <span>{rev.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submission Panel */}
          <div className="p-6 border border-neutral-100 bg-white rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 font-sans uppercase">Lace custom Rating</h3>
            {reviewError && <p className="text-xs text-rose-500 font-semibold">{reviewError}</p>}
            
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={reviewForm.username}
                  onChange={(e) => setReviewForm({ ...reviewForm, username: e.target.value })}
                  placeholder="e.g. CarbonKing"
                  className="w-full px-3 py-2 border border-neutral-200 placeholder-neutral-300 rounded-lg text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium text-neutral-905 text-neutral-950"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Review Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Incredible propulsion plates!"
                  className="w-full px-3 py-2 border border-neutral-200 placeholder-neutral-300 rounded-lg text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium text-neutral-905 text-neutral-950"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Score Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setReviewForm({ ...reviewForm, rating: st })}
                      className="p-1 cursor-pointer transition"
                    >
                      <Star
                        className={`w-6 h-6 transition ${
                          st <= reviewForm.rating
                            ? "text-neutral-901 fill-neutral-900 text-neutral-900 scale-105"
                            : "text-neutral-200 hover:text-neutral-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Comments</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  placeholder="Describe comfort, cushioning levels, ventilation, and sizing guides..."
                  className="w-full px-3 py-2 border border-neutral-200 placeholder-neutral-300 rounded-lg text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium text-neutral-955 text-neutral-950"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white rounded-lg text-xs font-semibold font-sans tracking-wide transition disabled:opacity-50"
              >
                {submittingReview ? "Registering review..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
