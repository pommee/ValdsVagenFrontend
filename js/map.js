let map;
let crimeData;
let markersCluster;
const tileLayers = [
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];
let currentTileLayerIndex = 0;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    crimeData = await fetchAndProcessCrimeData();

    initializeMap();
    updateCrimeTable();
    setupEventListeners();
    graph("Allt");
    updatePercentageAndScaleBar();
    populateYearOptions();
    generateCrimeTimeline(crimeData, "all");
  } catch (error) {
    console.error("Error fetching or processing crime data:", error);
  }
});

async function fetchAndProcessCrimeData() {
  const crimes = await fetchCrimes();
  return crimes.map((item) => ({
    ...item,
    lat: item.x,
    lon: item.y,
  }));
}

function initializeMap() {
  const mapOptions = {
    center: [62.38583179, 16.321998712],
    zoom: 3,
    zoomControl: false,
  };

  map = new L.map("map", mapOptions);
  setTileLayer(currentTileLayerIndex);

  markersCluster = L.markerClusterGroup();
  addHeatmapData();

  const targetZoom = 5;
  const targetCoords = [62.38583179, 16.321998712];

  map.flyTo(targetCoords, targetZoom, { animate: true });
}

function addHeatmapData() {
  markersCluster.clearLayers();

  crimeData.forEach(function (crime) {
    const marker = L.marker([crime.lat, crime.lon]);
    marker.bindPopup(`<b>${crime.label}</b><br>${crime.description}`);
    markersCluster.addLayer(marker);
  });

  map.addLayer(markersCluster);
}

function setTileLayer(index) {
  currentTileLayerIndex = index;

  map.eachLayer(function (layer) {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });

  const newLayer = new L.TileLayer(tileLayers[currentTileLayerIndex], {
    attribution: '© <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
  });

  map.addLayer(newLayer);
  updatePreviewTiles();
}

function updatePreviewTiles() {
  const previewTiles = document.querySelectorAll(".preview-tile img");
  const mapCenter = map.getCenter();
  const mapZoom = map.getZoom();

  const centerPoint = map.project(mapCenter, mapZoom);
  const tileX = centerPoint.x / 256;
  const tileY = centerPoint.y / 256;

  previewTiles.forEach(function (img, index) {
    img.src = tileLayers[index]
      .replace("{s}", "a")
      .replace("{z}", mapZoom)
      .replace("{x}", tileX)
      .replace("{y}", tileY);
  });
}

