import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Heart, Bell, Truck, SlidersHorizontal, Sparkles, Check, Flame, LogIn, LogOut, User as UserIcon } from "lucide-react";

import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { setDoc, doc, getDocFromServer, serverTimestamp } from "firebase/firestore";

import { Product, CartItem, Order } from "./types";
import ProductCard from "./components/ProductCard";
import ProductDetails from "./components/ProductDetails";
import CartDrawer from "./components/CartDrawer";
import WishlistDrawer from "./components/WishlistDrawer";
import NotificationCenter from "./components/NotificationCenter";
import TrackOrderModal from "./components/TrackOrderModal";
import CheckoutModal from "./components/CheckoutModal";
import RecommendationPanel from "./components/RecommendationPanel";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Firebase User Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Storage keys
  const CART_KEY = "solevibe_cart";
  const WISH_KEY = "solevibe_wishlist";
  const HISTORY_KEY = "solevibe_history_v2";

  // Persistent States
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem(WISH_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [viewHistory, setViewHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Drawer & Modal toggles
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showDomainError, setShowDomainError] = useState(false);
  const [currentHostname, setCurrentHostname] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<number>(220);

  // Tracking details state
  const [activeTrackingId, setActiveTrackingId] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Side notification toast state
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Sync to local states
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(viewHistory));
  }, [viewHistory]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnreadAlerts(data.filter((n: any) => !n.read).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncUserProfile = async (currentUser: User) => {
    const path = `users/${currentUser.uid}`;
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        userId: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || "",
        photoURL: currentUser.photoURL || "",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log("Successfully synchronized profile with Firestore for user:", currentUser.uid);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (reporterError) {
        console.error("Failed to sync user profile: Firebase reports blocked access", reporterError);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        showToast(`⚡ Welcome ${result.user.displayName || "Shoehead"}!`);
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      const errCode = err?.code || "";
      const errMsg = err?.message || String(err);
      if (
        errCode.includes("auth/unauthorized-domain") || 
        errMsg.includes("auth/unauthorized-domain") || 
        errMsg.includes("unauthorized-domain")
      ) {
        setCurrentHostname(window.location.hostname || "ais-dev-q6higktg2u22oiu4qod55w-292000331645.europe-west3.run.app");
        setShowDomainError(true);
      } else {
        showToast("⚠️ Authentication failed. Please retry.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast("🔒 Signed out successfully.");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUnreadNotifications();
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncUserProfile(currentUser);
      }
    });

    const interval = setInterval(fetchUnreadNotifications, 8000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Browse history tracking
  const addToHistory = (pId: string) => {
    setViewHistory((prev) => {
      const filtered = prev.filter((id) => id !== pId);
      return [pId, ...filtered].slice(0, 10); // keep up to 10 latest browsed
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    addToHistory(product.id);
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: number, color: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          selectedSize: size,
          selectedColor: color,
          quantity: 1,
          product,
        },
      ];
    });
  };

  const handleRemoveFromCart = (productId: string, size: number, color: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      )
    );
  };

  const handleUpdateQuantity = (
    productId: string,
    size: number,
    color: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId, size, color);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.selectedSize === size &&
        item.selectedColor === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Wishlist actions
  const handleToggleWishlist = (product: Product) => {
    const isInWish = wishlist.some((item) => item.id === product.id);
    if (isInWish) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      showToast(`💔 Removed ${product.name} from wishlist.`);
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`💖 Saved ${product.name} to wishlist!`);
    }
  };

  const handleQuickAdd = (product: Product) => {
    // Quick add default available size with stock
    const availableSizes = Object.entries(product.sizesStock)
      .filter(([_, stock]) => stock > 0)
      .map(([sz]) => Number(sz));

    if (availableSizes.length === 0) {
      showToast(`⚠️ ${product.name} is completely out of stock in all sizes.`);
      return;
    }

    const defaultSize = availableSizes.includes(9) ? 9 : availableSizes[0];
    handleAddToCart(product, defaultSize, product.colors[0]);
    showToast(`🛒 Quick added ${product.name} (Size ${defaultSize}) to bag!`);
  };

  // Complete checkout callback
  const handleCheckoutComplete = (order: Order) => {
    setCartItems([]); // wipe cart
    setActiveTrackingId(order.trackingId); // load tracker
    setTrackingOpen(true); // open tracking drawer
    fetchProducts(); // refresh products inventory stock in app
  };

  // Custom filters list
  const categories = ["All", "Running", "Retro Basketball", "Lifestyle", "Outdoor"];

  // Filter products logic
  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSize = selectedSizeFilter === null || (p.sizesStock[selectedSizeFilter] ?? 0) > 0;
    const matchesPrice = p.price <= priceRange;

    return matchesQuery && matchesCategory && matchesSize && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans select-none antialiased relative pb-16 overflow-hidden">
      
      {/* Massive Background Typography Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none overflow-hidden z-0">
        <span className="text-[25vw] font-black leading-none italic uppercase tracking-tighter">SOLE.VIBE</span>
      </div>

      {/* Toast Overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -55, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0B0B0B] border border-blue-600 text-white font-sans text-xs font-bold py-3 px-6 rounded-none shadow-[0_0_25px_rgba(37,99,235,0.25)] flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="tracking-wide uppercase text-[10px]">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header navigation bar */}
      <header className="sticky top-0 z-40 bg-[#070707]/90 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => setSelectedProduct(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-1 px-2.5 bg-blue-600 text-white font-mono rounded-none transition-transform duration-200 group-hover:rotate-6 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase text-white font-sans">
              SOLE VIBE
            </span>
          </div>

          {/* Quick global Search Input */}
          <div className="hidden sm:flex relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH EXCLUSIVE RELEASES..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/5 border border-white/10 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-[#0c0c0c] transition text-white font-bold tracking-wider placeholder-white/30"
            />
          </div>

          {/* Utility Tools Actions Icon Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tracking logistics */}
            <button
              onClick={() => setTrackingOpen(true)}
              className="p-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-none border border-white/10 transition relative cursor-pointer"
              title="Track Package"
            >
              <Truck className="w-4.5 h-4.5" />
            </button>

            {/* Alert / Notification logs */}
            <button
              onClick={() => {
                setNotificationsOpen(true);
                setUnreadAlerts(0);
              }}
              className="p-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-none border border-white/10 transition relative cursor-pointer"
              title="Alert Logs"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
              )}
            </button>

            {/* Wishlist Heart */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="p-2.5 text-white/60 hover:text-rose-500 hover:bg-white/5 rounded-none border border-white/10 transition relative cursor-pointer"
              title="Saved Wishlist"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black bg-white rounded-none border border-black">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Google Authentication Section */}
            {authLoading ? (
              <div className="h-[38px] px-3 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[9px] text-white/40">
                LOADING...
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 border border-white/10 bg-neutral-900/60 p-1 pl-2 h-[38px] rounded-none">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">MEMBER</span>
                  <span className="text-[10px] font-black uppercase text-blue-500 max-w-[80px] truncate leading-tight mt-0.5">
                    {user.displayName?.split(" ")[0]}
                  </span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ""}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-none border border-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 bg-blue-600 flex items-center justify-center font-bold text-xs text-white uppercase font-sans">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-1 px-2 text-white/40 hover:text-rose-500 transition duration-150 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="h-[38px] px-3.5 border border-white/10 bg-neutral-900 hover:bg-white hover:text-black tracking-widest uppercase font-mono text-[10px] font-black text-white transition flex items-center gap-1.5 cursor-pointer"
                title="Google Log In"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-500" />
                <span>SIGN IN</span>
              </button>
            )}

            {/* Cart ShoppingBag */}
            <button
              onClick={() => setCartOpen(true)}
              className="px-4 h-[38px] bg-white text-black hover:bg-neutral-200 rounded-none shadow-[0_0_15px_rgba(255,255,255,0.1)] transition relative flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest cursor-pointer"
              title="Checkout bag"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>CART [{cartItems.reduce((acc, cr) => acc + cr.quantity, 0).toString().padStart(2, '0')}]</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 flex-1 mt-6 relative z-10 w-full">
        <AnimatePresence mode="wait">
          {!selectedProduct ? (
            /* CATALOG MAIN SCREEN VIEW LAYOUT */
            <motion.div
              layoutId="catalog_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Visual Category Menu */}
                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-md rounded-none p-6 space-y-4 shadow-xl">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block">Select Category</span>
                  <div className="flex flex-wrap lg:flex-col gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-left w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-none transition duration-150 cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Foot Size Selector Panel */}
                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-md rounded-none p-6 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block">Sizing Selector</span>
                    {selectedSizeFilter !== null && (
                      <button
                        onClick={() => setSelectedSizeFilter(null)}
                        className="text-[9px] uppercase font-bold text-blue-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-6 gap-1.5">
                    {[7, 8, 9, 10, 11, 12].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSizeFilter(selectedSizeFilter === sz ? null : sz)}
                        className={`py-2 text-[11px] font-bold font-mono border rounded-none transition cursor-pointer ${
                          selectedSizeFilter === sz
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-white/10 text-white/80 hover:border-white/40 hover:bg-white/5"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40 leading-normal uppercase font-mono">Locks matching pairs ready to ship.</p>
                </div>

                {/* Price range caps */}
                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-md rounded-none p-6 space-y-4 shadow-xl">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block">Price Budget Limits</span>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={120}
                      max={220}
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer bg-white/10 h-1 rounded"
                    />
                    <div className="flex justify-between items-center text-xs font-mono text-white/60">
                      <span>$120</span>
                      <span className="font-bold text-white bg-blue-600 px-2 py-0.5 rounded-none font-sans text-[10px]">${priceRange}</span>
                      <span>$220</span>
                    </div>
                  </div>
                </div>

                {/* Curation recommendations panel based on browsed shoe logs */}
                <RecommendationPanel
                  viewHistory={viewHistory}
                  allProducts={products}
                  onSelectProduct={handleSelectProduct}
                />

              </div>

              {/* Grid content products list */}
              <div className="lg:col-span-3 space-y-6">
                {/* Catalog header statistics */}
                <div className="flex justify-between items-center border border-white/10 bg-neutral-900/40 p-5 rounded-none backdrop-blur-md flex-wrap gap-2 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
                    <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                    <span>Showing {filteredProducts.length} Premium Release silhouettes</span>
                  </div>
                  {unreadAlerts > 0 && (
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-none border border-blue-500/30">
                      <Sparkles className="w-3 h-3 text-blue-500" /> Live Inventory Warning Drop
                    </div>
                  )}
                </div>

                {/* Listing grid */}
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-neutral-900/20 border border-white/10 rounded-none text-center backdrop-blur-md">
                    <SlidersHorizontal className="w-10 h-10 text-white/20 mb-2" />
                    <p className="text-sm font-bold uppercase tracking-wider text-white">No matching releases found</p>
                    <p className="text-xs text-white/40 max-w-sm mt-1">Adjust size selection filters, reduce price bounds, or clear query constraints.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onSelect={() => handleSelectProduct(p)}
                        onToggleWishlist={() => handleToggleWishlist(p)}
                        isInWishlist={wishlist.some((item) => item.id === p.id)}
                        onQuickAdd={() => handleQuickAdd(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* DETAILED SINGLE ACTIVE MOUNT COMPONENT VIEW */
            <motion.div
              layoutId="details_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="bg-neutral-900/40 backdrop-blur-lg rounded-none border border-white/10 p-8 shadow-2xl relative"
            >
              <ProductDetails
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={wishlist.some((item) => item.id === selectedProduct.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-over cart list drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Slide-over wishlist items lists */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((item) => item.id !== id))}
        onAddToCartFromWishlist={(product) => {
          const availableSizes = Object.entries(product.sizesStock)
            .filter(([_, stock]) => stock > 0)
            .map(([sz]) => Number(sz));

          if (availableSizes.length === 0) {
            showToast(`⚠️ ${product.name} is completely out of stock in all sizes.`);
            return;
          }
          const size = availableSizes.includes(9) ? 9 : availableSizes[0];
          handleAddToCart(product, size, product.colors[0]);
          setWishlist((prev) => prev.filter((item) => item.id !== product.id));
          showToast(`🛒 Laced saved ${product.name} directly into your checkout bag!`);
        }}
      />

      {/* Dynamic Push updates warning broadcast ledger */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectProduct={(id) => {
          const matched = products.find((p) => p.id === id);
          if (matched) handleSelectProduct(matched);
        }}
      />

      {/* Safe Multichannel Payment processing funnel */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        onCheckoutComplete={handleCheckoutComplete}
      />

      {/* Logistics timeline order tracking history modal */}
      <TrackOrderModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        defaultTrackingId={activeTrackingId}
      />

      {/* Unauthorized Domain Error Diagnostics Overlay */}
      <AnimatePresence>
        {showDomainError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg bg-neutral-950 border border-amber-500/30 p-6 md:p-8 rounded-none relative shadow-[0_0_50px_rgba(245,158,11,0.15)]"
            >
              {/* Warning Indicator */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
                <div className="w-8 h-8 rounded-none bg-amber-500/10 border border-amber-500 flex items-center justify-center text-amber-500 shrink-0 select-none animate-pulse">
                  ⚠
                </div>
                <div>
                  <h3 className="text-xs font-mono font-black text-amber-500 uppercase tracking-widest leading-none">
                    Firebase Auth Security Notice
                  </h3>
                  <h2 className="text-base font-sans font-black text-white uppercase tracking-tight mt-1">
                    Unauthorized Domain (403)
                  </h2>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs text-white/70 leading-relaxed">
                <p>
                  Your customized Firebase Project <strong className="text-white font-mono font-bold bg-white/5 px-1 py-0.5 border border-white/10">gen-lang-client-0999843737</strong> blocked the authentication popup because this deployment URL matches untrusted client origins.
                </p>

                <div className="bg-neutral-900 border border-white/5 p-3.5 space-y-3 font-mono">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    HOW TO REPAIR SIGN-IN:
                  </span>
                  
                  <ol className="list-decimal list-inside space-y-2 text-[11px] text-white/80">
                    <li>
                      Open your <a 
                        href="https://console.firebase.google.com/project/gen-lang-client-0999843737/authentication/providers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline text-blue-400 hover:text-blue-300 font-bold"
                      >
                        Firebase Authentication Settings
                      </a>.
                    </li>
                    <li>
                      Scroll down to the <strong className="text-white">"Authorized domains"</strong> section.
                    </li>
                    <li>
                      Click <strong className="text-white">"Add domain"</strong> and enter these two values:
                      <div className="mt-2 space-y-1.5 pl-4">
                        <div className="flex items-center justify-between bg-black p-2 border border-white/10 text-[10px]">
                          <span className="text-blue-500 select-all">ais-dev-q6higktg2u22oiu4qod55w-292000331645.europe-west3.run.app</span>
                        </div>
                        <div className="flex items-center justify-between bg-black p-2 border border-white/10 text-[10px]">
                          <span className="text-emerald-500 select-all">ais-pre-q6higktg2u22oiu4qod55w-292000331645.europe-west3.run.app</span>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>

                <p className="text-[10px] text-white/40 italic">
                  * Note: This error is a Firebase-side security setting and is unrelated to local React codebase compilations. Just register the domains and the sign-in will instantly launch successfully without re-deploying code!
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowDomainError(false)}
                  className="px-5 py-2 bg-amber-500 text-black font-mono text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition cursor-pointer"
                >
                  DISMISS & REVIEW
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
