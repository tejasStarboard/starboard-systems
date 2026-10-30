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

export const defaultPorts: Array<{
  unlocode: string
  zipcode: string
  stateId: string
  countryId: string
}> = [
  {
    unlocode: "CNSHA",
    zipcode: "200000",
    stateId: "CN-SH",
    countryId: "CN",
  },
  {
    unlocode: "USLAX",
    zipcode: "90731",
    stateId: "US-CA",
    countryId: "US",
  },
  {
    unlocode: "NLRTM",
    zipcode: "3000",
    stateId: "NL-ZH",
    countryId: "NL",
  },
  {
    unlocode: "DEHAM",
    zipcode: "20457",
    stateId: "DE-HH",
    countryId: "DE",
  },
  {
    unlocode: "SGSIN",
    zipcode: "018989",
    stateId: "SG-01",
    countryId: "SG",
  },
  {
    unlocode: "INNSA",
    zipcode: "400707",
    stateId: "IN-MH",
    countryId: "IN",
  },
]
