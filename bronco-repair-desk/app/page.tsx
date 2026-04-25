import Link from "next/link";
import Navbar from "@/components/Navbar";

const heroImg = "https://www.figma.com/api/mcp/asset/e9af5714-e133-4b76-8ce4-65f1b50a0c81";
const mountainBikeImg = "https://www.figma.com/api/mcp/asset/c6424184-4d94-4a09-9abe-cafcc7192eb3";
const miniFridgeImg = "https://www.figma.com/api/mcp/asset/bafd125c-7953-43f8-ba43-2ef65c090d7c";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#f3f4ec] py-24">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 gap-12 items-center" style={{ minHeight: 500 }}>
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-[#012d1d] text-[32px] leading-tight tracking-[-0.8px]">
              Sustainable Campus Life, Made<br />Practical.
            </h1>
            <p className="text-[#414844] text-lg leading-relaxed max-w-[490px]">
              Trade items with fellow students or get a repair verdict for your broken essentials. Save money and keep waste out of landfills.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                href="/create-listing"
                className="flex items-center gap-2 bg-[#ffca98] text-[#7a532a] text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-lg hover:bg-[#f5b97a] transition-colors"
              >
                Sell or Trade an Item
              </Link>
              <Link
                href="/repair/case-84920"
                className="flex items-center gap-2 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-lg hover:bg-[#012d1d] transition-colors"
              >
                {`Check if It's Worth Repairing`}
              </Link>
            </div>
            <div className="flex gap-6 pt-4">
              {["SAVE MONEY", "REDUCE WASTE", "TRUSTED REPAIR GUIDANCE"].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1b4332] opacity-60" />
                  <span className="text-[#414844] text-xs font-semibold tracking-[0.6px] uppercase">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)]" style={{ height: 500 }}>
            <img src={heroImg} alt="Student repairing a bicycle" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-[1280px] mx-auto px-6 py-24">
        <h2 className="font-semibold text-[#012d1d] text-2xl text-center mb-10">How it Works</h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            { step: "1. Upload", desc: "Snap a photo and provide a brief description of the item or issue.", bg: "#c1ecd4" },
            { step: "2. Match", desc: "Get a repair verdict or find interested buyers in the campus network.", bg: "#ffdcbd" },
            { step: "3. Act", desc: "Complete the trade or follow the guided steps to fix your gear.", bg: "#e1e6c2" },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-[0px_4px_10px_rgba(27,67,50,0.08)]">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                <div className="w-6 h-6 bg-[#1b4332] opacity-40 rounded" />
              </div>
              <h3 className="font-semibold text-[#1a1c18] text-xl">{item.step}</h3>
              <p className="text-[#414844] text-base text-center leading-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace + Repair Verdict Bento */}
      <section className="max-w-[1280px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#012d1d] text-2xl">Campus Marketplace</h2>
              <Link href="/marketplace" className="text-[#1b4332] text-xs font-semibold tracking-[0.6px]">View All</Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)]">
                <div className="h-48 bg-[#e2e3db] relative overflow-hidden">
                  <img src={mountainBikeImg} alt="Mountain Bike" className="w-full h-full object-cover" />
                  <span className="absolute top-4 left-4 backdrop-blur-sm bg-white/90 text-[#012d1d] text-xs font-semibold tracking-[0.6px] px-3 py-1 rounded-full">Good Condition</span>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-[#1a1c18] text-xl mb-1">Mountain Bike</h3>
                  <p className="text-[#414844] text-sm leading-[21px] mb-4">Slight rust on chain, otherwise rides smooth. Needs a new home.</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1b4332] text-2xl">$50</span>
                    <Link href="/marketplace/mountain-bike" className="border border-[#717973] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#f3f4ec] transition-colors">Details</Link>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)]">
                <div className="h-48 bg-[#e2e3db] relative overflow-hidden">
                  <img src={miniFridgeImg} alt="Mini Fridge" className="w-full h-full object-cover" />
                  <span className="absolute top-4 left-4 bg-[#ffca98] text-[#7a532a] text-xs font-semibold tracking-[0.6px] px-3 py-1 rounded-full">Trade Only</span>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-[#1a1c18] text-xl mb-1">Mini Fridge</h3>
                  <p className="text-[#414844] text-sm leading-[21px] mb-4">Works perfectly. Looking to trade for a decent desk lamp or plant.</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#7d562d] text-2xl">Trade</span>
                    <Link href="/marketplace/mini-fridge" className="border border-[#717973] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#f3f4ec] transition-colors">Details</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Repair Verdict</h2>
            <div className="bg-white rounded-xl p-6 shadow-[0px_4px_10px_rgba(27,67,50,0.08)] flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#c1c8c2]">
                <div className="w-12 h-12 bg-[#e8e9e1] rounded-lg flex items-center justify-center">
                  <svg width="24" height="17" viewBox="0 0 24 17" fill="none"><rect x="2" y="1" width="20" height="13" rx="2" stroke="#1a1c18" strokeWidth="1.5"/><path d="M8 16h8" stroke="#1a1c18" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-[#1a1c18] text-xl">MacBook Pro 2019</p>
                  <p className="text-[#414844] text-sm">Screen flicker issue</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#414844] text-base">Repairability Score</span>
                  <span className="font-semibold text-[#012d1d] text-xl">75%</span>
                </div>
                <div className="bg-[#e2e3db] h-2 rounded-full"><div className="bg-[#1b4332] h-2 rounded-full w-3/4" /></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#414844] text-base">Estimated Cost</span>
                <span className="font-semibold text-[#1a1c18] text-2xl">$15</span>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <div className="bg-[rgba(193,236,212,0.3)] border border-[#c1ecd4] rounded-lg p-3 flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" stroke="#274e3d" strokeWidth="1.5"/><path d="M5.5 8.5l2 2 4-4" stroke="#274e3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="font-semibold text-[#274e3d] text-xs tracking-[0.6px]">Recommended: Repair</span>
                </div>
                <Link href="/repair/case-84920" className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-4 py-3 rounded-lg text-center hover:bg-[#012d1d] transition-colors">View Repair Guide</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact & Categories */}
      <section className="max-w-[1280px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Our Campus Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1b4332] rounded-xl p-6 flex flex-col gap-2 shadow-[0px_4px_10px_rgba(27,67,50,0.08)]">
                <p className="font-bold text-white text-3xl">500+</p>
                <p className="text-white/90 text-sm pb-2">Items Recirculated</p>
                <div className="border-t border-white/20 pt-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-white/70 rounded-full" />
                  <span className="font-semibold text-white text-xs tracking-[0.6px] uppercase">Active Network</span>
                </div>
              </div>
              <div className="bg-[#e2e3db] rounded-xl p-6 flex flex-col gap-2 shadow-[0px_4px_10px_rgba(27,67,50,0.08)]">
                <p className="font-bold text-[#1b4332] text-3xl">2 Tons</p>
                <p className="text-[#414844] text-sm pb-2">Waste Prevented</p>
                <div className="border-t border-[#c1c8c2] pt-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#1b4332]/60 rounded-full" />
                  <span className="font-semibold text-[#1b4332] text-xs tracking-[0.6px] uppercase">CO2 Saved</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Browse Categories</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Laptops", emoji: "💻" },
                { label: "Bicycles", emoji: "🚲" },
                { label: "E-Scooters", emoji: "🛴" },
                { label: "Appliances", emoji: "🔌" },
              ].map((cat) => (
                <Link key={cat.label} href="/marketplace" className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 shadow-[0px_4px_10px_rgba(27,67,50,0.08)] hover:shadow-[0px_4px_16px_rgba(27,67,50,0.14)] transition-shadow">
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="font-semibold text-[#1a1c18] text-xs tracking-[0.6px]">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f8f9f1] border-t border-[#e5e7eb] py-12 mt-auto">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          <p className="font-bold text-[#1b4332] text-sm">© 2024 Bronco Repair Desk. Built for Campus Sustainability.</p>
          <div className="flex items-center gap-4">
            {["Terms of Service", "Privacy Policy", "Campus Map", "Repair Partners"].map((link, i) => (
              <a key={link} href="#" className={`text-sm ${i === 0 ? "text-[#1b4332] underline" : "text-[#6b7280]"}`}>{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
