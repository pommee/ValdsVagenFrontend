// Global variables
let map;
let crimeData;
let markersCluster;
const tileLayers = [
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
];
let currentTileLayerIndex = 0;

document.addEventListener("DOMContentLoaded", async function () {
    try {
        crimeData = await fetchAndProcessCrimeData();

        initializeMap();
        updateCrimeTable();
        setupEventListeners();
        graph("Allt"); // Initial graph
    } catch (error) {
        console.error("Error fetching or processing crime data:", error);
    }
});

async function fetchAndProcessCrimeData() {
    const crimes = await fetchCrimes();
    return crimes.map(item => ({
        ...item,
        lat: item.x,
        lon: item.y,
    }));
}

// Initialize the map
function initializeMap() {
    const mapOptions = {
        center: [62.38583179, 16.321998712],
        zoom: 5,
    };

    map = new L.map('map', mapOptions);
    setTileLayer(currentTileLayerIndex);

    markersCluster = L.markerClusterGroup();
    addHeatmapData();
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
        subdomains: 'abcd',
    });

    map.addLayer(newLayer);
    updatePreviewTiles();
}

function updatePreviewTiles() {
    const previewTiles = document.querySelectorAll('.preview-tile img');
    const mapCenter = map.getCenter();
    const mapZoom = map.getZoom();

    const centerPoint = map.project(mapCenter, mapZoom);
    const tileX = centerPoint.x / 256;
    const tileY = centerPoint.y / 256;

    previewTiles.forEach(function (img, index) {
        img.src = tileLayers[index]
            .replace('{s}', 'a')
            .replace('{z}', mapZoom)
            .replace('{x}', tileX)
            .replace('{y}', tileY);
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
      <td><a href="${crime.link}" target="_blank">Läs</a></td>
    `;
        tableBody.appendChild(row);
    });
}

function graph(selectedLabel) {

    let filteredData;
    if (selectedLabel != "Allt") {
        console.log("Sorting...");
        console.log(crimeData[0].label === selectedLabel);
        filteredData = crimeData.filter(item => item.label === selectedLabel);
    } else {
        filteredData = crimeData;
    }
    console.log(selectedLabel, filteredData);

    filteredData.sort((a, b) => new Date(a.timeIncident) - new Date(b.timeIncident));

    const xData = filteredData.map(item => new Date(item.timeIncident));
    const yData = filteredData.map(item => item.label);

    const monthlyCrimeCounts = {};
    xData.forEach(date => {
        const monthYearKey = `${date.getUTCMonth() + 1}-${date.getUTCFullYear()}`;
        monthlyCrimeCounts[monthYearKey] = (monthlyCrimeCounts[monthYearKey] || 0) + 1;
    });

    const xValues = Object.keys(monthlyCrimeCounts);
    const yValues = Object.values(monthlyCrimeCounts);

    const trace = {
        x: xValues,
        y: yValues,
        mode: 'lines+markers',
        line: {
            color: 'blue',
            shape: 'linear',
        },
        marker: {
            size: 5,
            opacity: 0.7,
        },
        type: 'scatter',
    };

    const layout = {
        title: 'Brott per månad',
        xaxis: { title: 'Datum' },
        yaxis: { title: 'Antal' },
    };

    const plotData = [trace];

    Plotly.newPlot('crime-scatter-plot', plotData, layout);
}

function setupEventListeners() {
    map.on('moveend', updateCrimeTable);

    const previewTiles = document.querySelectorAll('.preview-tile');
    previewTiles.forEach(function (tile) {
        tile.addEventListener('click', function () {
            const index = parseInt(tile.getAttribute('data-index'));
            setTileLayer(index);
        });
    });

    const sortDropdown = document.querySelector("#sortDropdown");
    sortDropdown.addEventListener('change', function () {
        const selectedLabel = this.value;
        graph(selectedLabel);
    });
}
