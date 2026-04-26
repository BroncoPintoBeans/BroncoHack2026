import Navbar from "@/components/Navbar";
import BackToPreviousPageButton from "@/components/BackToPreviousPageButton";

type InfoSection = {
  title: string;
  body: string;
};

type SiteInfoPageProps = {
  title: string;
  eyebrow: string;
  intro: string;
  sections: InfoSection[];
};

export default function SiteInfoPage({ title, eyebrow, intro, sections }: SiteInfoPageProps) {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[960px] mx-auto px-6 py-14">
        <div className="mb-8">
          <BackToPreviousPageButton />
        </div>
        <p className="font-semibold text-[#1b4332] text-xs tracking-[0.6px] uppercase mb-3">{eyebrow}</p>
        <h1 className="font-bold text-[#012d1d] text-[36px] leading-tight tracking-tight">{title}</h1>
        <p className="text-[#414844] text-lg leading-8 mt-4 max-w-[760px]">{intro}</p>

        <div className="mt-10 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="bg-white border border-[rgba(193,200,194,0.45)] rounded-xl p-6 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]">
              <h2 className="font-semibold text-[#1a1c18] text-xl mb-2">{section.title}</h2>
              <p className="text-[#414844] text-base leading-7">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
