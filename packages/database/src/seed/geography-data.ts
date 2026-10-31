export const defaultCountries: Array<{ id: string; name: string }> = [
  { id: "CN", name: "China" },
  { id: "US", name: "United States" },
  { id: "NL", name: "Netherlands" },
  { id: "DE", name: "Germany" },
  { id: "SG", name: "Singapore" },
  { id: "IN", name: "India" },
]

export const defaultStates: Array<{
  id: string
  name: string
  countryId: string
}> = [
  { id: "CN-SH", name: "Shanghai", countryId: "CN" },
  { id: "US-CA", name: "California", countryId: "US" },
  { id: "NL-ZH", name: "South Holland", countryId: "NL" },
  { id: "DE-HH", name: "Hamburg", countryId: "DE" },
  { id: "SG-01", name: "Singapore", countryId: "SG" },
  { id: "IN-MH", name: "Maharashtra", countryId: "IN" },
]

/** Minimal facility gazetteer seed (ports + airports). Expand via UN/LOCODE import later. */
export const defaultFacilities: Array<{
  id: string
  unlocode?: string | null
  iata?: string | null
  name: string
  facilityTypes: string[]
  countryCode: string
  admin1?: string | null
  cityName?: string | null
  aliases?: string[]
  latitude?: number | null
  longitude?: number | null
  isPrimary?: boolean
}> = [
  {
    id: "CNSHA",
    unlocode: "CNSHA",
    name: "Shanghai",
    facilityTypes: ["seaport"],
    countryCode: "CN",
    admin1: "Shanghai",
    cityName: "Shanghai",
    aliases: ["Shanghai Port"],
    latitude: 31.2304,
    longitude: 121.4737,
    isPrimary: true,
  },
  {
    id: "USLAX",
    unlocode: "USLAX",
    name: "Los Angeles",
    facilityTypes: ["seaport"],
    countryCode: "US",
    admin1: "California",
    cityName: "Los Angeles",
    aliases: ["LA", "Port of Los Angeles"],
    latitude: 33.7361,
    longitude: -118.2639,
    isPrimary: true,
  },
  {
    id: "NLRTM",
    unlocode: "NLRTM",
    name: "Rotterdam",
    facilityTypes: ["seaport"],
    countryCode: "NL",
    admin1: "South Holland",
    cityName: "Rotterdam",
    aliases: ["Port of Rotterdam"],
    latitude: 51.9225,
    longitude: 4.4792,
    isPrimary: true,
  },
  {
    id: "DEHAM",
    unlocode: "DEHAM",
    name: "Hamburg",
    facilityTypes: ["seaport"],
    countryCode: "DE",
    admin1: "Hamburg",
    cityName: "Hamburg",
    aliases: ["Port of Hamburg"],
    latitude: 53.5461,
    longitude: 9.9661,
    isPrimary: true,
  },
  {
    id: "SGSIN",
    unlocode: "SGSIN",
    name: "Singapore",
    facilityTypes: ["seaport"],
    countryCode: "SG",
    cityName: "Singapore",
    aliases: ["PSA", "Port of Singapore"],
    latitude: 1.2644,
    longitude: 103.822,
    isPrimary: true,
  },
  {
    id: "INNSA",
    unlocode: "INNSA",
    name: "Nhava Sheva",
    facilityTypes: ["seaport"],
    countryCode: "IN",
    admin1: "Maharashtra",
    cityName: "Nhava Sheva",
    aliases: ["Jawaharlal Nehru Port", "JNPT"],
    latitude: 18.95,
    longitude: 72.95,
    isPrimary: true,
  },
  {
    id: "LAX",
    iata: "LAX",
    name: "Los Angeles International",
    facilityTypes: ["airport"],
    countryCode: "US",
    admin1: "California",
    cityName: "Los Angeles",
    aliases: ["LAX Airport"],
    latitude: 33.9425,
    longitude: -118.4081,
    isPrimary: true,
  },
  {
    id: "SIN",
    iata: "SIN",
    name: "Singapore Changi",
    facilityTypes: ["airport"],
    countryCode: "SG",
    cityName: "Singapore",
    aliases: ["Changi"],
    latitude: 1.3644,
    longitude: 103.9915,
    isPrimary: true,
  },
  {
    id: "PVG",
    iata: "PVG",
    name: "Shanghai Pudong",
    facilityTypes: ["airport"],
    countryCode: "CN",
    admin1: "Shanghai",
    cityName: "Shanghai",
    aliases: ["Pudong"],
    latitude: 31.1443,
    longitude: 121.8083,
    isPrimary: true,
  },
]
