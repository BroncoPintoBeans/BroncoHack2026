import SiteInfoPage from "@/components/SiteInfoPage";

export default function TermsPage() {
  return (
    <SiteInfoPage
      eyebrow="Bronco Repair Desk"
      title="Terms of Service"
      intro="Bronco Repair Desk helps Cal Poly Pomona students list items, request repair guidance, and coordinate reuse on campus. These terms summarize how the prototype should be used responsibly."
      sections={[
        {
          title: "Campus marketplace use",
          body: "Listings should describe real items accurately, including condition, price, trade expectations, and pickup location. Students are responsible for completing exchanges respectfully and safely.",
        },
        {
          title: "Repair guidance",
          body: "Repair verdicts are educational estimates, not professional guarantees. Use caution with electronics, batteries, sharp tools, and anything involving heat, electricity, or structural safety.",
        },
        {
          title: "Community standards",
          body: "Do not post prohibited, unsafe, counterfeit, stolen, or misleading items. Messages and listings should stay relevant to campus reuse, repair, and student-to-student exchange.",
        },
      ]}
    />
  );
}
