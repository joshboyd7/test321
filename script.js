
const map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 12,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// CHANGE THIS
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/your-username/insurance-map-data/main/data";

function getGeoJSONUrl(layer, year) {
  return `${GITHUB_RAW_BASE}/${layer}_${year}.geojson`;
}

function loadLayer(layer, year) {
  const url = getGeoJSONUrl(layer, year);
  fetch(url)
    .then(res => res.json())
    .then(geojson => {
      if (window.currentLayer) map.removeLayer(window.currentLayer);
      window.currentLayer = L.geoJSON(geojson, {
        style: feature => ({ color: "#2171b5", weight: 1, fillOpacity: 0.7 })
      }).addTo(map);
    })
    .catch(err => console.error("Failed to load layer:", err));
}

loadLayer("county", "2023");

document.getElementById('year-select').addEventListener('change', e => {
  const year = e.target.value;
  const layer = document.querySelector('input[name="layer"]')?.value || "county";
  loadLayer(layer, year);
});

document.querySelectorAll('input[name="layer"]').forEach(radio => {
  radio.addEventListener('change', e => {
    const layer = e.target.value;
    const year = document.getElementById('year-select').value;
    loadLayer(layer, year);
  });
});

document.getElementById('download').addEventListener('click', () => {
  const geography = document.querySelector('input[name="geography"]:checked').value;

  let filename = null;

  if (geography === "county") {
    const source = document.getElementById('source-select').value;
    const year = document.getElementById('year-select').value;
    filename = `${source}_${year}.csv`;
  } else if (geography === "metro") {
    const filterType = document.getElementById('filter-type-select').value;

    if (filterType === "none") {
      filename = `total.csv`;
    } else if (filterType === "race") {
      const race = document.getElementById('race-select').value;
      filename = `race_${race}.csv`;
    } else if (filterType === "age") {
      const age = document.getElementById('age-select').value.replace("+", "plus").replace("-", "_");
      filename = `age_${age}.csv`;
    } else if (filterType === "industry") {
      const naics = document.getElementById('industry-input').value;
      filename = `industry_${naics}.csv`;
    }
  }

  if (filename) {
    const csvUrl = `${GITHUB_RAW_BASE}/geojson_export/${filename}`;
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = filename;
    link.click();
  }
});
