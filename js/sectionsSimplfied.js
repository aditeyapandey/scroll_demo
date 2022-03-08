/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width = 600;
  var height = 520;
  var margin = { top: 0, left: 20, bottom: 40, right: 10 };

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // We will set the domain when the
  // data is processed.
  // @v4 using new scale names
  var xBarScale = d3.scaleLinear().range([0, width]);

  // The bar chart display is horizontal
  // so we can use an ordinal scale
  // to get width and y locations.
  // @v4 using new scale type
  var yBarScale = d3
    .scaleBand()
    .paddingInner(0.08)
    .domain([1, 2, 3])
    .range([0, height - 50], 0.1, 0.1);

  // Color is determined just by the index of the bars
  var barColors = { 1: "#008080", 2: "#399785", 3: "#5AAF8C" };

  // You could probably get fancy and
  // use just one axis, modifying the
  // scale, but I will use two separate
  // ones to keep things easy.
  // @v4 using new axis name
  var xAxisBar = d3.axisBottom().scale(xBarScale);

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function (rawData) {
      console.log(rawData);
      // create svg and give it a width and height
      svg = d3.select(this).selectAll("svg").data([rawData]);
      var svgE = svg.enter().append("svg");
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr("width", width + margin.left + margin.right);
      svg.attr("height", height + margin.top + margin.bottom);

      svg.append("g");

      // this group element will be used to contain all
      // other elements.
      g = svg
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var countMax = d3.max(rawData, function (d) {
        return d.score;
      });
      xBarScale.domain([0, countMax]);

      setupVis(rawData);

      setupSections();
    });
  };

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param inputData - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (inputData) {
    // axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxisBar);
    g.select(".x.axis").style("opacity", 0);

    // count openvis title
    g.append("text")
      .attr("class", "title openvis-title")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("2013");

    g.append("text")
      .attr("class", "sub-title openvis-title")
      .attr("x", width / 2)
      .attr("y", height / 3 + height / 5)
      .text("OpenVis Conf");

    g.selectAll(".openvis-title").attr("opacity", 0);

    // count filler word count title
    g.append("text")
      .attr("class", "title count-title highlight")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("180");

    g.append("text")
      .attr("class", "sub-title count-title")
      .attr("x", width / 2)
      .attr("y", height / 3 + height / 5)
      .text("Filler Words");

    g.selectAll(".count-title").attr("opacity", 0);

    // barchart
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    //CHANGE REQUIRED
    var bars = g.selectAll(".bar").data(inputData);
    var barsE = bars.enter().append("rect").attr("class", "bar");

    bars = bars
      .merge(barsE)
      .attr("x", 0)
      .attr("y", function (d, i) {
              //CHANGE REQUIRED
        console.log(yBarScale(parseInt(d.treeid)));
        return yBarScale(parseInt(d.treeid));
      })
      .attr("fill", function (d, i) {
              //CHANGE REQUIRED
        return barColors[parseInt(d.treeid)];
      })
      .attr("width", 0)
      .attr("height", yBarScale.bandwidth());

    var barText = g.selectAll(".bar-text").data(inputData);
    barText
      .enter()
      .append("text")
      .attr("class", "bar-text")
      .text(function (d) {
              //CHANGE REQUIRED
        return d.label
      })
      .attr("x", 0)
      .attr("dx", 15)
      .attr("y", function (d, i) {
              //CHANGE REQUIRED
        return yBarScale(parseInt(d.treeid));
      })
      .attr("dy", yBarScale.bandwidth() / 1.2)
      .style("font-size", "110px")
      .attr("fill", "white")
      .attr("opacity", 0);
  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function () {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showFillerTitle;
    activateFunctions[2] = showBar;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < 9; i++) {
      updateFunctions[i] = function () {};
    }
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showTitle() {
    g.selectAll(".count-title").transition().duration(0).attr("opacity", 0);

    g.selectAll(".openvis-title")
      .transition()
      .duration(600)
      .attr("opacity", 1.0);
  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: square grid
   * shows: filler count title
   *
   */
  function showFillerTitle() {
    g.selectAll(".openvis-title").transition().duration(0).attr("opacity", 0);

    g.selectAll(".bar-text").transition().duration(0).attr("opacity", 0);

    g.selectAll(".bar").transition().duration(600).attr("width", 0);

    hideAxis(xAxisBar);

    g.selectAll(".count-title").transition().duration(600).attr("opacity", 1.0);
  }

  /**
   * showBar - barchart
   *
   * hides: square grid
   * hides: histogram
   * shows: barchart
   *
   */
  function showBar() {
    // ensure bar axis is set
    showAxis(xAxisBar);

    g.selectAll(".count-title").transition().duration(0).attr("opacity", 0);

    g.selectAll(".bar")
      .transition()
      .delay(function (d, i) {
        return 300 * (i + 1);
      })
      .duration(600)
      .attr("width", function (d) {
        return xBarScale(parseInt(d.score));
      });

    g.selectAll(".bar-text")
      .transition()
      .duration(600)
      .delay(1200)
      .attr("opacity", 1);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(axis) {
    g.select(".x.axis")
      .call(axis)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select(".x.axis").transition().duration(500).style("opacity", 0);
  }


  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = activeIndex - lastIndex < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function (index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};

/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  //This calls the chart() method in the scrollVis()
  //Chart function contains the main rendering functions
  d3.select("#vis").datum(data).call(plot);

  // setup scroll functionality
  var scroll = scroller().container(d3.select("#graphic"));

  // pass in .step selection as the steps
  scroll(d3.selectAll(".step"));

  // setup event handling
  //This does not need any update
  scroll.on("active", function (index) {
    // highlight current step text
    d3.selectAll(".step").style("opacity", function (d, i) {
      return i === index ? 1 : 0.1;
    });

    // activate current section
    plot.activate(index);
  });

  scroll.on("progress", function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
d3.csv("data/testdata.csv", display);
