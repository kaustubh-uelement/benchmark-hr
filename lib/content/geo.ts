/**
 * World location directory: every ISO-3166 country, with states and cities
 * loaded for the countries Benchmark HR's members move between most often.
 * Countries without a state list fall back to a free-text city field.
 * Extend by adding entries to STATES — the pickers read from the database.
 */

const ISO =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );

const REGION: Record<string, string> = {
  IN: "South Asia", US: "North America", CA: "North America", GB: "Europe", IE: "Europe", DE: "Europe",
  NL: "Europe", FR: "Europe", IS: "Europe", SE: "Europe", CH: "Europe", AE: "Middle East", SA: "Middle East",
  QA: "Middle East", SG: "Asia Pacific", AU: "Asia Pacific", NZ: "Asia Pacific", JP: "Asia Pacific",
};

export function countryList() {
  const dn = new Intl.DisplayNames(["en"], { type: "region" });
  return ISO.map((code) => ({ code, name: dn.of(code) ?? code, region: REGION[code] ?? null }))
    .filter((c) => c.name && c.name !== c.code)
    .sort((a, b) => a.name.localeCompare(b.name));
}

type StateDef = [string, string[]];

export const STATES: Record<string, StateDef[]> = {
  IN: [
    ["Andhra Pradesh", ["Visakhapatnam", "Vijayawada", "Tirupati"]],
    ["Assam", ["Guwahati"]],
    ["Bihar", ["Patna"]],
    ["Chandigarh", ["Chandigarh"]],
    ["Chhattisgarh", ["Raipur"]],
    ["Delhi", ["New Delhi"]],
    ["Goa", ["Panaji"]],
    ["Gujarat", ["Ahmedabad", "Vadodara", "Surat", "Gandhinagar (GIFT City)"]],
    ["Haryana", ["Gurugram", "Faridabad"]],
    ["Himachal Pradesh", ["Shimla"]],
    ["Jharkhand", ["Ranchi", "Jamshedpur"]],
    ["Karnataka", ["Bengaluru", "Mysuru", "Mangaluru"]],
    ["Kerala", ["Kochi", "Thiruvananthapuram", "Kozhikode"]],
    ["Madhya Pradesh", ["Indore", "Bhopal"]],
    ["Maharashtra", ["Mumbai", "Pune", "Nagpur", "Nashik", "Navi Mumbai", "Thane"]],
    ["Odisha", ["Bhubaneswar"]],
    ["Punjab", ["Mohali", "Ludhiana", "Amritsar"]],
    ["Rajasthan", ["Jaipur", "Udaipur"]],
    ["Tamil Nadu", ["Chennai", "Coimbatore", "Madurai"]],
    ["Telangana", ["Hyderabad"]],
    ["Uttar Pradesh", ["Noida", "Lucknow", "Greater Noida"]],
    ["Uttarakhand", ["Dehradun"]],
    ["West Bengal", ["Kolkata"]],
  ],
  US: [
    ["California", ["San Francisco", "San Jose", "Los Angeles", "San Diego", "Sunnyvale"]],
    ["Washington", ["Seattle", "Redmond", "Bellevue"]],
    ["Texas", ["Austin", "Dallas", "Houston", "Plano"]],
    ["New York", ["New York City", "Buffalo"]],
    ["New Jersey", ["Jersey City", "Edison", "Princeton"]],
    ["Illinois", ["Chicago", "Naperville"]],
    ["Massachusetts", ["Boston", "Cambridge"]],
    ["Georgia", ["Atlanta"]],
    ["North Carolina", ["Charlotte", "Raleigh"]],
    ["Virginia", ["Arlington", "Reston"]],
    ["Pennsylvania", ["Philadelphia", "Pittsburgh"]],
    ["Michigan", ["Detroit", "Ann Arbor"]],
    ["Arizona", ["Phoenix"]],
    ["Colorado", ["Denver"]],
    ["Florida", ["Miami", "Tampa", "Orlando"]],
    ["Ohio", ["Columbus", "Cincinnati"]],
    ["Minnesota", ["Minneapolis"]],
    ["Oregon", ["Portland"]],
  ],
  GB: [
    ["England", ["London", "Manchester", "Birmingham", "Cambridge", "Reading", "Leeds"]],
    ["Scotland", ["Edinburgh", "Glasgow"]],
    ["Wales", ["Cardiff"]],
    ["Northern Ireland", ["Belfast"]],
  ],
  CA: [
    ["Ontario", ["Toronto", "Ottawa", "Waterloo", "Mississauga"]],
    ["British Columbia", ["Vancouver", "Surrey"]],
    ["Alberta", ["Calgary", "Edmonton"]],
    ["Quebec", ["Montreal"]],
  ],
  DE: [
    ["Bavaria", ["Munich", "Nuremberg"]],
    ["Berlin", ["Berlin"]],
    ["Hesse", ["Frankfurt"]],
    ["Baden-Württemberg", ["Stuttgart", "Karlsruhe"]],
    ["Hamburg", ["Hamburg"]],
  ],
  IE: [
    ["Leinster", ["Dublin", "Kildare"]],
    ["Munster", ["Cork", "Limerick"]],
    ["Connacht", ["Galway"]],
  ],
  AE: [
    ["Dubai", ["Dubai"]],
    ["Abu Dhabi", ["Abu Dhabi"]],
    ["Sharjah", ["Sharjah"]],
  ],
  SG: [["Singapore", ["Singapore"]]],
  AU: [
    ["New South Wales", ["Sydney"]],
    ["Victoria", ["Melbourne"]],
    ["Queensland", ["Brisbane"]],
    ["Western Australia", ["Perth"]],
  ],
  NL: [
    ["North Holland", ["Amsterdam"]],
    ["South Holland", ["Rotterdam", "The Hague"]],
    ["North Brabant", ["Eindhoven"]],
  ],
  IS: [["Capital Region", ["Reykjavík"]]],
  NZ: [["Auckland", ["Auckland"]], ["Wellington", ["Wellington"]]],
  SA: [["Riyadh Province", ["Riyadh"]], ["Eastern Province", ["Dammam"]], ["Makkah Province", ["Jeddah"]]],
  QA: [["Doha", ["Doha"]]],
  JP: [["Tokyo", ["Tokyo"]], ["Osaka", ["Osaka"]]],
  SE: [["Stockholm County", ["Stockholm"]]],
  CH: [["Zürich", ["Zürich"]], ["Geneva", ["Geneva"]]],
};

