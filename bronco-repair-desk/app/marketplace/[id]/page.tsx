import Link from "next/link";
import Navbar from "@/components/Navbar";

const bikeImg = "https://www.figma.com/api/mcp/asset/35e5ed29-e59c-4710-a888-21f11a1394a4";
const laptopImg = "https://www.figma.com/api/mcp/asset/60147299-9838-4982-8155-e0593c5b8423";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const isBike = params.id === "vintage-road-bike";
  const item = isBike
    ? { title: "Vintage Road Bike", price: "$45", type: "sale", condition: "Repairable", img: bikeImg, location: "West Village", posted: "Apr 18, 2024", seller: "Alex C.", desc: "A beautiful vintage road bike with a solid steel frame. Needs a new chain and some tire patching, but the frame is in excellent shape and the gears shift smoothly. Perfect for someone who enjoys a weekend project.", repairs: ["New chain (~$15)", "Tire patch kit (~$5)", "Brake cable adjustment"] }
    : { title: "Older Macbook Pro", price: "$120", type: "sale", condition: "Repairable", img: laptopImg, location: "North Quad", posted: "Apr 10, 2024", seller: "Sam L.", desc: "An older MacBook Pro in repairable condition. Battery needs replacing soon, runs a bit slow but boots fine. Good for parts or basic use as a secondary machine.", repairs: ["Battery replacement (~$80)", "SSD upgrade (optional, ~$60)"] };

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <Link href="/marketplace" className="flex items-center gap-2 text-[#1b4332] text-sm font-semibold mb-6 hover:opacity-80">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-12 gap-10">
          {/* Image + Gallery */}
          <div className="col-span-7 flex flex-col gap-4">
            <div className="bg-[#e2e3db] rounded-2xl overflow-hidden h-[400px]">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#e2e3db] rounded-lg h-20 overflow-hidden opacity-60 cursor-pointer hover:opacity-100 transition-opacity">
                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#ffca98] text-[#7a532b] text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded">{item.condition}</span>
                <span className="text-[#717973] text-xs">Posted {item.posted}</span>
              </div>
              <h1 className="font-bold text-[#1a1c18] text-[28px] tracking-tight">{item.title}</h1>
              <p className="font-semibold text-[#012d1d] text-[32px]">{item.price}</p>
            </div>

            <p className="text-[#414844] text-base leading-relaxed">{item.desc}</p>

            <div className="flex items-center gap-2 text-[#414844] text-sm">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 1C3.686 1 1 3.686 1 7c0 4.418 6 10 6 10s6-5.582 6-10c0-3.314-2.686-6-6-6z" stroke="#414844" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" stroke="#414844" strokeWidth="1.2"/></svg>
              {item.location}
            </div>

            {/* Repair estimate card */}
            <div className="bg-[rgba(255,220,189,0.3)] border border-[#ffdcbd] rounded-xl p-4 flex flex-col gap-3">
              <p className="font-semibold text-[#1a1c18] text-sm">Estimated Repairs Needed</p>
              {item.repairs.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="#623f18" strokeWidth="1"/></svg>
                  <span className="text-[#414844] text-sm">{r}</span>
                </div>
              ))}
              <Link href="/repair/case-84920" className="text-[#1b4332] text-xs font-semibold tracking-[0.6px] underline mt-1">Get a Repair Verdict →</Link>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 p-4 bg-white border border-[#e2e3db] rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white font-semibold">
                {item.seller[0]}
              </div>
              <div>
                <p className="font-semibold text-[#1a1c18] text-sm">{item.seller}</p>
                <p className="text-[#717973] text-xs">4.8 ★ · 12 items traded</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link href="/messages" className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] py-4 rounded-xl text-center hover:bg-[#012d1d] transition-colors">
                Message Seller
              </Link>
              <button className="border border-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] py-3 rounded-xl hover:bg-[#f3f4ec] transition-colors">
                Save to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
