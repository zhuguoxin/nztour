/**
 * Dropdown option sets for the learner onboarding form.
 * TODO: product to finalize these lists. Values are stored verbatim in the
 * users table; labels are shown as-is (English) for now.
 */

/** Country / Region — common source markets first, then "Other". */
export const COUNTRIES = [
  "New Zealand",
  "Australia",
  "China",
  "Hong Kong SAR",
  "Taiwan",
  "Singapore",
  "Malaysia",
  "Japan",
  "South Korea",
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Other",
] as const;

/** Business profile — the kind of travel business the learner works in. */
export const BUSINESS_PROFILES = [
  "Inbound tour operator",
  "Travel agency / retail",
  "Wholesaler",
  "Destination management company (DMC)",
  "Activity / attraction provider",
  "Accommodation",
  "Transport",
  "Other",
] as const;
