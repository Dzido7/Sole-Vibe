import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, CreditCard, ShieldCheck, ArrowRight, ArrowLeft, Loader2, ClipboardCheck, Sparkles, AlertCircle } from "lucide-react";
import { CartItem, Order } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCheckoutComplete: (order: Order) => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'authenticating' | 'summary';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onCheckoutComplete,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [shippingForm, setShippingForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zipCode: ""
  });
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gplay' | 'paypal'>('card');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadingMsg, setLoadingMsg] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal > 150;
  const shippingCost = subtotal === 0 ? 0 : isFreeShipping ? 0 : 15.0;
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

  const validateShipping = () => {
    const err: { [key: string]: string } = {};
    if (!shippingForm.name.trim()) err.name = "Full Name is required.";
    if (!shippingForm.email.trim() || !/\S+@\S+\.\S+/.test(shippingForm.email)) {
      err.email = "Please supply a valid email address.";
    }
    if (!shippingForm.address.trim()) err.address = "Delivery address is required.";
    if (!shippingForm.city.trim()) err.city = "City is required.";
    if (!shippingForm.zipCode.trim() || shippingForm.zipCode.length < 4) {
      err.zipCode = "Provide a valid Zip or Postal Code.";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validatePayment = () => {
    if (paymentMethod !== 'card') return true;
    const err: { [key: string]: string } = {};
    const sanitizedCard = paymentForm.cardNumber.replace(/\s/g, "");
    if (sanitizedCard.length !== 16 || !/^\d+$/.test(sanitizedCard)) {
      err.cardNumber = "Provide a valid 16-digit Card Number.";
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiryDate)) {
      err.expiry = "Use standard MM/YY date format.";
    }
    if (paymentForm.cvv.length !== 3 || !/^\d+$/.test(paymentForm.cvv)) {
      err.cvv = "CVV must stand inside 3 digits.";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNextStep = () => {
    if (step === 'shipping') {
      if (validateShipping()) {
        setStep('payment');
      }
    }
  };

  const performMockAuthorization = async (currentPaymentMethod: string) => {
    setStep('authenticating');
    setLoadingMsg(`Encrypting 256-bit safe tunnel for payment...`);
    
    await new Promise(r => setTimeout(r, 1500));
    setLoadingMsg(`Submitting payment package authorization queries via ${currentPaymentMethod}...`);
    
    await new Promise(r => setTimeout(r, 1500));
    setLoadingMsg(`Finalizing transaction. Handshaking secure SoleVibe logistics records...`);
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          customerInfo: shippingForm,
          paymentMethod: currentPaymentMethod,
          paymentDetails: paymentMethod === 'card' ? paymentForm : { token: "MOCK_TOKEN" }
        })
      });

      if (res.ok) {
        const order: Order = await res.json();
        setCreatedOrder(order);
        setStep('summary');
      } else {
        const err = await res.json();
        setStep('payment');
        setErrors({ general: err.error || "Checkout authorization failed. Ensure stock exists." });
      }
    } catch (err) {
      setStep('payment');
      setErrors({ general: "Critical communications error connection with processing server." });
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePayment()) {
      let methodLabel = "Credit/Debit Card";
      if (paymentMethod === 'gplay') methodLabel = "Google Pay";
      if (paymentMethod === 'paypal') methodLabel = "PayPal Checkout";
      performMockAuthorization(methodLabel);
    }
  };

  const copyToClipboard = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.trackingId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
            className="relative z-10 w-full max-w-lg bg-[#0C0C0C] rounded-none shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col text-white"
          >
            {/* Steps Progress Indicator (Non-Authenticating / Non-Summary) */}
            {(step === 'shipping' || step === 'payment') && (
              <div className="flex bg-[#111111] px-6 py-4 border-b border-white/10 text-[10px] font-black uppercase tracking-widest justify-between items-center text-white/40">
                <span className={`flex items-center gap-1.5 ${step === 'shipping' ? "text-blue-500 font-extrabold" : "text-white/80"}`}>
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> 1. SHIPPING DESTINATION
                </span>
                <span className="w-8 h-[1px] bg-white/10" />
                <span className={`flex items-center gap-1.5 ${step === 'payment' ? "text-blue-500 font-extrabold" : ""}`}>
                  <CreditCard className="w-3.5 h-3.5" /> 2. SECURE SETTLEMENT
                </span>
              </div>
            )}

            {/* Header */}
            {step !== 'authenticating' && step !== 'summary' && (
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 bg-[#0C0C0C]">
                <h3 className="text-sm font-black text-white font-sans uppercase tracking-widest">
                  {step === 'shipping' ? 'DELIVERY SHIPPING LOCATION' : 'CHOOSE PAYMENT OPTION'}
                </h3>
                <button onClick={onClose} className="p-1.5 text-white/50 hover:text-white rounded-none hover:bg-white/5 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 1: Shipping Form */}
            {step === 'shipping' && (
              <div className="p-6 space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-none text-xs bg-white/5 focus:bg-neutral-900 focus:outline-none focus:border-blue-500 text-white font-mono tracking-wider uppercase"
                      placeholder="e.g. LIAM NEUMANN"
                    />
                    {errors.name && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Email Coordinates</label>
                    <input
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-none text-xs bg-white/5 focus:bg-neutral-900 focus:outline-none focus:border-blue-500 text-white font-mono tracking-wider uppercase"
                      placeholder="LIAM@SOLEVIBE.COM"
                    />
                    {errors.email && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-none text-xs bg-white/5 focus:bg-neutral-900 focus:outline-none focus:border-blue-500 text-white font-mono tracking-wider uppercase"
                      placeholder="STRASSE / STREET 42, APT 3B"
                    />
                    {errors.address && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">City</label>
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        className="w-full px-3 py-2.5 border border-white/10 rounded-none text-xs bg-white/5 focus:bg-neutral-900 focus:outline-none focus:border-blue-500 text-white font-mono tracking-wider uppercase"
                        placeholder="MUNCHEN"
                      />
                      {errors.city && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Zip / Postal Code</label>
                      <input
                        type="text"
                        value={shippingForm.zipCode}
                        onChange={(e) => setShippingForm({ ...shippingForm, zipCode: e.target.value })}
                        className="w-full px-3 py-2.5 border border-white/10 rounded-none text-xs bg-white/5 focus:bg-neutral-900 focus:outline-none focus:border-blue-500 text-white font-mono tracking-wider uppercase"
                        placeholder="80331"
                      />
                      {errors.zipCode && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.zipCode}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-white/40">
                    TOTAL TOTAL: <span className="font-mono text-sm font-black text-blue-500 ml-1">${total.toFixed(2)}</span>
                  </p>
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-6 py-3 bg-white hover:bg-neutral-200 text-black rounded-none text-xs font-black uppercase tracking-widest cursor-pointer"
                  >
                    CONTINUE TO SETTLEMENT
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Payment Selector Form */}
            {step === 'payment' && (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                {errors.general && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-none flex items-center gap-2 text-xs text-rose-400 font-mono uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* Sub-Methods Selector tabs */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('card'); setErrors({}); }}
                    className={`py-3 px-1 border rounded-none text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? "border-blue-500 bg-blue-600/10 text-white shadow-[0_0_12px_rgba(37,99,235,0.2)]"
                        : "border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    SECURE CARD
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('gplay'); setErrors({}); }}
                    className={`py-3 px-1 border rounded-none text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'gplay'
                        ? "border-blue-500 bg-blue-600/10 text-white shadow-[0_0_12px_rgba(37,99,235,0.2)]"
                        : "border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-[10px] tracking-wide block text-white font-extrabold">GOOGLE PAY</span>
                    INSTANT CLEAR
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('paypal'); setErrors({}); }}
                    className={`py-3 px-1 border rounded-none text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? "border-blue-500 bg-blue-600/10 text-white shadow-[0_0_12px_rgba(37,99,235,0.2)]"
                        : "border-white/10 text-white/40 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-[10px] tracking-wide block text-[#00c4ff] font-extrabold">PAYPAL</span>
                    SAFE WALLET
                  </button>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/60 block mb-1 uppercase tracking-widest">Credit / Debit Card Number</label>
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/\D/g, "").slice(0, 16);
                          const formatted = sanitized.replace(/(\d{4})(?=\d)/g, "$1 ");
                          setPaymentForm({ ...paymentForm, cardNumber: formatted });
                        }}
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2.5 border border-white/10 bg-white/5 font-mono text-sm rounded-none text-white focus:bg-neutral-900 focus:outline-none focus:border-blue-500"
                      />
                      {errors.cardNumber && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.cardNumber}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-white/60 block mb-1 uppercase tracking-widest">Expiry MM/YY</label>
                        <input
                          type="text"
                          value={paymentForm.expiryDate}
                          onChange={(e) => {
                            let text = e.target.value.replace(/\D/g, "");
                            if (text.length > 2) {
                              text = `${text.slice(0, 2)}/${text.slice(2, 4)}`;
                            }
                            setPaymentForm({ ...paymentForm, expiryDate: text });
                          }}
                          maxLength={5}
                          placeholder="12/28"
                          className="w-full px-3 py-2.5 border border-white/10 bg-white/5 font-mono text-sm rounded-none text-white focus:bg-neutral-900 focus:outline-none focus:border-blue-500"
                        />
                        {errors.expiry && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/60 block mb-1 uppercase tracking-widest">CVV Security Code</label>
                        <input
                          type="password"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                          maxLength={3}
                          placeholder="***"
                          className="w-full px-3 py-2.5 border border-white/10 bg-white/5 font-mono text-sm rounded-none text-white focus:bg-neutral-900 focus:outline-none focus:border-blue-500"
                        />
                        {errors.cvv && <p className="text-[10px] text-rose-500 mt-1 uppercase font-mono tracking-wider">{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 px-4 bg-[#111111] rounded-none text-center border border-white/10 text-xs text-white/50 leading-relaxed uppercase tracking-wider font-mono">
                    Authentication triggers via secure external pop-up frame window upon checkout submission. verified SSL gateway in active crypted log.
                  </div>
                )}

                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setStep('shipping'); }}
                    className="flex items-center gap-1.5 px-4 py-2 hover:bg-white/5 text-white/70 hover:text-white rounded-none text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-neutral-200 text-black rounded-none text-xs font-black uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    AUTHORIZE ${total.toFixed(2)}
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Authenticating Loading State */}
            {step === 'authenticating' && (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-5">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">PROCESSING SECURE SETTLEMENT</h4>
                  <p className="text-[11px] font-mono text-white/40 max-w-xs uppercase leading-relaxed tracking-wider">
                    {loadingMsg}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-900/10 border border-blue-500/30 px-4 py-1.5 rounded-none text-[9px] font-mono font-black text-blue-500 uppercase tracking-widest shadow-[0_0_12px_rgba(37,99,235,0.15)]">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-BIT CRYPTO TUNNEL SECURED
                </div>
              </div>
            )}

            {/* STEP 4: Checkout Completed Summary */}
            {step === 'summary' && createdOrder && (
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-14 h-14 bg-blue-600/15 text-blue-500 border border-blue-500/30 rounded-none flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-pulse">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-base font-black text-white font-sans uppercase tracking-[0.15em]">ORDER BOOKING SECURED</h3>
                  <p className="text-xs text-white/50 max-w-sm uppercase tracking-wide leading-relaxed font-sans">
                    Thank you, <span className="font-extrabold text-white">{shippingForm.name}</span>. Your payment request was approved, and factory reserves have been locked for delivery routing.
                  </p>
                </div>

                {/* Copiable Reference */}
                <div className="w-full bg-[#111111] border border-white/10 p-5 rounded-none space-y-3">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block">SNEAKER REGISTER INDEX LOG</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-sm font-black text-blue-500 tracking-widest">
                      {createdOrder.trackingId}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                        isCopied
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </button>
                  </div>
                  {isCopied && <p className="text-[10px] text-blue-500 font-mono uppercase tracking-wider">TRACKING INDEX COPIED TO CLIBBOARD!</p>}
                </div>

                <div className="w-full text-[10px] space-y-1.5 text-left text-white/50 bg-[#111111] p-4 border border-white/10 font-mono uppercase tracking-wider">
                  <div className="flex justify-between">
                    <span>Selected Payment:</span>
                    <span className="text-white font-black">{createdOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Delivery Duty:</span>
                    <span className="text-white font-black">SSL APPROVED</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-xs font-black text-white mt-1">
                    <span>Authorized Amount:</span>
                    <span className="text-blue-500 font-black">${createdOrder.totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <button
                  onClick={() => {
                    onCheckoutComplete(createdOrder);
                    onClose();
                  }}
                  className="w-full py-4 bg-white hover:bg-[#eaeaea] text-black font-black text-xs uppercase tracking-widest rounded-none flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  EXPLORE REAL-TIME ROUTE DISPATCH
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
