import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import SupportResourcesClient from "@/components/support/SupportResourcesClient";
import { listSupportResources } from "@/lib/db/support/resources";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const resources = await listSupportResources();

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-8">
        <BackButton fallbackHref="/home" label="Back" alwaysNavigate />

        <header className="flex flex-col gap-2">
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px] leading-tight">
            Support
          </h1>
          <p className="text-[#414844] text-base">
            On-campus technical help resources for repairs, troubleshooting, and making.
          </p>
        </header>

        <SupportResourcesClient resources={resources} />
      </main>
    </div>
  );
}

