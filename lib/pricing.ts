export function estimateEventPrice(input: {
  guestCount?: number | null;
  eventType?: string | null;
  serviceCount?: number;
  indoorOutdoor?: string | null;
}) {
  let price = 1000;
  const guestCount = input.guestCount ?? 0;
  const serviceCount = input.serviceCount ?? 0;

  if (guestCount > 50) price += 800;
  if (guestCount > 120) price += 1500;
  if (guestCount > 200) price += 2500;
  if (input.eventType === "Wedding") price += 1200;
  if (input.eventType === "Corporate Event") price += 900;
  if (input.indoorOutdoor?.toLowerCase() === "outdoor") price += 500;

  price += serviceCount * 250;
  return price;
}