/** The eleven Indian metros used by the cost-of-living comparator and quick picks. */
export const INDIA_METROS = [
  "Bengaluru", "Hyderabad", "Pune", "Mumbai", "New Delhi", "Gurugram", "Noida", "Chennai", "Kolkata", "Ahmedabad", "Kochi",
];

/** Indicative monthly costs in INR (mid-range, one professional household). Replace with a live feed before launch. */
export const COST_OF_LIVING: Record<string, [number, number, number, number, number, number]> = {
  //            1BHK   2BHK   groceries transport utilities dining
  Bengaluru: [32000, 48000, 12000, 6000, 5500, 9000],
  Hyderabad: [24000, 36000, 10500, 5000, 5000, 7500],
  Pune: [22000, 34000, 10500, 5000, 5000, 7500],
  Mumbai: [45000, 75000, 13000, 6500, 6000, 11000],
  "New Delhi": [30000, 48000, 11500, 6000, 6500, 9500],
  Gurugram: [32000, 50000, 12000, 7000, 6500, 10000],
  Noida: [22000, 34000, 10500, 5500, 6000, 8000],
  Chennai: [22000, 35000, 10500, 5000, 5000, 7500],
  Kolkata: [17000, 27000, 9500, 4500, 4500, 6500],
  Ahmedabad: [17000, 27000, 9500, 4500, 4500, 6500],
  Kochi: [16000, 26000, 10000, 4500, 4500, 6000],
};
