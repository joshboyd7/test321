
function updateMap(layer, year, column) {
  const filtered = {
    ...fullGeojsonData,
    features: fullGeojsonData.features.filter(f => {
      const matchesLayer = f.properties.layer === layer;
      const matchesColumn = f.properties[column] != null;
      const matchesYear = (layer === "county")
        ? f.properties.year === parseInt(year)
        : true;  // don't filter by year for metro
      return matchesLayer && matchesYear && matchesColumn;
    })
  };

  if (filtered.features.length === 0) {
    console.warn(`No data for layer=${layer}, year=${year}, column=${column}`);
    return;
  }

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
