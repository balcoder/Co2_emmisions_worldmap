// 4. make bar chart
// 5. tooltip!

d3.queue()
  .defer(d3.json, "//unpkg.com/world-atlas@1.1.4/world/50m.json")
  .defer(d3.csv, "./data/all_data.csv", function(row) {
    return {
      continent: row.Continent,
      country: row.Country,
      countryCode: row["Country Code"],
      emissions: +row["Emissions"],
      emissionsPerCapita: +row["Emissions Per Capita"],
      region: row.Region,
      year: +row.Year
    }
  })
  .await(function(error, mapData, data) {
    if (error) throw error;

    const extremeYears = d3.extent(data, d => d.year);
    let currentYear = extremeYears[0];
    let currentDataType = d3.select('input[name="data-type"]:checked')
                            .attr("value");
    // convert topojson using topojson.feature
    const geoData = topojson.feature(mapData, mapData.objects.countries).features;

    // let svg be as wide as the container    
    const width = +d3.select(".chart-container")
                   .node().offsetWidth;
    const height = 300;

    //createMap(width, width * 4 / 5);
    createMap(width, width  * 7 / 8);
    createPie(width, height);
    createBar(width, height);
    drawMap(geoData, data, currentYear, currentDataType);
    drawPie(data, currentYear);
    drawBar(data, currentYear);

    // grab range input and set min/max and value and add listener
    d3.select("#year")
        .property("min", currentYear)
        .property("max", extremeYears[1])
        .property("value", currentYear)
        .on("input", () => {
          // when the input changes grab the new year and redraw the map  
          currentYear = +d3.event.target.value;
          drawMap(geoData, data, currentYear, currentDataType);
          drawPie(data, currentYear);
          // when year changes highlight current year
          highlightBars(currentYear);
        });
    // when the radio btn changes grab the new data-type and redraw the map    
    d3.selectAll('input[name="data-type"]')
        .on("change", () => {
          let active = d3.select(".active").data()[0];
          let country = active ? active.properties.country : "";
          currentDataType = d3.event.target.value;
          drawMap(geoData, data, currentYear, currentDataType);
          drawBar(data, currentDataType, country);
        });
    
    d3.selectAll("svg")
      .on("mousemove touchmove", updateTooltip);
    
    function updateTooltip() {
      let tooltip = d3.select(".tooltip");
      let tgt = d3.select(d3.event.target);
      let isCountry = tgt.classed("country");
      let isBar = tgt.classed("bar");
      let isArc = tgt.classed("arc");
      let dataType = d3.select("input:checked")
                      .property("value");
      let units = dataType === "emissions" ? "thousand metric tons" : "metric tons per captia";
      let data;
      let percentage = "";

      // check which content I'm hovering over and set data to that
      if(isCountry) data = tgt.data()[0].properties;        
      if(isArc) {
        data = tgt.data()[0].data;
        percentage = `<p>Percentage of total: ${getPercentage(tgt.data()[0])}</p>`;  
      }
      if(isBar) data = tgt.data()[0];
      
      tooltip
        .style("opacity", +(isCountry || isArc || isBar))
        .style("left", (d3.event.pageX - tooltip.node().offsetWidth /2) + "px")
        .style("top", (d3.event.pageY - tooltip.node().offsetHeight - 10) + "px");
      if(data) {        
        let dataValue = data[dataType] ? data[dataType].toLocaleString() + " " + units :
         "Data Not Available";
        tooltip
          .html(`
            <p>Country: ${data.country}</p>
            <p>${formatDataType(dataType)}: ${dataValue}</p>
            <p>Year: ${data.year || d3.select("#year").property("value")}</p>
            ${percentage}
            `)
      }
      
    }
  });

function formatDataType(key) {
  return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
}

function getPercentage(d) {
  let angle = d.endAngle - d.startAngle;
  let fraction = 100 * angle / (Math.PI * 2);
  return fraction.toFixed(2) + "%";
}