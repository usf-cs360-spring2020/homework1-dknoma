/*
 * a lot of this example is hard-coded to match our tableau prototype...
 * and this is a reasonable approach for your own visualizations.
 * however, there are ways to automatically calculate these hard-coded values
 * in our javascript/d3 code.
 */

// showing use of const
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

// if you need to change values, use let instead
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let

// set svg size and plot margins
const width = 960;
const height = 500;

const month = {
  JAN: { str: 'January', id: 1 },
  FEB: { str: 'February', id: 2 },
  MAR: { str: 'March', id: 3 },
  APR: { str: 'April', id: 4 },
  MAY: { str: 'May', id: 5 },
  JUN: { str: 'June', id: 6 },
  JUL: { str: 'July', id: 7 },
  AUG: { str: 'August', id: 8 },
  SEP: { str: 'September', id: 9 },
  OCT: { str: 'October', id: 10 },
  NOV: { str: 'November', id: 11 },
  DEC: { str: 'December', id: 12 },
};

const validMonths = [
  month.JAN.str,
  month.FEB.str,
  month.MAR.str,
  month.APR.str,
  month.MAY.str,
  month.JUN.str,
  month.JUL.str,
  month.AUG.str,
  month.SEP.str,
];

const columns = {
  PASSENGER_COUNT: 'Passenger Count',
  ACTIVITY_PERIOD: 'Activity Period',
  GEO_SUMMARY: 'GEO Summary'
};

const stackLayers = {
  domestic: 'Domestic',
  international: 'International'
};

const margin = {
  top: 10,
  bottom: 35,
  left: 45,
  right: 15
};

// select svg
const svg = d3.select('svg#bar');
console.assert(svg.size() == 1);

// set svg size
svg.attr('width', width);
svg.attr('height', height);

// add plot region
const plot = svg.append('g').attr('id', 'plot');

// this is just so we can see the transform of the plot
// comment out for final version
// plot.append('rect').attr('width', 10).attr('height', 10);

// transform region by margin
plot.attr('transform', translate(margin.left, margin.top));

/*
 * setup scales with ranges and the domains we set from tableau
 * defined globally for access within other functions
 */

