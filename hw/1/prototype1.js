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

const maxHeight = 6000000;

const margin = {
  top: 30,
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
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
scales.x.range([0, width - margin.left - margin.right])
        .domain(validMonths)
        .paddingInner(0.05);

scales.y.range([height - margin.top - margin.bottom, 0])
        .domain([0, maxHeight]);

const layers = [stackLayers.domestic, stackLayers.international];

let blue = '#4E79A7';
let orange = '#F28E2B';

let stackColor = d3.scaleOrdinal()
                   .domain(layers)
                   .range([blue, orange]);

// since we do not need the data for our domains, we can draw our axis/legends right away
drawAxis();
drawTitles();
drawColorLegend();

// load data and trigger draw
d3.csv('hw/1/Air_Traffic_Passenger_Statistics_1.csv', convert)
  .then(draw);

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
  console.log("data");
  console.log(data);
  console.log('loaded:', data.length, data[0]);

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  let internationalData = data.filter(row => row[columns.GEO_SUMMARY] === 'International');
  let domesticData = data.filter(row => row[columns.GEO_SUMMARY] === 'Domestic');
  console.log('filter - internationalData:', internationalData.length, internationalData[0]);
  console.log('filter - domesticData:', domesticData.length, domesticData[0]);


  drawBars(domesticData, internationalData);
  drawLabels(data);
}

/*
 * draw bars
 */
function drawBars(domesticData, internationalData) {
  // place all of the bars in their own group
  const group = plot.append('g')
                    .attr('id', 'bars');

  let domesticStartPoints = {};

  let domestic =  group.selectAll('rect')
                       .data(domesticData)
                       .enter()
                       .append('rect')
                       .attr('fill', d => stackColor(d[columns.GEO_SUMMARY]))
                       .attr('x', d => scales.x(d[columns.ACTIVITY_PERIOD].str))
                       .attr('y', d => {
                         let point = scales.y(d[columns.PASSENGER_COUNT]);
                         domesticStartPoints[d[columns.ACTIVITY_PERIOD].str] = point;
                         return point;
                       })
                       .attr('width', scales.x.bandwidth())
                       .attr('height', d => height - scales.y(d[columns.PASSENGER_COUNT]) - margin.bottom - margin.top);

  let international =  plot.append('g')
                           .attr('id', 'bars')
                           .selectAll('rect')
                           .data(internationalData)
                           .enter()
                           .append('rect')
                           .attr('fill', d => stackColor(d[columns.GEO_SUMMARY]))
                           .attr('x', d => scales.x(d[columns.ACTIVITY_PERIOD].str))
                           .attr('y', d => {
                             let delta = height - scales.y(d[columns.PASSENGER_COUNT]) - margin.bottom - margin.top;
                             return domesticStartPoints[d[columns.ACTIVITY_PERIOD].str] - delta;
                           })
                           .attr('width', scales.x.bandwidth())
                           .attr('height', d => height - scales.y(d[columns.PASSENGER_COUNT]) - margin.bottom - margin.top);
}

// https://beta.observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
function drawColorLegend() {
  const boxWidth = 20;
  const legendWidth = 200;
  const legendHeight = 20;

  // place legend in its own group
  const group = svg.append('g')
                   .attr('id', 'color-legend');

  // shift legend to appropriate position
  group.attr('transform', translate(width - margin.right - legendWidth, 0));

  const title = group.append('text')
                     .attr('class', 'axis-title')
                     .text('GEO Summary')
                     .attr('dy', 12);

  let internationalText = group.append('text')
                               .attr('class', 'text')
                               .text('International')
                               .attr('dy', 32).attr('dx', -60);

  let domesticText = group.append('text')
                          .attr('class', 'text')
                          .text('Domestic')
                          .attr('dy', 32).attr('dx', 80);

  const internationalBox = group.append('rect')
                                .attr('x', -100)
                                .attr('y', 12 + 6)
                                .attr('width', boxWidth)
                                .attr('height', legendHeight)
                                .attr('fill', orange);

  const domesticBox = group.append('rect')
                            .attr('x', 40)
                            .attr('y', 12 + 6)
                            .attr('width', boxWidth)
                            .attr('height', legendHeight)
                            .attr('fill', blue);
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
       .tickFormat(d => d3.format('.1s')(d))
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