function updateCrimeTable() {
  updatePreviewTiles();
  const bounds = map.getBounds();
  const latLngBounds = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };

  const filteredCrimeData = crimeData.filter(function (crime) {
    return (
      crime.lat >= latLngBounds.south &&
      crime.lat <= latLngBounds.north &&
      crime.lon >= latLngBounds.west &&
      crime.lon <= latLngBounds.east
    );
  });

  const tableBody = document.querySelector("#crime-data-table tbody");
  tableBody.innerHTML = "";

  filteredCrimeData.forEach(function (crime) {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${crime.label}</td>
          <td>${crime.description}</td>
          <td>${crime.timeIncident}</td>
        `;

    row.addEventListener("click", function () {
      window.open(crime.link, "_blank");
    });

    tableBody.appendChild(row);
  });
}

function graph(selectedLabel) {
  let filteredData;
  if (selectedLabel != "Allt") {
    filteredData = crimeData.filter((item) => item.label === selectedLabel);
  } else {
    filteredData = crimeData;
  }

  filteredData.sort(
    (a, b) => new Date(b.timeIncident) - new Date(a.timeIncident)
  );

  const xData = filteredData.map((item) => new Date(item.timeIncident));
  const yData = filteredData.map((item) => item.label);

  const monthlyCrimeCounts = {};
  xData.reverse().forEach((date) => {
    const monthYearKey = `${date.getUTCMonth() + 1}-${date.getUTCFullYear()}`;
    monthlyCrimeCounts[monthYearKey] =
      (monthlyCrimeCounts[monthYearKey] || 0) + 1;
  });

  const xValues = Object.keys(monthlyCrimeCounts);
  const yValues = Object.values(monthlyCrimeCounts);

  const trace = {
    x: xValues,
    y: yValues,
    mode: "lines+markers",
    line: {
      color: "blue",
      shape: "linear",
    },
    marker: {
      size: 5,
      opacity: 0.7,
    },
    type: "scatter",
  };

  const layout = {
    title: "Brott per månad",
    xaxis: { title: "Datum" },
    yaxis: { title: "Antal" },
  };

  const plotData = [trace];

  Plotly.newPlot("crime-scatter-plot", plotData, layout);
}

function updatePercentageAndScaleBar() {
  var crimesThisYear = document.querySelector(
    "#crime-percentage .percentage-and-scale-bar-value"
  );
  var crimesThisYearDifference = document.querySelector(
    "#crime-percentage .percentage-and-scale-bar-difference"
  );

  let amountOfCrimesThisYear = countIncidentsPerYear(crimeData)["2023"];
  let amountOfCrimesThisYearCompared = calculatePercentageChange(
    countIncidentsPerYear(crimeData)["2022"],
    countIncidentsPerYear(crimeData)["2023"]
  );
  crimesThisYear.textContent = amountOfCrimesThisYear;
  crimesThisYearDifference.textContent =
    amountOfCrimesThisYearCompared + " sedan 2022";

  var mostCommonCrime = document.querySelector(
    "#most-common-crime .percentage-and-scale-bar-value"
  );
  var mostCommonCrimeCompared = document.querySelector(
    "#most-common-crime .percentage-and-scale-bar-difference"
  );

  let incidentTypesPerYear = countIncidentTypePerYear(crimeData);
  const currentYear = new Date().getFullYear();

  const currentYearLabels = incidentTypesPerYear[currentYear];
  const previousYearLabels = incidentTypesPerYear[currentYear - 1];
  let mostCommonCurrentYearLabel = null;
  let mostCommonCurrentYearCount = 0;
  let mostCommonPreviousYearCount = 0;

  for (const label in currentYearLabels) {
    if (currentYearLabels[label] > mostCommonCurrentYearCount) {
      mostCommonCurrentYearLabel = label;
      mostCommonPreviousYearCount = previousYearLabels[label];
      mostCommonCurrentYearCount = currentYearLabels[label];
    }
  }

  mostCommonCrime.textContent = mostCommonCurrentYearLabel;
  let increaseDecrease =
    mostCommonCurrentYearCount > mostCommonPreviousYearCount
      ? mostCommonCurrentYearCount -
        mostCommonPreviousYearCount +
        " nya fall sedan " +
        `${currentYear - 1}`
      : mostCommonPreviousYearCount -
        mostCommonCurrentYearCount +
        " färre fall sedan " +
        `${currentYear - 1}`;
  mostCommonCrimeCompared.textContent =
    calculatePercentageChange(
      mostCommonPreviousYearCount,
      mostCommonCurrentYearCount
    ) + increaseDecrease;
}

function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) {
    return "N/A (Division by zero)";
  }

  const percentageChange = ((newValue - oldValue) / oldValue) * 100;
  return percentageChange.toFixed(2) + "%";
}

function countIncidentsPerYear(incidents) {
  const incidentsByYear = {};

  incidents.forEach((incident) => {
    const year = incident.timeIncident.split("-")[0];

    if (incidentsByYear[year]) {
      incidentsByYear[year]++;
    } else {
      incidentsByYear[year] = 1;
    }
  });

  return incidentsByYear;
}

function countIncidentTypePerYear(incidents) {
  const countsByYear = {};

  incidents.forEach((item) => {
    const year = new Date(item.timeIncident).getFullYear();

    if (!countsByYear[year]) {
      countsByYear[year] = {};
    }

    const label = item.label;

    if (!countsByYear[year][label]) {
      countsByYear[year][label] = 1;
    } else {
      countsByYear[year][label]++;
    }
  });

  return countsByYear;
}

function setupEventListeners() {
  map.on("moveend", updateCrimeTable);

  const previewTiles = document.querySelectorAll(".preview-tile");

  previewTiles.forEach(function (tile) {
    tile.addEventListener("click", function () {
      const index = parseInt(tile.getAttribute("data-index"));

      previewTiles.forEach(function (otherTile) {
        otherTile.classList.remove("active");
      });

      tile.classList.add("active");

      setTileLayer(index);
    });
  });

  const sortDropdown = document.querySelector("#sortDropdown");
  sortDropdown.addEventListener("change", function () {
    const selectedLabel = this.value;
    graph(selectedLabel);
  });
}
