/* GLOBALS */

var width  = 960;           // width of svg image
var height = 400;           // height of svg image
var margin = 20;            // amount of margin around plot area
var pad = margin/2;       // actual padding amount
// var pad = margin / 2;       // actual padding amount
var radius = 6;
var yoffset= 20;             // fixed node radius
var yfixed = height - margin - pad - radius - yoffset;  // y position for all nodes
var radians = d3.scale.linear()
        .range([Math.PI / 2, 3 * Math.PI / 2]);

// var zoom = d3.behavior.zoom().x(x).scaleExtent([1, 100]).on("zoom", zoomed);
var color = d3.scale.category20();
var orders = {};
var x = d3.scale.ordinal().rangeBands([radius,width - margin - radius]);
var svg;
/* HELPER FUNCTIONS */
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};



// Generates a tooltip for a SVG circle element based on its ID
function addTooltip(circle) {
    var x = parseFloat(circle.attr("cx"));
    var y = parseFloat(circle.attr("cy"));
    var r = parseFloat(circle.attr("r"));
    var text = circle.attr("id");

    var tooltip = d3.select("#plot")
        .append("text")
        .text(text)
        .attr("x", x)
        .attr("y", y)
        .attr("dy", radius*5)
        .attr("id", "tooltip");

    var offset = tooltip.node().getBBox().width / 2;

    if ((x - offset) < 0) {
        tooltip.attr("text-anchor", "start");
        tooltip.attr("dx", -r);
    }
    else if ((x + offset) > (width - margin)) {
        tooltip.attr("text-anchor", "end");
        tooltip.attr("dx", r);
    }
    else {
        tooltip.attr("text-anchor", "middle");
        tooltip.attr("dx", 0);
    }
}

 d3.select("#order").on("change", function() {
    // clearTimeout(timeout);
    order(this.value);
  });


/* MAIN DRAW METHOD */

// Draws an arc diagram for the provided undirected graph
function arcDiagram(graph) {
    // create svg image
    svg = d3.select("body")
        .append("svg")
        .attr("id", "arc")
        .attr("width", width)
        .attr("height", height);

    // draw border around svg image
    svg.append("rect")
        .attr("class", "outline")
        .attr("width", width)
        .attr("height", height);

    // create plot area within svg image
    var plot = svg.append("g")
        .attr("id", "plot")
        .attr("transform", "translate(" + pad + ", " + pad + ")");

    graph.nodes.forEach(function(d, i) {
        d.i = i;
    });

    // fix graph links to map to objects instead of indices
    graph.links.forEach(function(d, i) {
        d.source = isNaN(d.source) ? d.source : graph.nodes[d.source];
        d.target = isNaN(d.target) ? d.target : graph.nodes[d.target];
        d.source.degree = ++d.source.degree || 0;
        d.target.degree = ++d.target.degree || 0;
    });

    var n  = Object.keys(graph.nodes).length;
    orders = {
        name:   d3.range(n).sort(function(a, b) { return d3.ascending(graph.nodes[a].name, graph.nodes[b].name); }),
        group:  d3.range(n).sort(function(a, b) { return graph.nodes[b].group - graph.nodes[a].group; }),
        degree: d3.range(n).sort(function(a, b) { return graph.nodes[b].degree - graph.nodes[a].degree} ),
        value:  d3.range(n).sort(function(a, b) { return graph.nodes[b].value - graph.nodes[a].value} ),
    };

    x.domain(orders.group)

    // draw links first, so nodes appear on top
    drawLinks(graph.links);

    // draw nodes last
    drawNodes(graph.nodes);
}

// Draws nodes on plot
function drawNodes(nodes) {
    // used to assign nodes color by group

    d3.select("#plot").selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("id", function(d, i) { return d.name; })
        .attr("cx", function(d, i) { return x(d.i); })
        .attr("cy", yfixed )
        .attr("r",  function(d,i) { return 3*Math.log(d.value)+3 })
        .style("fill",   function(d, i) { return color(d.group); })
        .on("mouseover", function(d, i) { 
            var sel = d3.select(this);
            sel.style("stroke","grey")
            sel.moveToFront();
            addTooltip(sel); })
        .on("mouseout",  function(d, i) { 
            d3.select(this).style("stroke","white")
            d3.select("#tooltip").remove(); })
        }

// Draws nice arcs for each link on plot
function drawLinks(links) {
  
    // add links
    d3.select("#plot").selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .style("opacity",1)
        .style("stroke", function(d) {return color(d.source.group)})
        .attr("d", linkArc)
        .attr("stroke-width",1.75);   
}

    function linkArc(d) {
      var start = x(d.source.i);
      var end   = x(d.target.i); 
      var dx = start - end,
          dr = 0.55*dx
      if (dx < 0){
        return "M" + start + "," + yfixed + "A" + dr + "," + dr + " 0 0,1 " + end + "," + yfixed; 
      }
      else{
        return "M" + end + "," + yfixed + "A" + dr + "," + dr + " 0 0,1 " + start + "," + yfixed;  
      }
      
}

function order(value){
    x.domain(orders[value]);
    var radians = d3.scale.linear()
        .range([Math.PI / 2, 3 * Math.PI / 2]);

    var t = svg.transition().duration(750);

    t.selectAll("circle")
        .delay(function(d,i){return i*5})
        .attr("cx", function(d,i) { return x(i); });

    t.selectAll("path")
        .delay(function(d,i){return i*1.5})
        .attr("d", linkArc);
    
}