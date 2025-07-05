
// Initialize the map
const map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 12,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// URLs for your combined files
const GITHUB_RAW_BASE       = "https://raw.githubusercontent.com/joshboyd7/test321/main/data";
const COMBINED_GEOJSON_URL  = `${GITHUB_RAW_BASE}/combined_pagerank.geojson`;
const COMBINED_CSV_URL      = `${GITHUB_RAW_BASE}/combined_pagerank.csv`;

let fullGeojsonData = null;

// Color ramp helper (unchanged)
function getColorScale(value) {
  if (value == null) return '#ccc';
  return value > 0.01 ? '#08306b' :
         value > 0.005 ? '#2171b5' :
         value > 0.001 ? '#6baed6' :
         value > 0 ? '#c6dbef' :
                     '#f7fbff';
}

// Fetch once, then draw
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

// MAIN DRAW FUNCTION
function updateMap(layer, year, column) {
  const filtered = {
    ...fullGeojsonData,
    features: fullGeojsonData.features.filter(f => {
      // Always match on geography and metric...
      const matchesLayer  = f.properties.layer  === layer;
      const matchesColumn = f.properties[column] != null;
      // ...but only filter by year if county
      const matchesYear   = (layer === "county")
        ? f.properties.year === parseInt(year)
        : true;
      return matchesLayer && matchesYear && matchesColumn;
    })
  };

  // If nothing to show, warn and bail
  if (filtered.features.length === 0) {
    console.warn(`No data for layer=${layer}, year=${year}, column=${column}`);
    return;
  }

  // Remove old layer, add new
  if (window.currentLayer) map.removeLayer(window.currentLayer);
  window.currentLayer = L.geoJSON(filtered, {
    style: feature => ({
      color: "#555",
      weight: 1,
      fillOpacity: 0.7,
      fillColor: getColorScale(feature.properties[column])
    }),
    onEachFeature: (feature, lyr) => {
      const val  = feature.properties[column];
      const name = feature.properties.name || feature.properties.id;
      lyr.bindPopup(`<strong>${name}</strong><br>${column}: ${val != null ? val.toFixed(5) : "N/A"}`);
    }
  }).addTo(map);
}

// Grab UI values (year may be null when metro)
function getCurrentParams() {
  const layer = document.querySelector('input[name="layer"]:checked').value;
  const yearEl = document.getElementById('year-select');
  return {
    layer,
    year: yearEl ? yearEl.value : null,
    column: document.getElementById('column-select').value
  };
}

// SIDEBAR TOGGLING: show year only for county
const countyOptions = document.getElementById('county-options');
const metroOptions  = document.getElementById('metro-options');
document.querySelectorAll('input[name="layer"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'county' && radio.checked) {
      countyOptions.classList.remove('hidden');
      metroOptions.classList.add('hidden');
    }
    if (radio.value === 'metro' && radio.checked) {
      countyOptions.classList.add('hidden');
      metroOptions.classList.remove('hidden');
    }
    const { layer, year, column } = getCurrentParams();
    loadLayer(layer, year, column);
  });
});

// Re-load on metric or year change
document.getElementById('column-select').addEventListener('change', () => {
  const { layer, year, column } = getCurrentParams();
  loadLayer(layer, year, column);
});
const yearSelect = document.getElementById('year-select');
if (yearSelect) {
  yearSelect.addEventListener('change', () => {
    const { layer, year, column } = getCurrentParams();
    loadLayer(layer, year, column);
  });
}

// CSV Download button
document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = COMBINED_CSV_URL;
  link.download = 'combined_pagerank.csv';
  link.click();
});

// INITIAL LOAD (metro default, ignores year)
window.addEventListener('load', () => {
  const { layer, year, column } = getCurrentParams();
  loadLayer(layer, year, column);
});
