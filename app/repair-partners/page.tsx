import SiteInfoPage from "@/components/SiteInfoPage";

export default function RepairPartnersPage() {
  return (
    <SiteInfoPage
      eyebrow="Repair Network"
      title="Repair Partners"
      intro="Bronco Repair Desk is designed to connect students with practical repair paths, from peer help to campus sustainability programming."
      sections={[
        {
          title: "Peer repair helpers",
          body: "Students can use repair-needed listings and messages to find peers who are comfortable diagnosing devices, bikes, small appliances, or general gear.",
        },
        {
          title: "Campus sustainability teams",
          body: "The platform is built to support sustainability events, repair fairs, donation drives, and reuse campaigns that keep useful items circulating on campus.",
        },
        {
          title: "Future partner directory",
          body: "A later version can add verified shops, club repair nights, parts sources, safety notes, and appointment links directly from each repair verdict.",
        },
      ]}
    />
  );
}
