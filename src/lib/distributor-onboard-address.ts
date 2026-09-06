export const DISTRIBUTOR_MARKET_COUNTRIES = [
  "Canada",
  "United States",
  "Japan",
  "France",
  "Italy",
  "United Kingdom",
  "Other",
] as const;

export type DistributorMarketCountry = (typeof DISTRIBUTOR_MARKET_COUNTRIES)[number];

const CA_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

const JP_PREFECTURES = [
  "Hokkaido",
  "Aomori",
  "Iwate",
  "Miyagi",
  "Akita",
  "Yamagata",
  "Fukushima",
  "Ibaraki",
  "Tochigi",
  "Gunma",
  "Saitama",
  "Chiba",
  "Tokyo",
  "Kanagawa",
  "Niigata",
  "Toyama",
  "Ishikawa",
  "Fukui",
  "Yamanashi",
  "Nagano",
  "Gifu",
  "Shizuoka",
  "Aichi",
  "Mie",
  "Shiga",
  "Kyoto",
  "Osaka",
  "Hyogo",
  "Nara",
  "Wakayama",
  "Tottori",
  "Shimane",
  "Okayama",
  "Hiroshima",
  "Yamaguchi",
  "Tokushima",
  "Kagawa",
  "Ehime",
  "Kochi",
  "Fukuoka",
  "Saga",
  "Nagasaki",
  "Kumamoto",
  "Oita",
  "Miyazaki",
  "Kagoshima",
  "Okinawa",
] as const;

const FR_REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
] as const;

const IT_REGIONS = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardy",
  "Marche",
  "Molise",
  "Piedmont",
  "Puglia",
  "Sardinia",
  "Sicily",
  "Tuscany",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
] as const;

const UK_NATIONS = ["England", "Scotland", "Wales", "Northern Ireland"] as const;

const SUBDIVISIONS: Record<string, readonly string[]> = {
  Canada: CA_PROVINCES,
  "United States": US_STATES,
  Japan: JP_PREFECTURES,
  France: FR_REGIONS,
  Italy: IT_REGIONS,
  "United Kingdom": UK_NATIONS,
};

export function regionLabelForCountry(country: string): string {
  switch (country) {
    case "Canada":
      return "Province / territory";
    case "United States":
      return "State";
    case "Japan":
      return "Prefecture";
    case "France":
    case "Italy":
      return "Region";
    case "United Kingdom":
      return "Nation";
    default:
      return "State / province / district";
  }
}

export function subdivisionsForCountry(country: string): readonly string[] {
  return SUBDIVISIONS[country] ?? [];
}

export function formatDistributorShippingAddress(parts: {
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}): string {
  const street = parts.street.trim();
  const city = parts.city.trim();
  const region = parts.region.trim();
  const postal = parts.postal.trim();
  const country = parts.country.trim();
  const locality = [city, region, postal].filter(Boolean).join(", ");
  return [street, locality, country].filter(Boolean).join(", ");
}

export function resolvedDistributorCountry(market: string, otherCountry: string): string {
  if (market === "Other") return otherCountry.trim();
  return market.trim();
}
