let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

// Short name mapping
const LABEL_MAP = {
  "total_flowHH": "Total Household Flow",
  "total_flowPER": "Total Person Flow",
  "race_Black": "Black",
  "race_White": "White",
  "race_Hispanic": "Hispanic",
  "age_25_35": "Age 25–35",
  "age_35_65": "Age 35–65",
  "age_65plus": "Age 65+",
  "educ_NoCollege": "No College",
  "educ_WithCollege": "With College",
  // Add more friendly labels here if needed
};

// Pick column from current UI
function getSelectedColumn() {
  const filterType = document.getElementById("filter-type-select").value;

  if (filterType === "race") {
    return `race_${document.getElementById("race-select").value}`;
  }
  if (filterType === "age") {
    return `age_${document.getElementById("age-select").value}`;
  }
  if (filterType === "education") {
    return `educ_${document.getElementById("educ-select").value}`;
  }
  if (filterType === "industry") {
    return `industry_${document.getElementById("industry-input").value.trim()}`;
  }
  if (filterType === "total") {
    const val = document.getElementById("total-select").value;
    return val === "HH" ? "total_flowHH" : "total_flowPER";
  }

  return "total_flowHH"; // default fallback
}

// Redraw the map with selected column
function loadLayer(column) {
  const filePath = "data/combined_pagerank.geojson";

  fetch(filePath)
    .then(res => res.json())
    .then(data => {
      if (!data.features) return;

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
          const name = feature.properties.NAME || feature.properties.metro_name || "Unnamed";
          const val = feature.properties[column];
          const label = LABEL_MAP[column] || column;
          layer.bindPopup(`<strong>${name}</strong><br>${label}: ${val != null ? val.toFixed(5) : "N/A"}`);
        }
      }).addTo(map);

      if (filtered.length > 0) {
        try {
          map.fitBounds(geoLayer.getBounds());
        } catch (e) {
          console.warn("Could not fit bounds");
        }
      }
    })
    .catch(err => {
      console.error("Failed to load data:", err);
    });
}

// Handle visibility toggles
function updateFilterVisibility() {
  const val = document.getElementById("filter-type-select").value;
  document.getElementById("race-wrapper").classList.toggle("hidden", val !== "race");
  document.getElementById("age-wrapper").classList.toggle("hidden", val !== "age");
  document.getElementById("educ-wrapper").classList.toggle("hidden", val !== "education");
  document.getElementById("industry-wrapper").classList.toggle("hidden", val !== "industry");
  document.getElementById("total-wrapper").classList.toggle("hidden", val !== "total");
}

// Re-render map
function refreshMap() {
  const column = getSelectedColumn();
  loadLayer(column);
}

// Initial load
refreshMap();

// UI events
document.getElementById("filter-type-select").addEventListener("change", () => {
  updateFilterVisibility();
  refreshMap();
});
["race-select", "age-select", "educ-select", "industry-input", "total-select"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("change", refreshMap);
    if (el.tagName === "INPUT") el.addEventListener("input", refreshMap);
  }
});

document.getElementById("download").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = "data/combined_pagerank.csv";
  a.download = "combined_pagerank.csv";
  a.click();
});

