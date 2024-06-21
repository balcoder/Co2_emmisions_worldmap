function createPie(width, height) {
  var pie = d3.select("#pie")
                  .attr("width", width)
                  .attr("height", height);

  pie.append("g")
      .attr("transform", "translate(" + width / 2 + ", " + (height / 2 + 10) + ")")
      .classed("chart", true);

  pie.append("text")
      .attr("x", width / 2)
      .attr("y", "1em")
      .attr("font-size", "1.5em")
      .style("text-anchor", "middle")
      .classed("pie-title", true);
}

function drawPie(data, currentYear) {
  var pie = d3.select("#pie");

  var arcs = d3.pie()
               .sort((a,b) => {
                 if (a.continent < b.continent) return -1;
                 if (a.continent > b.continent) return 1;
                 return a.emissions - b.emissions;
               })
               .value(d => d.emissions);

  var path = d3.arc()
               .outerRadius(+pie.attr("height") / 2 - 50)
               .innerRadius(0);

  var yearData = data.filter(d => d.year === currentYear);
  var continents = [];
  for (var i = 0; i < yearData.length; i++) {
    var continent = yearData[i].continent;
    if (!continents.includes(continent)) {
      continents.push(continent);
    }
  }

  var colorScale = d3.scaleOrdinal()
                     .domain(continents)
                     .range(["#ab47bc", "#7e57c2", "#26a69a", "#42a5f5", "#78909c"]);

  var update = pie
                 .select(".chart")
                 .selectAll(".arc")
                 .data(arcs(yearData));

  update
    .exit()
    .remove();

  update
    .enter()
      .append("path")
      .classed("arc", true)
      .attr("stroke", "#dff1ff")
      .attr("stroke-width", "0.25px")
    .merge(update)
      .attr("fill", d => colorScale(d.data.continent))
      .attr("d", path);

  pie.select(".pie-title")
      .text("Total emissions by continent and region, " + currentYear);
}












function createMap(width, height) {
  d3.select("#map")
      .attr("width", width)
      .attr("height", height)
    .append("text")
      .attr("x", width / 2)
      .attr("y", "1em")
      .attr("font-size", "1.5em")
      .style("text-anchor", "middle")
      .classed("map-title", true);
}

function drawMap(geoData, climateData, year, dataType) {
  const map = d3.select("#map");

  const projection = d3.geoMercator()
                     .scale(110)
                     .translate([
                       +map.attr("width") / 2,
                       +map.attr("height") / 1.4
                     ]);

  const path = d3.geoPath()
               .projection(projection);

  d3.select("#year-val").text(year);

  // join csv climate data to geography
  geoData.forEach(d => {
    var countries = climateData.filter(row => row.countryCode === d.id);
    var name = '';
    if (countries.length > 0) name = countries[0].country;
    d.properties = countries.find(c => c.year === year) || { country: name };
  });

  var colors = ["#f1c40f", "#e67e22", "#e74c3c", "#c0392b"];

  var domains = {
    emissions: [0, 2.5e5, 1e6, 5e6],
    emissionsPerCapita: [0, 0.5, 2, 10]
  };

  var mapColorScale = d3.scaleLinear()
                        .domain(domains[dataType])
                        .range(colors);

  var update = map.selectAll(".country")
                  .data(geoData);

  update
    .enter()
    .append("path")
      .classed("country", true)
      .attr("d", path)
      .on("click", function() {
        let currentDataType = d3.select("input:checked").property("value");
        let country = d3.select(this);
        let isActive = country.classed("active");
        let countryName = isActive ? "" : country.data()[0].properties.country;
        drawBar(climateData, currentDataType, countryName);
        highlightBars(+d3.select("#year").property("value"));
        d3.selectAll(".country").classed("active", false);
        country.classed("active", !isActive); 
      })
    .merge(update)
      .transition()
      .duration(750)
      .attr("fill", d => {
        var val = d.properties[dataType];
        return val ? mapColorScale(val) : "#ccc";
      });

  d3.select(".map-title")
      .text("Carbon dioxide " + graphTitle(dataType) + ", " + year);
}

function graphTitle(str) {
  return str.replace(/[A-Z]/g, c => " " + c.toLowerCase());
}
























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
function createBar(width, height) {
    var bar = d3.select("#bar")
                    .attr("width", width)
                    .attr("height", height);
  
    bar.append("g")
        .classed("x-axis", true);
  
    bar.append("g")
        .classed("y-axis", true);
  
    bar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "1em")
        .classed("y-axis-label", true);
  
    bar.append("text")
        .attr("x", width / 2)
        .attr("y", "1em")
        .attr("font-size", "1.5em")
        .style("text-anchor", "middle")
        .classed("bar-title", true);
  }
  
  function highlightBars(year) {
    d3.select("#bar")
      .selectAll("rect")
        .attr("fill", d => d.year === year ? "#16a085" : "#1abc9c");
  }
  
  function drawBar(data, dataType, country) {
    var bar = d3.select("#bar");
    var padding = {
      top: 30,
      right: 30,
      bottom: 30,
      left: 110
    };
    var barPadding = 1;
    var width = +bar.attr("width");
    var height = +bar.attr("height");
    var countryData = data.filter(d => d.country === country)
                          .sort((a, b) => a.year - b.year);
  
    var xScale = d3.scaleLinear()
                   .domain(d3.extent(data, d => d.year))
                   .range([padding.left, width - padding.right]);
  
    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(countryData, d => d[dataType])])
                   .range([height - padding.bottom, padding.top]);
  
    var barWidth = xScale(xScale.domain()[0] + 1) - xScale.range()[0];
  
    var xAxis = d3.axisBottom(xScale)
                  .tickFormat(d3.format(".0f"));
  
    d3.select(".x-axis")
        .attr("transform", "translate(0, " + (height - padding.bottom) + ")")
        .call(xAxis);
  
    var yAxis = d3.axisLeft(yScale);
  
    d3.select(".y-axis")
        .attr("transform", "translate(" + (padding.left - barWidth / 2) + ",0)")
        .transition()
        .duration(1000)
        .call(yAxis);
  
    var axisLabel = dataType === "emissions" ?
      "CO2 emissions, thousand metric tons" :
      "CO2 emissions, metric tons per capita";
  
    var barTitle = country ?
      "CO2 Emissions, " + country :
      "Click on a country to see annual trends.";
  
    d3.select(".y-axis-label")
        .text(axisLabel);
  
    d3.select(".bar-title")
        .text(barTitle);
  
    var t = d3.transition()
              .duration(1000)
              .ease(d3.easeBounceOut);
  
    var update = bar 
                   .selectAll(".bar")
                   .data(countryData);
  
    update
      .exit()
      .transition(t)
        .delay((d, i, nodes) => (nodes.length - i - 1) * 100)
        .attr("y", height - padding.bottom)
        .attr("height", 0)
        .remove();
  
    update
      .enter()
      .append("rect")
        .classed("bar", true)
        .attr("y", height - padding.bottom)
        .attr("height", 0)
      .merge(update)
        .attr("x", d => (xScale(d.year) + xScale(d.year - 1)) / 2)
        .attr("width", barWidth - barPadding)
        .transition(t)
        .delay((d, i) => i * 100)
          .attr("y", d => yScale(d[dataType]))
          .attr("height", d => height - padding.bottom - yScale(d[dataType]));
  }
    
