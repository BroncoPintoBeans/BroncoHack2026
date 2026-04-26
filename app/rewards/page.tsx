import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";

const achievements = [
  { label: "First Item Recirculated", earned: true, icon: "🏅" },
  { label: "5 Items Traded", earned: true, icon: "⭐" },
  { label: "Repair Veteran (3 Verdicts)", earned: true, icon: "🔧" },
  { label: "Green Champion", earned: false, icon: "🌿" },
  { label: "Campus Hero (50 Items)", earned: false, icon: "🏆" },
  { label: "Zero Waste Pioneer", earned: false, icon: "♻️" },
];

const activity = [
  { action: "Sold Mountain Bike", points: "+50 pts", date: "Apr 24", color: "#c1ecd4" },
  { action: "Repair Verdict: MacBook", points: "+30 pts", date: "Apr 20", color: "#ffdcbd" },
  { action: "Gave Away Textbooks", points: "+20 pts", date: "Apr 15", color: "#c1ecd4" },
  { action: "Traded Mini Fridge", points: "+40 pts", date: "Apr 10", color: "#c1ecd4" },
];

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-10">
        <BackButton fallbackHref="/home" label="Back to Home" />
        {/* Header */}
        <div>
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">Rewards &amp; Impact</h1>
          <p className="text-[#414844] text-lg mt-1">Your sustainability journey, visualized.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#1b4332] rounded-2xl p-8 flex flex-col items-center gap-3 shadow-[0px_4px_20px_rgba(27,67,50,0.15)]">
            <span className="text-5xl">🌱</span>
            <p className="font-bold text-white text-4xl">1,240</p>
            <p className="font-semibold text-[#a5d0b9] text-sm tracking-[0.6px] uppercase">Green Points</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-[#a5d0b9] h-2 rounded-full" style={{ width: "62%" }} />
            </div>
            <p className="text-white/60 text-xs">760 pts to next level</p>
          </div>
          <div className="bg-white border border-[#e2e3db] rounded-2xl p-8 flex flex-col items-center gap-3 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]">
            <span className="text-5xl">♻️</span>
            <p className="font-bold text-[#012d1d] text-4xl">12</p>
            <p className="text-[#414844] text-sm tracking-[0.6px]">Items Recirculated</p>
            <div className="w-full bg-[#e2e3db] rounded-full h-2 mt-2">
              <div className="bg-[#1b4332] h-2 rounded-full" style={{ width: "80%" }} />
            </div>
            <p className="text-[#717973] text-xs">Goal: 15 items</p>
          </div>
          <div className="bg-[#e2e3db] rounded-2xl p-8 flex flex-col items-center gap-3 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]">
            <span className="text-5xl">🌍</span>
            <p className="font-bold text-[#1b4332] text-4xl">28kg</p>
            <p className="text-[#414844] text-sm tracking-[0.6px]">CO₂ Prevented</p>
            <div className="w-full bg-[#c1c8c2] rounded-full h-2 mt-2">
              <div className="bg-[#1b4332] h-2 rounded-full" style={{ width: "56%" }} />
            </div>
            <p className="text-[#717973] text-xs">Equiv. to 2 flights avoided</p>
          </div>
        </div>

        {/* Achievements + Activity */}
        <div className="grid grid-cols-2 gap-8">
          {/* Achievements */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Achievements</h2>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((a) => (
                <div key={a.label} className={`rounded-xl p-4 flex flex-col items-center gap-2 text-center border ${a.earned ? "bg-white border-[#c1ecd4] shadow-[0px_4px_10px_rgba(27,67,50,0.08)]" : "bg-[#f3f4ec] border-[#e2e3db] opacity-50"}`}>
                  <span className="text-3xl">{a.icon}</span>
                  <span className="text-[#1a1c18] text-xs font-semibold leading-tight">{a.label}</span>
                  {a.earned && <span className="text-[#274e3d] text-[10px] font-semibold tracking-[0.6px]">EARNED</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Recent Activity</h2>
            <div className="bg-white border border-[#e2e3db] rounded-xl overflow-hidden shadow-[0px_4px_10px_rgba(27,67,50,0.06)]">
              {activity.map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < activity.length - 1 ? "border-b border-[#e2e3db]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color === "#c1ecd4" ? "#1b4332" : "#7d562d" }} />
                    <span className="text-[#1a1c18] text-sm">{item.action}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[#012d1d] text-sm">{item.points}</span>
                    <span className="text-[#717973] text-xs">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard teaser */}
            <div className="bg-[#012d1d] rounded-xl p-5 flex items-center gap-4">
              <span className="text-3xl">🏆</span>
              <div className="flex-1">
                <p className="font-semibold text-white text-base">Campus Leaderboard</p>
                <p className="text-white/70 text-sm">You&apos;re ranked #7 on campus this month!</p>
              </div>
              <button className="bg-[#ffca98] text-[#7a532a] text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg">View All</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
