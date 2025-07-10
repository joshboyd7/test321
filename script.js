/* global L */
const MAPBOX_TOKEN = "";            // ← add token if you want Mapbox tiles
const MAP_CENTRE  = [39, -98];
const MAP_ZOOM    = 4.2;

// -----------------------------------------------------------------------------
// helper: colour scale for rank (1 = best → dark blue; worst = light red)
function rankColor(rank, maxRank) {
  if (!rank) return "#ccc";
  const t = (rank - 1) / (maxRank - 1);      // 0 (best) → 1 (worst)
  const r = Math.round(255 * t);
  const g = Math.round(255 * (1 - t) * 0.6);
  const b = Math.round(255 * (1 - t));
  return `rgb(${r},${g},${b})`;
}
// -----------------------------------------------------------------------------
// map init
const map = L.map("map").setView(MAP_CENTRE, MAP_ZOOM);
L.tileLayer(
  `https://tile.openstreetmap.org/{z}/{x}/{y}.png`,
  { attribution: "&copy; OpenStreetMap" }
).addTo(map);

// state
let currentLayer = null;
let geojsonData  = null;     // loaded file
let maxRankCache = {};       // memoised max rank per col

// UI elements
const geoRadio  = document.querySelectorAll('input[name="geography"]');
const metroBox  = document.getElementById("metro-options");
const filterSel = id => document.getElementById(id);

// -----------------------------------------------------------------------------
// build column name based on UI selections
function selectedColumn() {
  const geo = document.querySelector('input[name="geography"]:checked').value;
  if (geo === "county") {                   // county = IRS only
    const year = 2017;                      // or make dropdown if needed
    return `irs_county_rank_${year}`;
  }
  // metro
  const src   = filterSel("metro-source-select").value;   // acs / irs
  const type  = filterSel("filter-type-select").value;

  if (type === "total")   return `${src}_total_flow${filterSel("total-select").value}_rank`;
  if (type === "race")    return `${src}_race_${filterSel("race-select").value}_rank`;
  if (type === "age")     return `${src}_age_${filterSel("age-select").value}_rank`;
  if (type === "education") return `${src}_educ_${filterSel("educ-select").value}_rank`;
  if (type === "industry")  {
    const code = filterSel("industry-input").value.padStart(2,"0");
    return `${src}_industry_${code}_rank`;
  }
  return `${src}_metro_rank_2017`;          // default fallback
}

// -----------------------------------------------------------------------------
// load correct GeoJSON file based on geography
async function loadData() {
  const geo = document.querySelector('input[name="geography"]:checked').value;
  const url = geo === "metro"
    ? "output/irs_pagerank_combined.geojson"          // this includes ACS + IRS metro ranks
    : "output/irs_county_pagerank_combined.geojson";  // county (IRS only)

  const res  = await fetch(url);
  geojsonData = await res.json();
  drawLayer();
}

// -----------------------------------------------------------------------------
// draw / redraw layer
function drawLayer() {
  if (currentLayer) map.removeLayer(currentLayer);
  const col = selectedColumn();
  if (!col || !geojsonData) return;

  // memoise max rank to keep colour scale stable
  if (!maxRankCache[col]) {
    maxRankCache[col] = geojsonData.features
      .map(f => +f.properties[col])
      .filter(x => x > 0)
      .reduce((a,b) => Math.max(a,b), 0);
  }
  const maxRank = maxRankCache[col];

  currentLayer = L.geoJSON(geojsonData, {
    style: f => ({
      color: "#666", weight: 0.5, fillOpacity: 0.8,
      fillColor: rankColor(+f.properties[col], maxRank)
    }),
    onEachFeature: (f, layer) => {
      layer.bindTooltip(`<strong>${f.properties.NAME || f.properties.metro_name}</strong><br>
                         Rank: ${f.properties[col] ?? "N/A"}`);
    }
  }).addTo(map);
}

// -----------------------------------------------------------------------------
// UI reactions
function syncUI() {
  // show / hide metro controls
  const geo = document.querySelector('input[name="geography"]:checked').value;
  metroBox.classList.toggle("hidden", geo === "county");

  // sub-filter visibility
  const type = filterSel("filter-type-select").value;
  ["total","race","age","education","industry"].forEach(t => {
    filterSel(`${t}-wrapper`).classList.toggle("hidden", type !== t);
  });
  drawLayer();
}

// listeners
[...geoRadio].forEach(r => r.addEventListener("change", () => { loadData(); syncUI(); }));
document.getElementById("metro-source-select").addEventListener("change", syncUI);
document.getElementById("filter-type-select").addEventListener("change", syncUI);
["total-select","race-select","age-select","educ-select","industry-input"].forEach(id =>
  filterSel(id).addEventListener("input", syncUI));

// initial load
loadData().then(syncUI);

