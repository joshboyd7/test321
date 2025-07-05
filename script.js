let map = L.map("map").setView([37.8, -96], 4);
let geoLayer;
let currentYear = "2023";
let currentLayer = "county";

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

// Color scale
function getColor(d) {
  if (d == null || isNaN(d)) return '#cccccc';
  return d > 9411.148 ? '#a50f15' :
         d > 2511.106 ? '#de2d26' :
         d > 2168.236 ? '#fc9272' :
         d > 1952.638 ? '#fee0d2' :
         d > 1792.199 ? '#eff3ff' :
         d > 1660.116 ? '#bdd7e7' :
         d > 1536.735 ? '#6baed6' :
         d > 1407.501 ? '#2171b5' :
                        '#08306b';
}

// Main load function
function loadLayer(year, geography) {
  const filePath = "data/combined.json";

  fetch(filePath)
    .then(res => res.json())
    .then(data => {
      if (!data.features || !Array.isArray(data.features)) {
        console.warn("Invalid GeoJSON structure");
        return;
      }

      let filtered = data.features.filter(f =>
        f.properties &&
        f.properties.geography === geography &&
        (geography === "county" ? f.properties.year == year : true)
      );

      // For metro, apply ACS subgroup filters
      if (geography === "metro") {
        const filterType = document.getElementById("filter-type-select").value;

        if (filterType === "race") {
          const race = document.getElementById("race-select").value;
          filtered = filtered.filter(f => f.properties.race === race);
        } else if (filterType === "age") {
          const age = document.getElementById("age-select").value;
          filtered = filtered.filter(f => f.properties.age_group === age);
        } else if (filterType === "industry") {
          const naics = document.getElementById("industry-input").value;
          filtered = filtered.filter(f => f.properties.naics_2 === naics);
        }
      }

      if (geoLayer) map.removeLayer(geoLayer);

      geoLayer = L.geoJSON({ type: "FeatureCollection", features: filtered }, {
        style: feature => ({
          fillColor: getColor(feature.properties.value),
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.8
        }),
        onEachFeature: (feature, layer) => {
          const name = feature.properties.NAME || feature.properties.name || "";
          const val = feature.properties.value != null ? feature.properties.value.toLocaleString() : "N/A";
          layer.bindPopup(`${name}: $${val}`);
        }
      }).addTo(map);

      if (filtered.length > 0) {
        try {
          map.fitBounds(geoLayer.getBounds());
        } catch (e) {
          console.warn("Could not fit map bounds:", e);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load combined.json:", err);
    });
}

// Initial load
loadLayer(currentYear, currentLayer);

// Controls
document.getElementById("year-select").addEventListener("change", e => {
  currentYear = e.target.value;
  if (currentLayer === "county") {
    loadLayer(currentYear, currentLayer);
  }
});

document.querySelectorAll('input[name="geography"]').forEach(input => {
  input.addEventListener("change", e => {
    currentLayer = e.target.value;
    loadLayer(currentYear, currentLayer);
  });
});

document.getElementById("filter-type-select").addEventListener("change", () => {
  if (currentLayer === "metro") {
    loadLayer(currentYear, currentLayer);
  }
});
document.getElementById("race-select").addEventListener("change", () => {
  if (currentLayer === "metro") {
    loadLayer(currentYear, currentLayer);
  }
});
document.getElementById("age-select").addEventListener("change", () => {
  if (currentLayer === "metro") {
    loadLayer(currentYear, currentLayer);
  }
});
document.getElementById("industry-input").addEventListener("input", () => {
  if (currentLayer === "metro") {
    loadLayer(currentYear, currentLayer);
  }
});

// Download button
document.getElementById("download").addEventListener("click", () => {
  const url = `data/combined.csv`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `combined.csv`;
  a.click();
});

