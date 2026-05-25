import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, CornerDownRight } from "lucide-react";
import { Product } from "../types";

interface RecommendationPanelProps {
  viewHistory: string[];
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function RecommendationPanel({
  viewHistory,
  allProducts,
  onSelectProduct,
}: RecommendationPanelProps) {
  const [curatorNote, setCuratorNote] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewHistory }),
        });
        if (res.ok) {
          const data = await res.json();
          setCuratorNote(data.curatorNote);
          // Map recommended IDs to product objects
          const matched: Product[] = [];
          data.recommendedIds.forEach((id: string) => {
            const p = allProducts.find((item) => item.id === id);
            if (p) matched.push(p);
          });
          setRecommendedProducts(matched);
        }
      } catch (err) {
        console.error("Failed to compile AI recommendations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [viewHistory, allProducts]);

  if (viewHistory.length === 0) {
    return (
      <div className="bg-[#0C0C0C] border border-white/10 rounded-none p-6 text-center text-xs text-white/40 font-mono tracking-widest max-w-sm uppercase leading-relaxed">
        Start viewing catalog silhouette releases to seed the AI Curator recommendation engine.
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-none bg-[#0C0C0C]/80 backdrop-blur-md p-6 shadow-2xl space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1 px-3.5 bg-blue-600 text-white rounded-none text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1 shrink-0 shadow-[0_0_12px_rgba(37,99,235,0.4)]">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          AI CURATION TELEMETRY
        </div>
        <div className="w-full h-[1px] bg-white/10" />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded-none w-full" />
            <div className="h-3 bg-white/10 rounded-none w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="h-36 bg-white/10 rounded-none" />
            <div className="h-36 bg-white/10 rounded-none" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Note text */}
          <div className="relative pl-4 border-l-2 border-blue-500">
            <p className="text-xs italic leading-relaxed text-white/85 font-sans uppercase font-bold tracking-wide">
              &ldquo;{curatorNote}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/40 uppercase tracking-[0.25em] mt-2">
              <CornerDownRight className="w-3 h-3 text-blue-500" /> DIGITAL CURATOR ENGINE // ACTIVE
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4">
            {recommendedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group cursor-pointer border border-white/10 hover:border-blue-600 rounded-none p-3 bg-white/5 hover:bg-neutral-900 transition-all duration-300 shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden rounded-none bg-[#111111] mb-2 border border-white/5 flex items-center justify-center">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-center mx-auto block transition-transform duration-300 group-hover:scale-104 ${
                      p.images[0].includes("/assets/") ? "object-contain p-4" : "object-cover"
                    }`}
                  />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-wider truncate">
                    {p.name}
                  </h5>
                  <div className="flex items-center justify-between gap-1 mt-1 font-mono">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">
                      {p.category.split(" ")[0]}
                    </span>
                    <span className="text-xs font-black text-blue-500">
                      ${p.price.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
