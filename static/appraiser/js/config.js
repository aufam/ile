// ==================== CONFIG & FORMATTERS ====================
// Sample Placeholder SVG Data URIs for device simulation
const SAMPLE_IMAGES = {
  jewelry: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231e293b'/><circle cx='200' cy='150' r='70' stroke='%23d4af37' stroke-width='16' fill='none'/><polygon points='200,90 220,130 180,130' fill='%2338bdf8'/><text x='50%' y='85%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>Sample Jewelry Item Photo</text></svg>",
  scale: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f172a'/><rect x='80' y='60' width='240' height='120' rx='10' fill='%230284c7'/><text x='200' y='130' text-anchor='middle' fill='%23ffffff' font-size='36' font-weight='bold' font-family='monospace'>12.45 g</text><text x='50%' y='85%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>Precision Scale Readout</text></svg>",
  xrf: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2318181b'/><path d='M 50 200 Q 120 40 180 180 T 350 200' stroke='%2310b981' stroke-width='4' fill='none'/><text x='200' y='80' text-anchor='middle' fill='%2334d399' font-size='20' font-family='sans-serif'>Au: 75.2% (18.05K)</text><text x='50%' y='88%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>XRF Spectrometry Peak</text></svg>"
};

const APPRAISER_SESSION_KEY = 'ile_appraiser_session';

// Rupiah formatter
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function parseRupiah(value) {
  return Number(value.replace(/\D/g, ""));
}

function formatRupiah(value) {
  return value ? rupiahFormatter.format(value) : "";
}
