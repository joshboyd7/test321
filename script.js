
// script.js - Updated for combined ACS and IRS PageRank data

let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

const FILES = {
  county_irs: "data/irs_county_pagerank_combined.geojson",
  county_dataaxel: "data/dataaxel_county_pagerank_combined.geojson",
  metro_irs: "data/irs_pagerank_combined.geojson",
  metro_acs: "data/acs_pagerank_combined.geojson"
};


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

function getSelectedColumn() {
  const type = document.getElementById("filter-type-select")?.value;
  const geography = document.querySelector('input[name="geography"]:checked')?.value;
  
  if (geography === "county") {
    const val = document.getElementById("year-select").value;
    return `irs_county_rank_${val}`;
  }
  if (geography !== "county" && type === "year") {
    const val = document.getElementById("yeartwo-select").value;
    return `irs_metro_rank_${val}`;
  }
  if (type === "race") {
    return `rank_race_${document.getElementById("race-select").value}`;
  }
  if (type === "age") {
    const val = document.getElementById("age-select").value;
    return `rank_age_${val.replace("+", "plus").replace("-", "_")}`;
  }
  if (type === "education") {
    return `rank_educ_${document.getElementById("educ-select").value}`;
  }
  if (type === "industry") {
    const code = document.getElementById("industry-input").value;
    return `rank_industry_${code}`;
  }

  return "rank_total_flowPER"; // fallback
}

function loadLayer(column, geography) {
  let url, labelField;

  if (geography === "county") {
    const key = "county_irs";  // Hardcode to IRS since no Source-select exists

    url = "/test321/" + FILES[key];

    labelField = "NAMELSAD";
  } else {
    const type = document.getElementById("filter-type-select").value;
    url = "/test321/" + ((type === "year" || type === "none") ? FILES.metro_irs : FILES.metro_acs);
    labelField = "NAME";
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.features) return;

      const filtered = data.features.filter(f => {
        const props = f.properties || {};
        return props[column] != null;
      });

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
          const name = feature.properties[labelField] || "Unnamed";
          const val = feature.properties[column];
          const label = LABEL_MAP[column.replace("rank_", "")] || column;
          layer.bindPopup(`<strong>${name}</strong><br>${label} Rank: ${val ?? "N/A"}`);
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

function getColor(d) {
  if (d == null || isNaN(d)) return "#ccc";
  return d <= 100 ?
    d < 20 ? "#a50f15" :
    d < 40 ? "#de2d26" :
    d < 60 ? "#fc9272" :
    d < 80 ? "#fee0d2" :
            "#f7fbff"
  : "#ccc";
}

function refreshMap() {
  const geography = document.querySelector('input[name="geography"]:checked')?.value;
  const column = getSelectedColumn();
  console.log("Selected column:", column);
  if (column && geography) {
    loadLayer(column, geography);
  }
}

function updateFilterVisibility() {
  const val = document.getElementById("filter-type-select").value;
  const wrappers = {
    race: document.getElementById("race-wrapper"),
    age: document.getElementById("age-wrapper"),
    education: document.getElementById("educ-wrapper"),
    industry: document.getElementById("industry-wrapper"),
    year: document.getElementById("yeartwo-wrapper")
  };
  Object.keys(wrappers).forEach(key => {
    if (wrappers[key]) {
      wrappers[key].classList.toggle("hidden", key !== val);
    }
  });
}

function setupEventListeners() {
  // -- Geography radio buttons (Neighborhood / County / Metro)
  document.querySelectorAll('input[name="geography"]').forEach(radio => {
    radio.addEventListener("change", () => {
      updateFilterVisibility();
      refreshMap();               // redraw as soon as geography changes
    });
  });

  // -- Metro “Filter by” dropdown (total / race / age / … / year)
  document.getElementById("filter-type-select").addEventListener("change", () => {
    updateFilterVisibility();
    refreshMap();                 // redraw as soon as filter type changes
  });

  // -- All subtype selectors that can change the column we need
  //      • added "year-select" so County-year changes fire refreshMap()
  ["race-select", "age-select", "educ-select",
   "yeartwo-select", "year-select"  // ← NEW
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", refreshMap);
  });

  // -- Industry dropdown (1-digit NAICS)
  const ind = document.getElementById("industry-input");
  if (ind) ind.addEventListener("change", refreshMap);

  // -- Download-button handler (unchanged)
  const download = document.getElementById("download");
  if (download) {
    download.addEventListener("click", () => {
      const geography = document.querySelector('input[name="geography"]:checked')?.value;
      const path = geography === "county"
                   ? FILES.county_irs
                   : FILES.metro_acs;
      const a = document.createElement("a");
      a.href = path.replace(".geojson", ".csv");
      a.download = path.split("/").pop().replace(".geojson", ".csv");
      a.click();
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateFilterVisibility();
  refreshMap();
});

// ---------------------------------------------------------------------------
// Simple “what’s-going-on” helper.
// Logs key variable values on interaction, and refreshes the map.
// ---------------------------------------------------------------------------
(function () {
  // Show current selections in the console
  function logCurrentState(eventLabel) {
    const geography = document.querySelector('input[name="geography"]:checked')?.value;
    const type      = document.getElementById('filter-type-select')?.value;
    const countyYr  = document.getElementById('year-select')?.value;
    const metroYr   = document.getElementById('yeartwo-select')?.value;
    const column    = getSelectedColumn();
    console.log(`[${eventLabel}] geo=${geography} | type=${type} | countyYr=${countyYr} | metroYr=${metroYr} | column=${column}`);
  }

  // Log + refresh on every sidebar click
  document.getElementById('sidebar').addEventListener('click', () => {
    logCurrentState('sidebar click');
    refreshMap();
  });

  // Log initial state once
  logCurrentState('initial');
})();




