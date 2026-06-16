/**
 * New Zealand Regional Tourism Organisations (RTOs).
 *
 * Source: https://rtnz.org.nz/regionaltourismorganisations/ (north → south).
 * The official members page currently lists these 30 RTOs. The product brief
 * referenced "33"; if an authoritative 33-entry list is provided, extend this
 * array — onboarding validates submitted values against RTO_SET, so adding
 * names here is the only change required.
 *
 * Stored verbatim in suppliers.rto_json (a JSON array of these names).
 */
export const NZ_RTOS = [
  "Northland Inc",
  "Tātaki Auckland Unlimited",
  "Destination Hauraki Coromandel",
  "Tourism Bay of Plenty",
  "Hamilton & Waikato Tourism",
  "RotoruaNZ",
  "Tairāwhiti Gisborne",
  "Destination Great Lake Taupō",
  "Visit Ruapehu",
  "Venture Taranaki",
  "Hawke's Bay Tourism",
  "Whanganui & Partners",
  "Central Economic Development Agency",
  "Destination Wairarapa",
  "WellingtonNZ",
  "Destination Marlborough",
  "Nelson Tasman",
  "Visit Hurunui",
  "Destination Kaikōura",
  "Development West Coast",
  "ChristchurchNZ",
  "Mackenzie Tourism",
  "Venture Timaru",
  "Tourism Waitaki",
  "Destination Queenstown",
  "Lake Wānaka Tourism",
  "Tourism Central Otago",
  "Enterprise Dunedin",
  "Great South",
  "Clutha Development",
] as const;

export type Rto = (typeof NZ_RTOS)[number];

/** Validation set for server-side filtering of submitted RTO selections. */
export const RTO_SET: ReadonlySet<string> = new Set(NZ_RTOS);
