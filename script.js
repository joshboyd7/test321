
const map = L.map('map').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let countyLayer = L.geoJson(null, {
  style: { color: '#de2d26', weight: 1, fillOpacity: 0.6 }
}).addTo(map);

let stateLayer = L.geoJson(null, {
  style: { color: '#3182bd', weight: 1, fillOpacity: 0.6 }
});

document.querySelectorAll('input[name="layer"]').forEach(input => {
  input.addEventListener('change', function () {
    if (this.value === 'county') {
      map.removeLayer(stateLayer);
      map.addLayer(countyLayer);
    } else {
      map.removeLayer(countyLayer);
      map.addLayer(stateLayer);
    }
  });
});

document.getElementById('download').addEventListener('click', function () {
  const layer = document.querySelector('input[name="layer"]:checked').value;
  alert(`Downloading data for ${layer}`);
});
