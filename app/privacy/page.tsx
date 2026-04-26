import SiteInfoPage from "@/components/SiteInfoPage";

export default function PrivacyPage() {
  return (
    <SiteInfoPage
      eyebrow="Bronco Repair Desk"
      title="Privacy Policy"
      intro="The app only uses account and marketplace information needed to run the student repair and reuse experience."
      sections={[
        {
          title: "Information used",
          body: "Bronco Repair Desk stores account identity, listing details, uploaded marketplace media, pickup notes, and messages that students choose to create in the app.",
        },
        {
          title: "How it is shown",
          body: "Active listings can be displayed to signed-in campus users with title, description, media, condition, category, price, and pickup location. Seller profile information is limited to marketplace context.",
        },
        {
          title: "Student control",
          body: "Students should avoid posting private contact details in public listing descriptions. Marketplace conversations are the intended place to coordinate next steps.",
        },
      ]}
    />
  );
}
