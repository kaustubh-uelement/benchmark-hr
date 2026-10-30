/**
 * Relocation Hub content.
 *
 * Items marked "*" apply to everyone; the rest apply only to members whose
 * current country matches. This replaces the US-only list seen in the Loom
 * walkthrough. All guidance is general information and must be signed off by
 * a qualified tax and immigration adviser before launch (status shown in UI).
 */
export type RelocationDef = { section: string; title: string; detail: string; appliesTo: string[] };

const S_DOCS = "Documents & legal";
const S_FIN = "Financial";
const S_HOME = "Housing & settling in";
const S_FAM = "Family & personal";
const S_LEAVE = "Before you leave";

export const RELOCATION_ITEMS: RelocationDef[] = [
  // Documents & legal (everyone)
  { section: S_DOCS, title: "Check passport validity for every family member", detail: "Renew any passport expiring within 12 months before you move; renewals are slower once you are mid-move.", appliesTo: ["*"] },
  { section: S_DOCS, title: "Confirm your entry status for India", detail: "Indian citizens enter on their passport. Foreign citizens of Indian origin usually use an OCI card; others need the visa that matches their purpose, such as an Employment Visa.", appliesTo: ["*"] },
  { section: S_DOCS, title: "Update Aadhaar and PAN details", detail: "Update your address and mobile number on Aadhaar and make sure your PAN is linked, so banking and payroll onboarding are not held up.", appliesTo: ["*"] },
  { section: S_DOCS, title: "Get degree and experience documents attested if needed", detail: "Some employers and regulators ask for attested or apostilled copies of foreign degrees and experience letters.", appliesTo: ["*"] },
  { section: S_DOCS, title: "Collect relieving letters and payslips", detail: "Indian employers usually ask for your last relieving letter and three to six months of payslips for background checks.", appliesTo: ["*"] },
  // Financial (everyone)
  { section: S_FIN, title: "Work out your Indian tax residency for the year you return", detail: "Your status for the tax year (April to March) depends on days spent in India. Many returnees are 'resident but not ordinarily resident' (RNOR) for their first years back. See the Tax Residency card.", appliesTo: ["*"] },
  { section: S_FIN, title: "Redesignate NRE and NRO accounts", detail: "Tell your bank when you become resident. NRE and NRO accounts must be converted to resident accounts; you can move foreign currency into an RFC account.", appliesTo: ["*"] },
  { section: S_FIN, title: "Review overseas investments and retirement accounts", detail: "Decide what to keep abroad and what to bring back, and note any foreign assets you will need to report in your Indian return once resident.", appliesTo: ["*"] },
  { section: S_FIN, title: "Arrange health insurance from day one", detail: "Overseas cover usually ends when you leave. Buy an Indian retail policy, or confirm your new employer's group cover starts on your joining date.", appliesTo: ["*"] },
  { section: S_FIN, title: "Plan currency transfers", detail: "Compare bank and fintech rates for large transfers and keep records of the source of funds.", appliesTo: ["*"] },
  { section: S_FIN, title: "Update KYC with mutual funds and brokers", detail: "Change your residential status with your demat account, mutual fund houses and insurers.", appliesTo: ["*"] },
  { section: S_FIN, title: "Build a credit history in India", detail: "A resident credit card or small loan helps rebuild a CIBIL score that may have gone thin while you were away.", appliesTo: ["*"] },
  // Housing & settling in
  { section: S_HOME, title: "Shortlist neighbourhoods near your workplace", detail: "Use the cost-of-living comparator above, then look at commute times at peak hours.", appliesTo: ["*"] },
  { section: S_HOME, title: "Book temporary housing for the first month", detail: "Serviced apartments give you time to view rentals in person.", appliesTo: ["*"] },
  { section: S_HOME, title: "Budget for a rental deposit", detail: "Security deposits are often two to ten months' rent depending on the city; Bengaluru tends to be highest.", appliesTo: ["*"] },
  { section: S_HOME, title: "Register a rental agreement", detail: "Get the lease registered or notarised as your city requires; you will need it as address proof.", appliesTo: ["*"] },
  { section: S_HOME, title: "Get an Indian mobile number before you land", detail: "Many banking and delivery apps need an Indian number for OTPs.", appliesTo: ["*"] },
  { section: S_HOME, title: "Book international movers and get quotes", detail: "Compare door-to-door quotes and check rules on Transfer of Residence for duty-free personal effects.", appliesTo: ["*"] },
  { section: S_HOME, title: "Plan a car or two-wheeler", detail: "Convert your foreign driving experience into an Indian licence; an international driving permit is valid only for a limited period.", appliesTo: ["*"] },
  { section: S_HOME, title: "Set up utilities and internet", detail: "Broadband installation can take a week in some areas, so book it early if you work remotely.", appliesTo: ["*"] },
  // Family & personal
  { section: S_FAM, title: "Shortlist schools and check admission windows", detail: "Most Indian schools admit in December to March for a June start; ask about board (CBSE, ICSE, IB, IGCSE) and mid-year transfers.", appliesTo: ["*"] },
  { section: S_FAM, title: "Plan your spouse's work and visa status", detail: "If your spouse is a foreign national, check their entry status and work permission before you move.", appliesTo: ["*"] },
  { section: S_FAM, title: "Move pets with the right import permit", detail: "India requires a No Objection Certificate and health certificates for pet imports; start three months ahead.", appliesTo: ["*"] },
  { section: S_FAM, title: "Carry medical records and prescriptions", detail: "Bring a summary of each family member's medical history and generic names for regular medicines.", appliesTo: ["*"] },
  // United States
  { section: S_LEAVE, title: "Decide what to do with your 401(k) and IRA", detail: "Leaving it invested, rolling it into an IRA or withdrawing all have different US and Indian tax effects. Get advice before withdrawing.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "File your final US return (Form 1040 or 1040-NR)", detail: "Your departure year may be a dual-status year. Keep track of your exact departure date.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "Plan for FBAR and FATCA reporting", detail: "US persons with foreign accounts above the threshold report them annually (FBAR). Green card holders keep US filing duties until status is formally given up.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "Close or convert US bank accounts and cards", detail: "Keep one account with low fees for residual payments and cancel credit cards you will not use.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "Sort out your H-1B and I-94 records", detail: "Keep copies of your I-797, I-94 and final payslips; they help if you return to the US later.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "Cancel leases, utilities and car insurance", detail: "Give notice early; many leases require 60 days.", appliesTo: ["US"] },
  { section: S_LEAVE, title: "Request a Social Security earnings statement", detail: "Download your record from ssa.gov; it matters if you ever claim US benefits.", appliesTo: ["US"] },
  // United Kingdom
  { section: S_LEAVE, title: "Tell HMRC you are leaving (form P85)", detail: "Use P85 to claim any tax refund and to confirm your non-resident status.", appliesTo: ["GB"] },
  { section: S_LEAVE, title: "Decide on voluntary National Insurance contributions", detail: "Voluntary contributions can protect your UK State Pension record.", appliesTo: ["GB"] },
  { section: S_LEAVE, title: "Review ISAs, pensions and your UK bank account", detail: "You can keep an ISA but cannot add to it once non-resident. Check pension transfer rules before moving any money.", appliesTo: ["GB"] },
  { section: S_LEAVE, title: "End your tenancy and council tax", detail: "Give notice to your landlord and close council tax, energy and broadband accounts.", appliesTo: ["GB"] },
  // Canada
  { section: S_LEAVE, title: "File your departure return with the CRA", detail: "Canada may treat some assets as sold on the day you leave (departure tax).", appliesTo: ["CA"] },
  { section: S_LEAVE, title: "Plan your RRSP and TFSA", detail: "Withdrawals from an RRSP after you leave usually carry Canadian withholding tax.", appliesTo: ["CA"] },
  // Ireland
  { section: S_LEAVE, title: "Get your final payslip and close your Revenue record", detail: "Ask your employer for your final payslip and check your Revenue record for any refund.", appliesTo: ["IE"] },
  { section: S_LEAVE, title: "Check your PRSI record and pension", detail: "Your PRSI contributions can count towards an Irish State Pension later.", appliesTo: ["IE"] },
  // UAE
  { section: S_LEAVE, title: "Collect your end-of-service gratuity", detail: "Confirm the gratuity calculation and settlement date with your employer before your last working day.", appliesTo: ["AE"] },
  { section: S_LEAVE, title: "Cancel your residence visa and Emirates ID", detail: "Your employer cancels your visa; leave within the grace period and close any bank liabilities first.", appliesTo: ["AE"] },
  // Singapore
  { section: S_LEAVE, title: "Get tax clearance (IR21) arranged", detail: "Your employer files IR21 with IRAS before you stop work; final salary may be withheld until it clears.", appliesTo: ["SG"] },
  // Germany
  { section: S_LEAVE, title: "Deregister your address (Abmeldung)", detail: "Deregister at the Bürgeramt and keep the certificate for banks and insurers.", appliesTo: ["DE"] },
  { section: S_LEAVE, title: "Check refund rules for German pension contributions", detail: "Depending on your citizenship and years paid, you may be able to claim back contributions after leaving.", appliesTo: ["DE"] },
  // Australia
  { section: S_LEAVE, title: "Claim your superannuation (DASP) after you leave", detail: "Temporary residents can claim super through a Departing Australia Superannuation Payment once their visa ends.", appliesTo: ["AU"] },
  // Netherlands / Iceland / generic other
  { section: S_LEAVE, title: "Deregister with your municipality", detail: "Deregister from the population register and keep the confirmation.", appliesTo: ["NL", "IS", "SE", "CH"] },
  { section: S_LEAVE, title: "Close your local tax and social security records", detail: "Ask the tax office for a final assessment and keep your social security statement.", appliesTo: ["NL", "IS", "SE", "CH", "NZ", "JP", "SA", "QA"] },
];

export type VisaCard = { key: string; title: string; who: string; points: string[]; caution: string };

export const VISA_CARDS: VisaCard[] = [
  {
    key: "oci",
    title: "OCI (Overseas Citizen of India)",
    who: "Foreign citizens of Indian origin, and foreign spouses of Indian citizens or OCI holders (conditions apply). Indian citizens cannot hold an OCI card.",
    points: [
      "Lifelong, multiple-entry visa for India.",
      "Lets you live and work in India without a separate Employment Visa for most private-sector jobs.",
      "Some activities still need special permission, such as research, journalism, missionary work, and visits to protected or restricted areas.",
      "OCI holders cannot vote, hold constitutional posts or buy agricultural land.",
    ],
    caution: "Rules change by notification. Check the current rules on the official OCI portal before travelling.",
  },
  {
    key: "pio",
    title: "PIO card (legacy)",
    who: "Holders of the old Person of Indian Origin card.",
    points: [
      "The PIO scheme was merged into OCI in 2015.",
      "PIO cards must be converted to OCI cards; check whether your existing card is still accepted for travel.",
    ],
    caution: "Convert to OCI before you plan a move rather than relying on a PIO card.",
  },
  {
    key: "employment-visa",
    title: "Employment Visa",
    who: "Foreign nationals without OCI who will be employed by an organisation in India.",
    points: [
      "Issued for a specific employer and role; salary thresholds apply.",
      "Register with the FRRO within the required period after arrival if your visa needs it.",
      "Changing employer usually means a new visa.",
    ],
    caution: "Your employer, or ExH1B as Employer of Record, should guide the application.",
  },
  {
    key: "tax-residency",
    title: "Tax residency in India",
    who: "Everyone returning, including Indian citizens.",
    points: [
      "Your status is decided for each tax year (1 April to 31 March).",
      "182 days or more in India in the tax year makes you resident.",
      "A second test (60 days in the year plus 365 days over the previous four years) can also apply; for Indian citizens and persons of Indian origin visiting India, the 60 days is replaced by 182, or by 120 if Indian income exceeds ₹15 lakh.",
      "Many returnees are 'resident but not ordinarily resident' (RNOR) at first, for example if they were non-resident in 9 of the previous 10 years. While RNOR, most foreign income is not taxed in India.",
    ],
    caution: "These rules interact with US, UK and other tax treaties. Confirm your status with a chartered accountant.",
  },
];

export const CONTENT_REVIEW = {
  status: "Pending sign-off",
  note: "General information only, not tax or legal advice. Awaiting review by a qualified tax and immigration adviser before launch.",
};
