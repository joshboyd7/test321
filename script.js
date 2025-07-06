
let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

// Human-readable labels for popup display
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
  "educ_WithCollege": "With College"
};

// Get column name based on UI selections
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
    const code = document.getElementById("industry-input").value.trim();
    return `industry_${code}`;
  }

  if (filterType === "total") {
    return document.getElementById("total-select").value === "HH"
      ? "total_flowHH"
      : "total_flowPER";
  }

  return null; // no valid column yet
}

// Main load function
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
          const name = feature.properties.metro_name || feature.properties.NAME || "Unnamed";
          const val = feature.properties[column];
          const label = LABEL_MAP[column] || column;
          layer.bindPopup(`<strong>${name}</strong><br>${label}: ${val?.toFixed?.(5) ?? "N/A"}`);
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
      console.error("Failed to load GeoJSON:", err);
    });
}

// Map color scale
function getColor(d) {
  if (d == null || isNaN(d)) return "#ccc";
  return d > 0.01 ? "#a50f15" :
         d > 0.005 ? "#de2d26" :
         d > 0.001 ? "#fc9272" :
         d > 0 ? "#fee0d2" :
                 "#f7fbff";
}

// Decide when to load data
function refreshMap() {
  const geography = document.querySelector('input[name="geography"]:checked')?.value;
  if (geography !== "metro") {
    if (geoLayer) map.removeLayer(geoLayer);
    return;
  }

  const column = getSelectedColumn();
  if (column) {
    loadLayer(column);
  }
}

// Filter UI toggle visibility
function updateFilterVisibility() {
  const type = document.getElementById("filter-type-select").value;
  document.getElementById("race-wrapper").classList.toggle("hidden", type !== "race");
  document.getElementById("age-wrapper").classList.toggle("hidden", type !== "age");
  document.getElementById("educ-wrapper").classList.toggle("hidden", type !== "education");
  document.getElementById("industry-wrapper").classList.toggle("hidden", type !== "industry");
  document.getElementById("total-wrapper").classList.toggle("hidden", type !== "total");
}

// =======================
// Hook up event listeners
// =======================
document.querySelectorAll('input[name="geography"]').forEach(radio => {
  radio.addEventListener("change", refreshMap);
});

document.getElementById("filter-type-select").addEventListener("change", () => {
  updateFilterVisibility();
  refreshMap();
});

["race-select", "age-select", "educ-select", "total-select"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", refreshMap);
});

document.getElementById("industry-input").addEventListener("input", refreshMap);

document.getElementById("download").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = "data/combined_pagerank.csv";
  a.download = "combined_pagerank.csv";
  a.click();
});

// ====================
// Load map on first run
// ====================
updateFilterVisibility();
refreshMap();
