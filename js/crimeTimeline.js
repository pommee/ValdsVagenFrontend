function filterCrimeDataByYear(data, selectedYear) {
  if (selectedYear === "all") {
    return data;
  }

  return data.filter((incident) => {
    const year = new Date(incident.timeIncident).getFullYear();
    return year.toString() === selectedYear;
  });
}

function generateCrimeTimeline(data, selectedYear) {
  if (selectedYear !== "all") {
    data = filteredData = filterCrimeDataByYear(data, selectedYear);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const crimeCounts = new Array(24).fill(0);

  data.forEach((incident) => {
    const time = new Date(incident.timeIncident);
    const hour = time.getHours();
    crimeCounts[hour]++;
  });

  const trace = {
    x: hours,
    y: crimeCounts,
    type: "bar",
    marker: {
      color: "rgb(55, 83, 109)",
    },
  };

  const layout = {
    title: "Vanligaste tiden för brott",
    xaxis: {
      title: "Klockslag",
    },
    yaxis: {
      title: "Antal",
    },
  };

  Plotly.newPlot("crime-timeline-table", [trace], layout);
}

function handleYearSelectionChange() {
  const yearSelect = document.getElementById("year-select");
  const selectedYear = yearSelect.value;

  generateCrimeTimeline(crimeData, selectedYear);
}
