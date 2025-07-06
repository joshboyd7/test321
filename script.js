
let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

// Color scale
function getColor(d) {
  if (d == null || isNaN(d)) return '#cccccc';
  return d > 0.01 ? '#a50f15' :
         d > 0.005 ? '#de2d26' :
         d > 0.001 ? '#fc9272' :
         d > 0 ? '#fee0d2' :
                 '#f7fbff';
}

// Decide which column to use based on filter selection
function getSelectedColumn() {
  const filterType = document.getElementById("filter-type-select").value;

  if (filterType === "race") {
    const race = document.getElementById("race-select").value;
    return `race_${capitalize(race)}`;
  }

  if (filterType === "age") {
    const age = document.getElementById("age-select").value;
    return `age_${age.replace("+", "plus").replace("-", "_")}`;
  }

  if (filterType === "education") {
    const educ = document.getElementById("educ-select").value;
    return `educ_${educ}`;
  }

  if (filterType === "industry") {
    const naics = document.getElementById("industry-input").value.trim();
    return `industry_${naics}`;
  }

  return "total_flowHH"; // fallback default
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Load and draw the selected column
function loadLayer(column) {
  const filePath = "data/combined_pagerank.geojson";

  fetch(filePath)
    .then(res => res.json())
    .then(data => {
      if (!data.features || !Array.isArray(data.features)) {
        console.warn("Invalid GeoJSON structure");
        return;
      }

      const filtered = data.features.filter(f =>
        f.properties && f.properties[column] != null
      );

      if (geoLayer) map.removeLayer(geoLayer);

      geoLayer = L.geoJSON({ type: "FeatureCollection", features: filtered }, {
        style: feature => ({
          fillColor: getColor(feature.properties[column]),
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.8
        }),
        onEachFeature: (feature, layer) => {
          const name = feature.properties.NAME || feature.properties.name || feature.properties.metro_name || "Unnamed";
          const val = feature.properties[column];
          layer.bindPopup(`${name}<br><strong>${column}</strong>: ${val != null ? val.toFixed(5) : "N/A"}`);
        }
      }).addTo(map);

      if (filtered.length > 0) {
        try {
          map.fitBounds(geoLayer.getBounds());
        } catch (e) {
          console.warn("Could not fit map bounds:", e);
        }
      } else {
        console.warn(`No data found for column "${column}".`);
      }
    })
    .catch(err => {
      console.error("Failed to load GeoJSON file:", err);
    });
}

// Re-render the map with current filters
function refreshMap() {
  const column = getSelectedColumn();
  loadLayer(column);
}

// Initial render
refreshMap();

// UI event listeners
document.getElementById("filter-type-select").addEventListener("change", () => {
  updateFilterVisibility();
  refreshMap();
});

document.getElementById("race-select").addEventListener("change", refreshMap);
document.getElementById("age-select").addEventListener("change", refreshMap);
document.getElementById("educ-select")?.addEventListener("change", refreshMap);
document.getElementById("industry-input").addEventListener("input", refreshMap);

// Optional: Show/hide filter-specific selectors
function updateFilterVisibility() {
  const val = document.getElementById("filter-type-select").value;
  document.getElementById("race-wrapper").classList.toggle("hidden", val !== "race");
  document.getElementById("age-wrapper").classList.toggle("hidden", val !== "age");
  document.getElementById("educ-wrapper")?.classList.toggle("hidden", val !== "education");
  document.getElementById("industry-wrapper").classList.toggle("hidden", val !== "industry");
}

// Download
document.getElementById("download").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = "data/combined_pagerank.csv";
  a.download = "combined_pagerank.csv";
  a.click();
});
