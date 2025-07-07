// turf-analysis.js for Disaster Management System (DMS)

let incidentGeoJSON = null;
let selectedIncidents = [];

// Convert raw CSV data into GeoJSON FeatureCollection
function csvToGeoJSON(csvData) {
  const lines = csvData.trim().split("\n");
  const headers = lines[0].split(",");
  const features = lines.slice(1).map(line => {
    const values = line.split(",");
    const props = {};
    headers.forEach((h, i) => { props[h.trim()] = values[i]?.trim(); });

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [+props.Longitude, +props.Latitude] // NOTE: Capitalized field names match your CSV
      },
      properties: props
    };
  });

  return {
    type: "FeatureCollection",
    features
  };
}

// Load CSV and store in memory
function handleCSVUpload(csvText) {
  incidentGeoJSON = csvToGeoJSON(csvText);
  alert("Loaded: " + incidentGeoJSON.features.length + " incidents");
  renderIncidentMarkers();
}

// Render incidents to map with click-to-select behavior
function renderIncidentMarkers() {
  if (!incidentGeoJSON) return;

  if (window.incidentLayer) map.removeLayer(window.incidentLayer);

  window.incidentLayer = L.geoJSON(incidentGeoJSON, {
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 6,
        color: '#e74c3c',
        fillColor: '#f1c40f',
        fillOpacity: 0.7
      });
    },
    onEachFeature: (feature, layer) => {
      layer.on('click', () => {
        if (selectedIncidents.includes(feature)) {
          selectedIncidents = selectedIncidents.filter(f => f !== feature);
          layer.setStyle({ color: '#e74c3c' });
        } else {
          selectedIncidents.push(feature);
          layer.setStyle({ color: '#2ecc71' });
        }
      });
    }
  }).addTo(map);
}

// Utility: Convert selected Leaflet features or GeoJSON features to Turf-compatible Features
function getSelectedFeatures() {
  return selectedIncidents.map(feature => {
    if (feature.type === "Feature") {
      return feature;
    } else if (feature.getLatLng) {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [feature.getLatLng().lng, feature.getLatLng().lat]
        },
        properties: feature.featureData || {}
      };
    }
    return null;
  }).filter(f => f !== null);
}

// BUFFER: Apply buffer to selected features
function runBuffer(distanceKm = 5) {
  const features = getSelectedFeatures();
  if (features.length === 0) return alert("Select incident points first.");

  const buffered = turf.buffer(turf.featureCollection(features), distanceKm, { units: 'kilometers' });

  L.geoJSON(buffered, {
    style: { color: 'blue', fillOpacity: 0.3 }
  }).addTo(map);
}

// PROXIMITY: Find incidents within radius from selected point
function runProximity(radiusKm = 10) {
  const features = getSelectedFeatures();
  if (!incidentGeoJSON || features.length !== 1) {
    return alert("Select exactly one incident point for proximity analysis.");
  }

  const centerPoint = turf.point(features[0].geometry.coordinates);
  const nearby = incidentGeoJSON.features.filter(f => {
    const dist = turf.distance(centerPoint, f, { units: 'kilometers' });
    return dist <= radiusKm;
  });

  const fc = turf.featureCollection(nearby);
  L.geoJSON(fc, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, color: 'green' })
  }).addTo(map);
}

// ATTRIBUTE SUMMARY: Count unique values by field
function runAttributeSummary(field = "Hazard") {
  if (!incidentGeoJSON) return alert("No data loaded.");

  const counts = {};
  incidentGeoJSON.features.forEach(f => {
    const key = f.properties[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  let summary = `Summary by ${field}:\n`;
  for (const key in counts) {
    summary += `• ${key}: ${counts[key]}\n`;
  }
  alert(summary);
}

// CLASSIFICATION: Style incidents by hazard or other field
function runClassification(field = "Hazard") {
  if (!incidentGeoJSON) return alert("No data loaded.");

  const colors = ['#e67e22', '#3498db', '#9b59b6', '#2ecc71', '#e74c3c'];
  const typeMap = {};
  let index = 0;

  const layer = L.geoJSON(incidentGeoJSON, {
    pointToLayer: (f, latlng) => {
      const value = f.properties[field] || 'Unknown';
      if (!typeMap[value]) typeMap[value] = colors[index++ % colors.length];
      return L.circleMarker(latlng, {
        radius: 6,
        color: typeMap[value],
        fillOpacity: 0.8
      });
    }
  });

  layer.addTo(map);
}

// ATTRIBUTE FILTER (Optional)
function runAttributeFilter(field = "Hazard", value = "Flood") {
  if (!incidentGeoJSON) return;

  const filtered = incidentGeoJSON.features.filter(f => {
    return (f.properties[field] || "").toLowerCase() === value.toLowerCase();
  });

  const fc = turf.featureCollection(filtered);

  L.geoJSON(fc, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 6,
      color: '#2980b9',
      fillColor: '#2980b9',
      fillOpacity: 0.6
    })
  }).addTo(map);
}
