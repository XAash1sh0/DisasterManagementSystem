// Initialize Leaflet map centered on Kathmandu
const map = L.map('map').setView([27.7172, 85.3240], 8);

// Base layers
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© Esri'
});

const terrain = L.tileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
});

let currentBaseLayer = osm;

// Dropdown toggle logic
document.querySelectorAll('.panel-box .toggle-btn').forEach(button => {
  const dropdown = button.nextElementSibling;
  button.addEventListener('click', e => {
    e.stopPropagation();
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-panel').forEach(panel => {
      if (panel !== dropdown) panel.style.display = 'none';
    });
    // Toggle current dropdown
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
});

// Prevent dropdown from closing when clicking inside it
document.querySelectorAll('.dropdown-panel').forEach(panel => {
  panel.addEventListener('click', e => e.stopPropagation());
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-panel').forEach(panel => {
    panel.style.display = 'none';
  });
});

// Base map buttons
document.querySelectorAll('.top-control-bar > .panel-box:nth-child(2) .dropdown-panel button').forEach(btn => {
  btn.addEventListener('click', () => {
    map.removeLayer(currentBaseLayer);
    switch (btn.title) {
      case 'OpenStreetMap':
        currentBaseLayer = osm;
        break;
      case 'Satellite':
        currentBaseLayer = satellite;
        break;
      case 'Terrain':
        currentBaseLayer = terrain;
        break;
    }
    currentBaseLayer.addTo(map);
  });
});

// Dummy overlay layers (replace with actual GeoJSON layers)
const provinceLayer = L.layerGroup().addTo(map);
const districtLayer = L.layerGroup().addTo(map);
const municipalityLayer = L.layerGroup();
const wardLayer = L.layerGroup();

// Overlay checkboxes
const overlayCheckboxes = document.querySelectorAll('.top-control-bar > .panel-box:nth-child(3) .dropdown-panel input[type="checkbox"]');
overlayCheckboxes.forEach((checkbox, index) => {
  checkbox.addEventListener('change', () => {
    let layer;
    switch (index) {
      case 0: layer = provinceLayer; break;
      case 1: layer = districtLayer; break;
      case 2: layer = municipalityLayer; break;
      case 3: layer = wardLayer; break;
    }
    if (checkbox.checked) map.addLayer(layer);
    else map.removeLayer(layer);
  });
});

// Map control buttons
document.querySelector('.map-btn[title="Zoom In"]').onclick = () => map.zoomIn();
document.querySelector('.map-btn[title="Zoom Out"]').onclick = () => map.zoomOut();

document.querySelector('.map-btn[title="Fullscreen"]').onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

document.querySelector('.map-btn[title="Set Location"]').onclick = () => {
  map.locate({ setView: true, maxZoom: 12 });
  map.once('locationfound', e => {
    L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();
  });
  map.once('locationerror', () => {
    alert('Could not get your location');
  });
};

// Resize map on window resize
window.addEventListener('resize', () => map.invalidateSize());
