import Link from "next/link";
import Navbar from "@/components/Navbar";

const bikeImg = "https://www.figma.com/api/mcp/asset/35e5ed29-e59c-4710-a888-21f11a1394a4";
const fridgeImg = "https://www.figma.com/api/mcp/asset/4ab76670-f761-46a7-9f88-6fad6dd3109f";
const textbooksImg = "https://www.figma.com/api/mcp/asset/2892c185-1b33-4075-808a-a63cb5e27dcc";
const laptopImg = "https://www.figma.com/api/mcp/asset/60147299-9838-4982-8155-e0593c5b8423";
const deskLampImg = "https://www.figma.com/api/mcp/asset/01ed2d5c-58b4-467e-b006-b130632f40df";
const calcImg = "https://www.figma.com/api/mcp/asset/0d3b783d-b199-4106-8ac6-58dcdbe32185";

const items = [
  { id: "vintage-road-bike", title: "Vintage Road Bike", price: "$45", badge: "Repairable", badgeColor: "#ffca98", badgeText: "#7a532b", desc: "Needs a new chain and some tire patching, but otherwise solid frame.", location: "West Village", img: bikeImg },
  { id: "mini-fridge", title: "Mini Fridge", price: "Trade", badge: "Like New", badgeColor: "#c1ecd4", badgeText: "#002114", desc: "Trading for a microwave. Works perfectly, clean inside.", location: "University Library", img: fridgeImg },
  { id: "bio-textbooks", title: "Bio 101 Textbooks", price: "Free", badge: "Used - Good", badgeColor: "#e2e3db", badgeText: "#1a1c18", desc: "Some highlighting, but all pages intact. Need gone by Friday.", location: "Science Building", img: textbooksImg },
  { id: "macbook-pro", title: "Older Macbook Pro", price: "$120", badge: "Repairable", badgeColor: "#ffca98", badgeText: "#7a532b", desc: "Battery needs replacing soon, runs a bit slow. Good for parts or basic use.", location: "North Quad", img: laptopImg },
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />

      <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px] leading-tight">Marketplace</h1>
            <p className="text-[#414844] text-lg mt-1">Give items a second life on campus.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 bg-[#e8e9e1] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-full hover:bg-[#d8d9d1] transition-colors">
              My Listings
            </Link>
            <Link href="/create-listing" className="flex items-center gap-2 bg-[#1b4332] text-[#86af99] text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-full shadow-[0px_4px_6px_rgba(27,67,50,0.15)] hover:bg-[#012d1d] transition-colors">
              List an Item
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#c1c8c2] overflow-hidden">
          {["All", "For Sale", "Free", "Trade", "Repairable"].map((tab, i) => (
            <button key={tab} className={`pb-3 text-xs font-semibold tracking-[0.6px] transition-colors ${i === 0 ? "text-[#012d1d] border-b-2 border-[#012d1d]" : "text-[#414844]"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Main Grid + Sidebar */}
        <div className="grid grid-cols-12 gap-8">
          {/* Content */}
          <div className="col-span-9 flex flex-col gap-6">
            {/* Search + Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="#6b7280" strokeWidth="1.5"/><path d="M14 14l-2-2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input className="bg-white border border-[#c1c8c2] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#6b7280] w-52 outline-none" placeholder="Search marketplace..." />
              </div>
              <div className="flex gap-2">
                {["Category", "Price", "Condition"].map((f) => (
                  <button key={f} className="flex items-center gap-1 border border-[#c1c8c2] rounded-full px-4 py-1.5 text-xs font-semibold text-[#414844] tracking-[0.6px]">
                    {f}
                    <svg width="7" height="4" viewBox="0 0 7 4" fill="none"><path d="M1 1l2.5 2L6 1" stroke="#414844" strokeWidth="1.2"/></svg>
                  </button>
                ))}
                <button className="flex items-center gap-2 bg-[#e8e9e1] border border-[#c1c8c2] rounded-full px-4 py-1.5 text-xs font-semibold text-[#1a1c18] tracking-[0.6px]">
                  🔧 Repair Needed
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-6">
              {items.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.id}`} className="bg-white border border-[rgba(193,200,194,0.3)] rounded-xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(27,67,50,0.04)] hover:shadow-[0px_8px_24px_0px_rgba(27,67,50,0.1)] transition-shadow flex flex-col">
                  <div className="h-48 bg-[#e2e3db] relative overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 backdrop-blur-sm bg-white/90 text-[#012d1d] text-[10px] font-bold tracking-[1px] px-2 py-1 rounded flex items-center gap-1">
                      ↻ Recirculated
                    </span>
                    <span className="absolute top-3 right-3 text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded" style={{ backgroundColor: item.badgeColor, color: item.badgeText }}>
                      {item.badge}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[#1a1c18] text-xl leading-7">{item.title}</h3>
                      <span className="font-semibold text-[#012d1d] text-2xl leading-8">{item.price}</span>
                    </div>
                    <p className="text-[#414844] text-sm leading-[21px] mb-4 flex-1">{item.desc}</p>
                    <div className="border-t border-[rgba(193,200,194,0.5)] pt-4 flex items-center gap-1">
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="none"><path d="M5.5 1C3.015 1 1 3.015 1 5.5 1 8.985 5.5 13 5.5 13S10 8.985 10 5.5C10 3.015 7.985 1 5.5 1z" stroke="#414844" strokeWidth="1.2"/><circle cx="5.5" cy="5.5" r="1.5" stroke="#414844" strokeWidth="1.2"/></svg>
                      <span className="font-semibold text-[#414844] text-xs tracking-[0.6px]">{item.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Impact Strip */}
            <div className="bg-[#012d1d] rounded-xl py-6 px-28 flex items-center justify-between shadow-[0px_4px_6px_rgba(27,67,50,0.2)]">
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-white text-[32px] tracking-[-0.64px]">1,245</span>
                <span className="font-semibold text-[#a5d0b9] text-xs tracking-[0.6px] uppercase">Items Recirculated</span>
              </div>
              <div className="bg-[rgba(193,236,212,0.3)] w-px h-16" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-white text-[32px] tracking-[-0.64px]">$15.4k</span>
                <span className="font-semibold text-[#f0bd8b] text-xs tracking-[0.6px] uppercase">Student Savings</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-[#f3f4ec] border border-[rgba(193,200,194,0.2)] rounded-xl p-6 flex flex-col gap-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#1a1c18" strokeWidth="1.5"/><path d="M5 9h8M9 5v8" stroke="#1a1c18" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <h2 className="font-semibold text-[#1a1c18] text-xl">My Activity</h2>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[#414844] text-xs tracking-[0.6px]">Active Listings</span>
                  <span className="font-semibold text-[#012d1d] text-2xl">3</span>
                </div>
                <div className="bg-[#e2e3db] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#1b4332] h-2 rounded-full w-3/4" />
                </div>
              </div>
              <div className="border-t border-[rgba(193,200,194,0.3)] pt-4 flex flex-col gap-4">
                <span className="font-semibold text-[#414844] text-xs tracking-[0.6px]">Recent Bids &amp; Views</span>
                {[
                  { img: deskLampImg, name: "IKEA Desk Lamp", sub: "2 new bids" },
                  { img: calcImg, name: "TI-84 Calculator", sub: "14 views today" },
                ].map((item) => (
                  <div key={item.name} className="bg-white border border-[rgba(193,200,194,0.3)] rounded-lg p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#e2e3db] rounded overflow-hidden shrink-0">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1c18] text-sm leading-5 truncate">{item.name}</p>
                      <p className="font-bold text-[#414844] text-[10px] tracking-[1px]">{item.sub}</p>
                    </div>
                    <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M1 1l8 7.5L1 16" stroke="#414844" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
