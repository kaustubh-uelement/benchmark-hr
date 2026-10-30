export type DemoAccount = { email: string; label: string; role: string };

/** Demo logins shown on sign-in pages. All use the password Demo@2026. */
export const DEMO_ACCOUNTS: Record<string, DemoAccount[]> = {
  group: [
    { email: "anand@benchmarkhr.in", label: "Anand Joshi", role: "Group admin" },
    { email: "partner@goldenglove.in", label: "Ishita Rao", role: "Golden Glove partner" },
    { email: "success@exh1b.com", label: "Meera Kulkarni", role: "ExH1B lead" },
    { email: "hiring@benchmarktalent.in", label: "Rohan Bhide", role: "Talent lead" },
    { email: "coach@trustcircle.in", label: "Nandini Bhosale", role: "TrustCircle coach" },
    { email: "advisory@benchmarkhr.in", label: "Kavya Menon", role: "Advisory principal" },
  ],
  exh1b: [
    { email: "priya.nair@example.com", label: "Priya Nair", role: "Member, active, Seattle" },
    { email: "aarav.mehta@example.com", label: "Aarav Mehta", role: "Member, lapsed, Dublin" },
  ],
  "golden-glove": [
    { email: "radhika.iyer@kaveridigitalbank.example", label: "Radhika Iyer", role: "Client, CHRO" },
    { email: "karan.saxena@indrayanipayments.example", label: "Karan Saxena", role: "Client, CEO" },
  ],
  talent: [{ email: "arjun.malhotra@lumenfieldtechnologiesindia.example", label: "Arjun Malhotra", role: "Client, site leader" }],
  trustcircle: [
    { email: "vikram.patwardhan@sahyadrimobility.example", label: "Vikram Patwardhan", role: "Client, Head of HR" },
    { email: "sanjay.kulkarni@example.com", label: "Sanjay Kulkarni", role: "Participant" },
  ],
  advisory: [{ email: "sneha.patil@orbitwisesaas.example", label: "Sneha Patil", role: "Client, CEO" }],
};
