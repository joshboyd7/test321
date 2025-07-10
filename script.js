let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

// Human-readable labels
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

// === Column Selector ===
function getSelectedColumn() {
  const type = document.getElementById("filter-type-select").value;

  if (type === "race") {
    return `race_${document.getElementById("race-select").value}`;
  }
  if (type === "age") {
    const val = document.getElementById("age-select").value;
    return `age_${val.replace("+", "plus").replace("-", "_")}`;
  }
  if (type === "education") {
    return `educ_${document.getElementById("educ-select").value}`;
  }
  if (type === "industry") {
    const code = document.getElementById("industry-input").value.trim();
    return `industry_${code}`;
  }
  if (type === "total") {
    return document.getElementById("total-select").value === "HH"
      ? "total_flowHH"
      : "total_flowPER";
  }

  return null;
}

// === Load Data ===
function loadLayer(column) {
  fetch("data/combined_pagerank.geojson")
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
          console.warn("Could not fit bounds:", e);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load GeoJSON:", err);
    });
}

// === Color Scale ===
function getColor(d) {
  if (d == null || isNaN(d)) return "#ccc";
  return d > 0.01 ? "#a50f15" :
         d > 0.005 ? "#de2d26" :
         d > 0.001 ? "#fc9272" :
         d > 0 ? "#fee0d2" :
                 "#f7fbff";
}

// === Map Refresh ===
function refreshMap() {
  if (geoLayer) map.removeLayer(geoLayer);

  const geography = document.querySelector('input[name="geography"]:checked').value;
  let url;

  if (geography === "county") {
    // always IRS county
    url = "output/irs_county_pagerank_combined.geojson";
  } else {
    // metro: ACS or IRS
    const src = document.getElementById("metro-source-select").value;
    url = src === "irs"
      ? "output/irs_pagerank_combined.geojson"
      : "output/pagerank_combined.geojson";
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      geojsonData = data;
      drawLayer(getSelectedColumn());
    })
    .catch(console.error);
}


// === Filter Visibility ===
function updateFilterVisibility() {
  const val = document.getElementById("filter-type-select").value;

  const wrappers = {
    race: document.getElementById("race-wrapper"),
    age: document.getElementById("age-wrapper"),
    education: document.getElementById("educ-wrapper"),
    industry: document.getElementById("industry-wrapper"),
    total: document.getElementById("total-wrapper")
  };

  Object.keys(wrappers).forEach(key => {
    if (wrappers[key]) {
      wrappers[key].classList.toggle("hidden", key !== val);
    }
  });
}

// === Setup Events ===
function setupEventListeners() {
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

  const ind = document.getElementById("industry-input");
  if (ind) ind.addEventListener("input", refreshMap);

document.getElementById("download").addEventListener("click", () => {
  const geo = document.querySelector('input[name="geography"]:checked').value;
  let href, filename;

  if (geo === "county") {
    href     = "output/irs_county_pagerank_combined.csv";
    filename = "irs_county_pagerank_combined.csv";
  } else {
    const src = document.getElementById("metro-source-select").value;
    if (src === "irs") {
      href     = "output/irs_pagerank_combined.csv";
      filename = "irs_pagerank_combined.csv";
    } else {
      href     = "output/pagerank_combined.csv";
      filename = "pagerank_combined.csv";
    }
  }

  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
});


}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateFilterVisibility(); // show correct filter block
  refreshMap();             // draw the first valid layer
});
