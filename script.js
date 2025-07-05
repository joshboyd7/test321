const map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 12,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// CHANGE THIS
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/joshboyd7/test321/main/data";
const COMBINED_GEOJSON_URL = `${GITHUB_RAW_BASE}/combined_pagerank.geojson`;
const COMBINED_CSV_URL = `${GITHUB_RAW_BASE}/combined_pagerank.csv`;

let fullGeojsonData = null;

function filterGeoJSON(data, layer, year) {
  return {
    ...data,
    features: data.features.filter(f =>
      f.properties.layer === layer && f.properties.year === parseInt(year)
    )
  };
}

function loadLayer(layer, year) {
  if (!fullGeojsonData) {
    fetch(COMBINED_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        fullGeojsonData = data;
        updateMap(layer, year);
      })
      .catch(err => console.error("Failed to load combined GeoJSON:", err));
  } else {
    updateMap(layer, year);
  }
}

function updateMap(layer, year) {
  const filtered = filterGeoJSON(fullGeojsonData, layer, year);
  if (window.currentLayer) map.removeLayer(window.currentLayer);
  window.currentLayer = L.geoJSON(filtered, {
    style: feature => ({ color: "#2171b5", weight: 1, fillOpacity: 0.7 })
  }).addTo(map);
}

// Initial load
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
  // Optional: Add filtering logic here if needed to let users download filtered CSVs
  const link = document.createElement('a');
  link.href = COMBINED_CSV_URL;
  link.download = 'combined_pagerank.csv';
  link.click();
});

