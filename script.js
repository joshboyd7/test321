
const map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 12,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// File locations
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/joshboyd7/test321/main/data";
const COMBINED_GEOJSON_URL = `${GITHUB_RAW_BASE}/combined_pagerank.geojson`;
const COMBINED_CSV_URL = `${GITHUB_RAW_BASE}/combined_pagerank.csv`;

let fullGeojsonData = null;

function getColorScale(value) {
  if (value == null) return '#ccc';
  return value > 0.01 ? '#08306b' :
         value > 0.005 ? '#2171b5' :
         value > 0.001 ? '#6baed6' :
         value > 0 ? '#c6dbef' :
                     '#f7fbff';
}

function loadLayer(layer, year, column) {
  if (!fullGeojsonData) {
    fetch(COMBINED_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        fullGeojsonData = data;
        updateMap(layer, year, column);
      })
      .catch(err => console.error("Failed to load combined GeoJSON:", err));
  } else {
    updateMap(layer, year, column);
  }
}

function updateMap(layer, year, column) {
  const filtered = {
    ...fullGeojsonData,
    features: fullGeojsonData.features.filter(f =>
      f.properties.layer === layer &&
      f.properties.year === parseInt(year) &&
      f.properties[column] != null
    )
  };

  if (window.currentLayer) map.removeLayer(window.currentLayer);

  window.currentLayer = L.geoJSON(filtered, {
    style: feature => ({
      color: "#555",
      weight: 1,
      fillOpacity: 0.7,
      fillColor: getColorScale(feature.properties[column])
    }),
    onEachFeature: (feature, layer) => {
      const val = feature.properties[column];
      const name = feature.properties.name || feature.properties.id;
      layer.bindPopup(`<strong>${name}</strong><br>${column}: ${val != null ? val.toFixed(5) : "N/A"}`);
    }
  }).addTo(map);
}

function getCurrentParams() {
  const year = document.getElementById('year-select').value;
  const layer = document.querySelector('input[name="layer"]:checked').value;
  const column = document.getElementById('column-select').value;
  return { layer, year, column };
}

document.getElementById('year-select').addEventListener('change', () => {
  const { layer, year, column } = getCurrentParams();
  loadLayer(layer, year, column);
});

document.querySelectorAll('input[name="layer"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const { layer, year, column } = getCurrentParams();
    loadLayer(layer, year, column);
  });
});

document.getElementById('column-select').addEventListener('change', () => {
  const { layer, year, column } = getCurrentParams();
  loadLayer(layer, year, column);
});

document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = COMBINED_CSV_URL;
  link.download = 'combined_pagerank.csv';
  link.click();
});

// Initial load — use 'metro' even if user has 'county' selected
window.addEventListener('load', () => {
  const { layer, year, column } = getCurrentParams();
  loadLayer(layer, year, column);
});

