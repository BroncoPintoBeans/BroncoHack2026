import SiteInfoPage from "@/components/SiteInfoPage";

export default function CampusMapPage() {
  return (
    <SiteInfoPage
      eyebrow="Campus Exchange Guide"
      title="Campus Map"
      intro="Use these campus-oriented exchange zones as practical meeting points while the app grows toward a fully interactive map."
      sections={[
        {
          title: "Public exchange areas",
          body: "Choose visible, high-traffic locations such as the University Library entrance, Bronco Student Center, or other public campus spaces during regular hours.",
        },
        {
          title: "Pickup location tips",
          body: "Listings should use general campus locations rather than private rooms, dorm numbers, or personal addresses. Confirm exact timing through messages.",
        },
        {
          title: "Repair-friendly meetups",
          body: "For repair-needed items, pick locations with tables, good lighting, and enough space to inspect the item before deciding whether to trade, buy, or repair.",
        },
      ]}
    />
  );
}
