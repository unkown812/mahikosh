import React, { useState } from "react";
import { Ticket, Gift, Check, ShoppingBag, Award, Tag, Sparkles } from "lucide-react";
import { RewardItem } from "../types";
import { REWARDS_CATALOG } from "../utils";

interface RewardsStoreProps {
  ecoBucks: number;
  onRedeemReward: (rewardId: string, cost: number) => void;
  redeemedRewards: RewardItem[];
}

export default function RewardsStore({ ecoBucks, onRedeemReward, redeemedRewards }: RewardsStoreProps) {
  const [successMsg, setSuccessMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "transport" | "energy" | "lifestyle" | "food">("all");

  const handleRedeem = (id: string, title: string, cost: number) => {
    if (ecoBucks >= cost) {
      onRedeemReward(id, cost);
      setSuccessMsg(`Redeemed successfully! You got a voucher for: ${title}`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  const filteredCatalog = activeFilter === "all"
    ? REWARDS_CATALOG
    : REWARDS_CATALOG.filter(r => r.category === activeFilter);

  // Category badge colors
  const getCatBadge = (cat: string) => {
    switch (cat) {
      case "transport": return "bg-[#3bd3fd]/15 border-[#0089ad]/20 text-[#0089ad]";
      case "energy": return "bg-[#fbbd41]/15 border-[#d08a11]/20 text-[#d08a11]";
      case "lifestyle": return "bg-[#c1b0ff]/15 border-[#43089f]/20 text-[#43089f]";
      case "food": return "bg-[#84e7a5]/15 border-[#078a52]/20 text-[#078a52]";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div id="rewards-store-section" className="clay-card p-6 md:p-8 bg-[#fff8f1]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Gift className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Rewards Marketplace</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Redeem your EcoBucks points on verified sustainable vouchers and environmental certifications.
          </p>
        </div>

        {/* Dynamic score balance bubble */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/20 border border-yellow-400 text-yellow-800 font-display font-bold text-xs rounded-xl shadow-clay">
          <Award className="w-4.5 h-4.5 text-yellow-600 fill-yellow-200" />
          <span>Current Balance: {ecoBucks} EcoBucks</span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2 text-success text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "transport", "energy", "lifestyle", "food"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3.5 py-1 text-xs font-bold font-display rounded-full border transition-all ${
              activeFilter === cat
                ? "bg-accent text-white border-accent shadow-sm"
                : "border-border hover:border-accent hover:bg-surface-warm/20 bg-surface/80 text-fg-2"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Catalog items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCatalog.map((reward) => {
          const isAffordable = ecoBucks >= reward.cost;
          const isOwned = redeemedRewards.some(r => r.id === reward.id);

          return (
            <div
              key={reward.id}
              className="p-5 bg-surface border border-border-soft rounded-2xl shadow-clay flex flex-col justify-between hover:scale-[1.01] transition-all duration-200 relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className={`px-2.5 py-0.5 text-[9px] uppercase font-bold rounded border ${getCatBadge(reward.category)}`}>
                    {reward.category}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-success bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                      {reward.cost} EcoBucks
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold font-display text-fg mt-1">
                  {reward.title}
                </h3>
                <p className="text-xs text-muted font-medium mt-1.5 leading-relaxed">
                  {reward.description}
                </p>
                <p className="text-[10px] text-muted font-mono mt-2">
                  Provider: {reward.provider}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border-soft">
                {isOwned ? (
                  <div className="w-full text-center py-2 bg-success/10 text-success text-xs font-bold rounded-xl border border-success/20 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Redeemed (Check Coupons below)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRedeem(reward.id, reward.title, reward.cost)}
                    disabled={!isAffordable}
                    className={`w-full py-2 font-bold font-display text-xs rounded-full border transition-all ${
                      isAffordable
                        ? "bg-accent hover:bg-accent-hover text-white border-accent shadow-sm cursor-pointer"
                        : "bg-surface-warm/20 border-border text-muted cursor-not-allowed opacity-60"
                     }`}
                  >
                    {isAffordable ? "Spend EcoBucks to Redeem" : `Need ${reward.cost - ecoBucks} more EcoBucks`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Redeemed coupons list */}
      {redeemedRewards.length > 0 && (
        <div className="mt-8 border-t border-border-soft pt-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <Ticket className="w-4 h-4 text-muted" />
            <span>Your Redeemed Vouchers & Certificates ({redeemedRewards.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redeemedRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 bg-[#84e7a5]/5 border border-dashed border-[#078a52]/30 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-fg">
                    {reward.title}
                  </p>
                  <p className="text-[9px] text-[#078a52] font-mono mt-0.5">
                    Redeemed: {reward.redeemedAt ? new Date(reward.redeemedAt).toLocaleDateString() : ""}
                  </p>
                  <p className="text-[9px] text-muted truncate mt-0.5">
                    Provider: {reward.provider}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono font-bold bg-[#078a52] text-white px-2 py-1 rounded shadow-clay select-all">
                    {reward.couponCode}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-[#078a52] font-semibold flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    Copy Code
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
