/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, geoData, expatData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.expatData = expatData;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.titleGroup = vis.svg.append('g')
            .attr('class', 'title')

        vis.titleGroup
            .append('text')
            .attr('class', 'map-title')
            .text('Expats by countries')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        vis.titleGroup
            .append('text')
            .attr('class', 'map-subtitle')
            .text('Monthly active users from Facebook Marketing API (Oct 2020)')
            .attr('transform', `translate(${vis.width / 2}, 40)`)
            .attr('text-anchor', 'middle')
            .style('font-size', "12px")


        // add color legend
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${5}, ${vis.height - 20})`)

        vis.colorScale = d3.scaleLinear()


        vis.legendScale = d3.scaleLinear()
            .range([0, vis.width / 4])


        vis.legendAxisGroup = vis.legend.append("g")
            .attr("class", "axis axis--legend");

        // color gradient
        vis.linearGradient = vis.legend.append('defs').append('linearGradient')
            .attr('id', "grad3")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")

        vis.linearGradient.append('stop')
            .attr("offset", "0%")
            .style("stop-color", "#ffffff")
            .style("stop-opacity", "1")

        vis.linearGradient.append('stop')
            .attr("offset", "100%")
            .style("stop-color", gradientColor)
            .style("stop-opacity", "1")

        vis.legend
            .append('rect')
            .attr('width', vis.width / 4)
            .attr('height', 20)
            .attr('x', 0)
            .attr('y', -20)
            .attr('fill', "url(#grad3)")

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')


        //d3.geoOrthographic()
        vis.rotate = [0, 0]
        vis.zoom = vis.height / 1000;

        vis.projection = d3.geoEquirectangular() // d3.geoStereographic()
            .scale(249.5 * vis.zoom)
            .translate([vis.width / 2, vis.height / 2]);
        // .translate([vis.width / 2, vis.height / 2])
        // .scale(249.5 * vis.zoom) // 249.5 is default. so multiply that by your zoom
        // .rotate(vis.rotate);


        // path provider
        vis.path = d3.geoPath()
            .projection(vis.projection);


        vis.svg.append("path")
            .datum(
                {type: "Sphere"}
            )
            .attr("class", "graticule")
            .attr('fill', '#efefef')
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);


        vis.svg.append("path")
            .datum(d3.geoGraticule())
            .attr("class", "graticule")
            .attr('fill', '#efefef')
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);


        // Convert TopoJSON to GeoJSON (target object = 'states')
        let world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        vis.countries = vis.svg.selectAll(".country")
            .data(world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)

        //
        let m0,
            o0;


        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        );

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        if (selectedButton==-1) {
            vis.arrayData = []
            vis.arrayData = formatOverviewData(vis.expatData["gender"])
            vis.filterData = vis.arrayData.filter(d => {
                return d["gender"] == 0
            })
            vis.filterData = Array.from(d3.group(vis.filterData, d => d.country), ([key, value]) => ({key, value}))
        } else {
            // create random data structure with information for each land
            vis.arrayData = []
            vis.arrayData = formatData(vis.expatData[selectedCategory])

            vis.filterData = vis.arrayData.filter(d => {
                return d[selectedCategory] == selectedButton
            })
            // console.log(vis.filterData)
            vis.filterData = Array.from(d3.group(vis.filterData, d => d.country), ([key, value]) => ({key, value}))

        }


        vis.updateVis()
    }


    updateVis() {
        let vis = this;

        // console.log("vis.updateVis()")

        vis.colorScale.domain([0, d3.max(vis.arrayData, d => d.dau)]).range(["white", gradientColor])
        vis.legendScale.domain([0, d3.max(vis.arrayData, d => d.dau)]).nice()
        d3.selectAll("stop")
            .filter(function(d, i) {
                return i === 1;
            }).style("stop-color", gradientColor);

        vis.legendAxis = d3.axisBottom()
            .scale(vis.legendScale)
            .ticks(4)
            .tickFormat(d3.format(".1s"))

        // update axis
        vis.legendAxisGroup
            .transition()
            .duration(400)
            .call(vis.legendAxis);

        // update country fill color
        vis.countries
            .on('mouseover', function (event, d) {
                var country_name = d.properties.admin
                let country_info = vis.filterData.find(d => d.key == country_name)

                if (country_info) {
                    selectedCountry = country_name;
                    myBarVisOne.updateHover()

                    let info = country_info.value[0]
                    let tooltipText = ""
                    if (selectedButton == -1) {
                        tooltipText =`<div>
                            <h4>${country_name}<h4>
                            <h5>Expats from Serbia: ${d3.format(',')(info.dau)}</h5>
                        </div>`
                    } else {
                        tooltipText = `
                        <div>
                            <h4>${country_name}<h4>
                            <h5>${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}: ${buttonList[selectedButton]}<h5>
                            <h5>Expats from Serbia: ${d3.format(',')(info.dau)}</h5>
                        </div>`
                    }


                    d3.select(this)
                        .attr('stroke', 'darkred')
                        .attr('stroke-width', 1)
                        .attr('fill', 'rgba(255,0,0,0.47)')
                        .style('opacity', 1)

                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px")
                        .html(tooltipText);
                }


            })
            .on('mouseout', function (event, d) {
                let country_name = d.properties.admin
                let country_info = vis.filterData.find(d => d.key == country_name)
                selectedCountry = 'none'
                myBarVisOne.updateHover()

                if (country_info) {
                    let info = country_info.value[0]
                    d3.select(this)
                        .attr('stroke', 'rgb(14,15,85)')
                        .attr('stroke-width', 1)
                        .style('opacity', 1)
                        .attr('fill', d => vis.colorScale(info.dau))
                        .attr("stroke", 'transparent')

                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0 + "px")
                        .style("top", 0 + "px")
                }
            })
            .transition()
            .duration(500)
            .attr("class", d => "country " + d.properties.admin.replaceAll(" ", ""))
            .attr('fill', function (d) {
                let country_name = d.properties.admin;
                let country_info = vis.filterData.find(d => d.key == country_name)
                if (country_info) {
                    let info = country_info.value[0]
                    return vis.colorScale(info.dau)
                } else return "white"
            })

        var titleText = selectedButton == -1 ?  "All" : buttonList[selectedButton]
        d3.select(".map-title")
            .text("Serbian Expats by Countries - " + titleText)

    }

    updateHover() {
        let vis = this
        let selectedCountryClass = selectedCountry.replaceAll(" ", "")
        if (selectedCountryClass !== "none") {
            d3.selectAll("." + selectedCountryClass)
                .attr('stroke-width', 1)
                .attr('fill', 'rgba(255,0,0,0.47)')
        } else {
            d3.selectAll(".country")
                .attr('stroke-width', .1)
                .attr('stroke', '#000000')
                .attr('fill', function (d) {
                    let country_name = d.properties.admin;
                    let country_info = vis.filterData.find(d => d.key == country_name)
                    if (country_info) {
                        let info = country_info.value[0]
                        return vis.colorScale(info.dau)
                    } else return "white"
                })
        }

    }
}

