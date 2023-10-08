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
  console.log(selectedYear);
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
    title: "Crime Count by Hour of the Day",
    xaxis: {
      title: "Hour of Day",
    },
    yaxis: {
      title: "Crime Count",
    },
  };

  Plotly.newPlot("crime-timeline-table", [trace], layout);
}

function handleYearSelectionChange() {
  const yearSelect = document.getElementById("year-select");
  const selectedYear = yearSelect.value;

  generateCrimeTimeline(crimeData, selectedYear);
}

function populateYearOptions() {
  const yearSelect = document.getElementById("year-select");
  const years = [
    ...new Set(
      crimeData.map((incident) => new Date(incident.timeIncident).getFullYear())
    ),
  ];

  yearSelect.innerHTML = "";
  yearSelect.appendChild(new Option("All Years", "all"));
  years.forEach((year) => {
    yearSelect.appendChild(new Option(year.toString(), year.toString()));
  });

  yearSelect.addEventListener("change", handleYearSelectionChange);
}