const scales = {
  x: d3.scaleBand(),
  y: d3.scaleLinear(),
  fill: d3.scaleDiverging(d3.interpolatePRGn)
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
scales.x.range([0, width - margin.left - margin.right])
        .domain(validMonths)
        .paddingInner(0.05);

scales.y.range([height - margin.top - margin.bottom, 0])
        .domain([0, 6000000]);

scales.fill.domain([-20, 0, 35]);

let stackColor = d3.scaleOrdinal()
              .domain(stackLayers)
              .range(['orange','blue']);

// since we do not need the data for our domains, we can draw our axis/legends right away
drawAxis();
drawTitles();
// drawColorLegend();
// drawCircleLegend();

// load data and trigger draw
d3.csv('hw/1/Air_Traffic_Passenger_Statistics_1.csv', convert)
  .then(draw);

let maxPassengerCount = 0;


/*
  {
    data:
    {
      Activity Period: []
      GEO Summary: []
      Passenger Count: []
    }
  }
 */
function draw(data) {
  console.log(data);
  console.log('loaded:', data.length, data[0]);

  data.forEach(row => {
    let count = row[columns.PASSENGER_COUNT];
    if(count > maxPassengerCount) {
      maxPassengerCount = count;
    }
  });

  // separate data into stack layers
  // let layeredData = ['Domestic', 'International'].map(
  //   (geo) => {
  //     return data.map(
  //       (d) => {
  //         return {
  //           columns.ACTIVITY_PERIOD: d[columns.ACTIVITY_PERIOD],
  //           columns.GEO_SUMMARY: geo,
  //           columns.PASSENGER_COUNT: d[columns.PASSENGER_COUNT],
  //         };
  //       }
  //     );
  //   }
  // );
  //
  // // Sort by activity period
  // for(let i = 0; i < layeredData.length; i++) {
  //   layeredData[i].sort((a, b) => a[columns.ACTIVITY_PERIOD].id - b[columns.ACTIVITY_PERIOD].id);
  // }
  //
  // console.log(layeredData);

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  let internationalData = data.filter(row => row[columns.GEO_SUMMARY] === 'International');
  let domesticData = data.filter(row => row[columns.GEO_SUMMARY] === 'Domestic');
  console.log('filter - internationalData:', internationalData.length, internationalData[0]);
  console.log('filter - domesticData:', domesticData.length, domesticData[0]);

  // sort by count so small circles are drawn last
  internationalData.sort((a, b) => a[columns.ACTIVITY_PERIOD].id - b[columns.ACTIVITY_PERIOD].id);
  domesticData.sort((a, b) => a[columns.ACTIVITY_PERIOD].id - b[columns.ACTIVITY_PERIOD].id);
  console.log('sorted - internationalData:', internationalData.length, internationalData[0]);
  console.log('sorted - domesticData:', domesticData.length, domesticData[0]);


  drawDomesticBar(domesticData);
  // drawInternationalBar(data);
  // drawMedian(data); // in this order, lines will be on top of bubbles
  drawLabels(data);
}

/*
 * draw bars
 */
function drawDomesticBar(data) {
  // place all of the bars in their own group
  const group = plot.append('g')
                    .attr('id', 'domesticBars');


  // console.log('max = %d', maxPassengerCount);
  console.log('scales.bandX: ' + scales.x.bandwidth());

  return group.selectAll('rect')
              .data(data)
              .enter()
              .append('rect')
                .attr('x', d => scales.x(d[columns.ACTIVITY_PERIOD].str))
                .attr('y', d => scales.y(d[columns.PASSENGER_COUNT]))
                .attr('width', scales.x.bandwidth())
                .attr('height', 100)
                .style('stroke', 'white')
                .style('fill', stackColor(d => stackColor(d.key)));
}

// https://beta.observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
function drawColorLegend() {
  const legendWidth = 200;
  const legendHeight = 20;

  // place legend in its own group
  const group = svg.append('g').attr('id', 'color-legend');

  // shift legend to appropriate position
  group.attr('transform', translate(width - margin.right - legendWidth, margin.top + 375));

  const title = group.append('text')
                     .attr('class', 'axis-title')
                     .text('Trend of Parents in Bottom 20%');

  title.attr('dy', 12);

  // lets draw the rectangle, but it won't have a fill just yet
  const colorbox = group.append('rect')
                        .attr('x', 0)
                        .attr('y', 12 + 6)
                        .attr('width', legendWidth)
                        .attr('height', legendHeight);

  // we need to create a linear gradient for our color legend
  // this defines a color at a percent offset
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient

  // this is easier if we create a scale to map our colors to percents

  // get the domain first (we do not want the middle value from the diverging scale)
  const colorDomain = [d3.min(scales.fill.domain()), d3.max(scales.fill.domain())];

  // add a new scale to go from color tick to percent
  scales.percent = d3.scaleLinear()
                     .range([0, 100])
                     .domain(colorDomain);

  // we have to first add gradients
  const defs = svg.append('defs');

  // add a color stop per data tick
  // input  (ticks)   : [-20, ..., 15, ..., 50]
  // output (percents): [  0, ..., 50, ..., 100]
  defs.append('linearGradient')
      .attr('id', 'gradient')
      .selectAll('stop')
      .data(scales.fill.ticks())
      .enter()
      .append('stop')
      .attr('offset', d => scales.percent(d) + '%')
      .attr('stop-color', d => scales.fill(d));

  // draw the color rectangle with the gradient
  colorbox.attr('fill', 'url(#gradient)');

  // now we need to draw tick marks for our scale
  // we can create a legend that will map our data domain to the legend colorbox
  scales.legend = d3.scaleLinear()
                    .domain(colorDomain)
                    .range([0, legendWidth]);

  // i tend to keep scales global so i can debug them in the console
  // in this case there really is no need for the percent and legend scales
  // to be accessible outside of this function

  const legendAxis = d3.axisBottom(scales.legend)
                       .tickValues(scales.fill.domain())
                       .tickSize(legendHeight)
                       .tickSizeOuter(0);

  const axisGroup = group.append('g')
                         .attr('id', 'color-axis')
                         .attr('transform', translate(0, 12 + 6))
                         .call(legendAxis);

  // now lets tighten up the tick labels a bit so they don't stick out
  axisGroup.selectAll('text')
           .each(function(d, i) {
             // set the first tick mark to anchor at the start
             if (i == 0) {
               d3.select(this).attr('text-anchor', 'start');
             }
             // set the last tick mark to anchor at the end
             else if (i == legendAxis.tickValues().length - 1) {
               d3.select(this).attr('text-anchor', 'end');
             }
           });

  // note how many more lines of code it took to generate the legend
  // than the base visualization!
}

/*
 * draw labels for pre-selected bubbles
 */
function drawLabels(data) {
  // place the labels in their own group
  const group = plot.append('g').attr('id', 'labels');

  // create data join and enter selection
  const labels = group.selectAll('text')
    .data(data)
    .enter()
    .filter(d => d.label) // only keep values that we want to label
    .append('text');

  labels.text(d => d.name);

  labels.attr('x', d => scales.x(d.income));
  labels.attr('y', d => scales.y(d.mobility));

  labels.attr('text-anchor', 'middle');
  labels.attr('dy', d => -(scales.r(d.count) + 4));

  // maybe we also want to make it more clear which circle is associated
  // with the label above it---we will work with update selection here!
  plot.select('#bar')
    .selectAll('rect')
    .data(data)
    .filter(d => d.label)
    .style('stroke', 'black')
    .style('stroke-width', 1);
}

/*
 * this demonstrates d3-legend for creating a circle legend
 * it is made to work with d3v4 not d3v5 however
 */
function drawCircleLegend() {
  const legendWidth = 200;
  const legendHeight = 20;

  // place legend into its own group
  const group = svg.append('g').attr('id', 'circle-legend');

  // position legend
  group.attr('transform', translate(width - margin.right - legendWidth + 75, margin.top + 25))

  // https://d3-legend.susielu.com/#size-linear
  const legendSize = d3.legendSize()
    .scale(scales.r)
    .shape('circle')
    .cells(6)
    .ascending(false)
    .shapePadding(10)
    .labelOffset(10)
    .labelFormat('d')
    .title('Median Cohort Size')
    .orient('vertical');

  group.call(legendSize);

  // fix the title spacing
  group.select('text.legendTitle').attr('dy', -8);

  // note it is harder to get this to be two column using this package
  // we have to select what was drawn and then move it around
}

/*
 * draw axis titles
 */
function drawTitles() {
  const xMiddle = margin.left + midpoint(scales.x.range());
  const yMiddle = margin.top + midpoint(scales.y.range());

  // test middle calculation
  // svg.append('circle').attr('cx', xMiddle).attr('cy', yMiddle).attr('r', 5);

  const xTitle = svg.append('text')
    .attr('class', 'axis-title')
    .text('2019');

  xTitle.attr('x', xMiddle);
  xTitle.attr('y', height);
  xTitle.attr('dy', -4);
  xTitle.attr('text-anchor', 'middle');

  // it is easier to rotate text if you place it in a group first
  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate

  const yGroup = svg.append('g');

  // set the position by translating the group
  yGroup.attr('transform', translate(4, yMiddle));

  const yTitle = yGroup.append('text')
                       .attr('class', 'axis-title')
                       .text(columns.PASSENGER_COUNT);

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr('x', 0);
  yTitle.attr('y', 0);

  yTitle.attr('dy', '1.75ex');
  yTitle.attr('text-anchor', 'middle');
  yTitle.attr('transform', 'rotate(-90)');
}

/*
 * create axis lines
 */
function drawAxis() {
  // place the xaxis and yaxis in their own groups
  const xGroup = svg.append('g')
                    .attr('id', 'x-axis')
                    .attr('class', 'axis');
  const yGroup = svg.append('g')
                    .attr('id', 'y-axis')
                    .attr('class', 'axis');

  // create axis generators
  const xAxis = d3.axisBottom(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  // https://github.com/d3/d3-format#locale_formatPrefix
  xAxis.ticks(9, 's')
       .tickSizeOuter(0)
       .tickSizeInner(0);
  yAxis.ticks(5)
       .tickSizeInner(-width + margin.left + margin.right)
       .tickFormat(d => d3.format('.2s')(d))
       .tickSizeOuter(0);

  // shift x axis to correct location
  xGroup.attr('transform', translate(margin.left, height - margin.bottom));
  xGroup.call(xAxis);

  // shift y axis to correct location
  yGroup.attr('transform', translate(margin.left, margin.top))
  yGroup.call(yAxis);
}

/*
 * converts values as necessary
 */
function convert(row) {
  let converted = {};

  converted[columns.PASSENGER_COUNT] = parseInt(row[columns.PASSENGER_COUNT]);
  converted[columns.GEO_SUMMARY] = row[columns.GEO_SUMMARY];

  let activityPeriod = row[columns.ACTIVITY_PERIOD];
  let len = activityPeriod.length;

  let res;
  switch(activityPeriod.substring(len-2, len)) {
    case '01':
      res = month.JAN;
      break;
    case '02':
      res = month.FEB;
      break;
    case '03':
      res = month.MAR;
      break;
    case '04':
      res = month.APR;
      break;
    case '05':
      res = month.MAY;
      break;
    case '06':
      res = month.JUN;
      break;
    case '07':
      res = month.JUL;
      break;
    case '08':
      res = month.AUG;
      break;
    case '09':
      res = month.SEP;
      break;
    case '10':
      res = month.OCT;
      break;
    case '11':
      res = month.NOV;
      break;
    case '12':
      res = month.DEC;
      break;
  }

  converted[columns.ACTIVITY_PERIOD] = res;

  return converted;
}

/*
 * calculates the midpoint of a range given as a 2 element array
 */
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

/*
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}
