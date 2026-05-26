/**
 * TransLogic AI — Realistic Indian Truck Pricing Calculator
 * 
 * Based on real market data:
 * - 10,000 kg, ~300 km, High urgency, Normal weather = ₹18,000
 * - Rates calibrated from actual Indian trucking costs:
 *   Fuel (₹8-12/km) + Driver wages (₹3-5/km) + Tolls (₹2-4/km) + Maintenance (₹3-5/km)
 * 
 * Weight tiers reflect actual vehicle categories:
 * - Mini Van (up to 500 kg):             ₹15/km
 * - Pickup Truck (500–3,000 kg):         ₹25/km
 * - LCV / Light Commercial (3,000–7,000 kg): ₹35/km
 * - Full Truckload (7,000–15,000 kg):    ₹46/km
 * - Heavy Truck / Multi-Axle (15,000+ kg): ₹62/km
 * 
 * Urgency multipliers:
 * - Low:    1.0x (standard, flexible timing)
 * - Medium: 1.15x (priority, within a day)
 * - High:   1.3x (immediate dispatch)
 * 
 * Weather surcharge:
 * - Rain:          +10%
 * - Storm/Thunder: +15%
 * - Clear/Clouds:  no surcharge
 */

function calculatePrice(distanceKm, weightKg, urgency, weather) {
  const dist = parseFloat(distanceKm) || 0;
  const kg   = parseFloat(weightKg)   || 0;

  // ── Rate per km based on weight tier ──────────────────────────────────────
  let ratePerKm;
  if (kg <= 500) {
    ratePerKm = 15;    // Mini Van
  } else if (kg <= 3000) {
    ratePerKm = 25;    // Pickup Truck
  } else if (kg <= 7000) {
    ratePerKm = 35;    // Light Commercial Vehicle (LCV)
  } else if (kg <= 15000) {
    ratePerKm = 46;    // Full Truckload (FTL) — 9-10 ton lorry
  } else {
    ratePerKm = 62;    // Heavy Truck / Multi-Axle
  }

  let price = ratePerKm * dist;

  // ── Urgency multiplier ────────────────────────────────────────────────────
  const urgencyFactor = {
    Low:    1.0,     // Standard delivery
    Medium: 1.15,    // Priority delivery
    High:   1.3,     // Urgent / Immediate dispatch
  };
  price *= urgencyFactor[urgency] || 1.15;

  // ── Weather-based surcharge ───────────────────────────────────────────────
  if (weather && typeof weather === 'string') {
    const w = weather.toLowerCase();
    if (w.includes('storm') || w.includes('thunder')) {
      price *= 1.15;   // +15% storm surcharge
    } else if (w.includes('rain')) {
      price *= 1.10;   // +10% rain surcharge
    }
    // Clear / cloudy: no surcharge
  }

  // ── Minimum price (no trip below ₹500) ────────────────────────────────────
  if (price < 500) price = 500;

  return Math.round(price);
}

module.exports = calculatePrice;
