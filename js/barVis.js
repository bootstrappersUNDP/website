/* * * * * * * * * * * * * *
*        ScatterVis        *
* * * * * * * * * * * * * */


class BarVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, expatData) {
        this.parentElement = parentElement;
        this.expatData = expatData;

        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;

        //
        vis.colorScale = d3.scaleLinear()

        vis.margin = {top: 20, right: 20, bottom: 20, left: 150};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // add title
        d3.select("#" + vis.parentElement).append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text('Top 10 countries')
            .attr('transform', `translate(${vis.width / 2}, 0)`)
            .attr('text-anchor', 'middle');

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // drawing g
        vis.barG = vis.svg.append('g')
            .attr('class', 'barG');

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')

        // axis groups
        vis.xAxisGroup = vis.svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`)

        vis.yAxisGroup = vis.svg.append('g')
            .attr('class', 'axis y-axis');

        // legend group
        vis.legendG = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (vis.margin.top + 12) + ', 0)');

        // having initialized the map, move on to wrangle data
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this

        vis.arrayData = formatData(vis.expatData[selectedCategory])
        vis.filterData = vis.arrayData.filter(d => {
            return d[selectedCategory]==selectedButton
        })
        // console.log(vis.arrayData)
        // console.log(vis.filterData )
        vis.filterData.sort((a,b) => {return b.dau - a.dau})

        vis.topTenData = vis.filterData.slice(0, 10)

        // console.log('final data structure', vis.topTenData);
        vis.updateVis()

    }

    updateVis(){
        let vis = this;

        let colors = ["#FFFFFF", "#136D70"]
        vis.colorScale.domain([0, d3.max(vis.arrayData, d => d.dau)])
            .range(["white", gradientColor])

        // scale for x axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0, d3.max(vis.arrayData, d => d.dau)*1.2])

        // scale for y axis
        vis.yScale = d3.scaleBand()
            .domain((vis.topTenData).map(d => d.country))
            .range([0, vis.height])
            .round(true)
            .padding(.2)


        // axis
        vis.xAxisGroup
            .transition()
            .duration(1000)
            .call(d3.axisBottom(vis.xScale)
                    .tickFormat(d => d3.format(".2s")(d)))

        vis.yAxisGroup
            .transition()
            .duration(1000)
            .call(d3.axisLeft(vis.yScale))

        // draw bars
        vis.bars = vis.barG.selectAll("rect").data(vis.topTenData)

        vis.bars.enter().append('rect')
            .merge(vis.bars)
            .attr('class', d => "topTenBars " + d.country.replaceAll(" ", ""))
            .attr('x',  0)
            // .attr('y', d => vis.yScale(d.country))
            // .attr('width', d => vis.xScale(d.mau) )
            .attr('height', vis.yScale.bandwidth())
            .on('mouseover', function(event, d){
                selectedCountry = d.country;
                myMapVis.updateHover()
                // update color of hovered state
                d3.select(this)
                    .attr('stroke','darkred')
                    .attr('stroke-width', 1)
                    .attr('fill', 'rgba(255,0,0,0.47)')
                    .style('opacity', 1)

                // update tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div>
                            <h4>${d.country}<h4>
                            <h5>${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}: 
                                ${buttonList[selectedButton]}<h5>
                            <h5>Expats from Serbia: ${d3.format(",")(d.dau)}</h5>
                        </div>`);
            })
            .on('mouseout', function(event, d){
                selectedCountry = 'none'
                myMapVis.updateHover()

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0 + "px")
                    .style("top", 0 + "px")

                d3.select(this)
                    .attr('stroke-width', .1)
                    .attr('stoke', '#000000')
                    .attr('fill', d => vis.colorScale(d.dau));
            })
            .transition()
            .duration(1000)
            .attr('x', 0)
            .attr('y', d => vis.yScale(d.country))
            .attr('width', d => vis.xScale(d.dau) )
            .attr('stroke-width', .1)
            .attr('stroke', '#000000')
            .attr('fill', d => vis.colorScale(d.dau));

        vis.bars.exit().remove()

        // draw bar labels
        vis.barLabels = vis.barG.selectAll(".barLabels").data(vis.topTenData)

        vis.barLabels.enter().append('text')
            .merge(vis.barLabels)
            .attr('class', "barLabels")
            // .attr('x', d => vis.xScale(d.mau) + 10 )
            .attr('y', d => vis.yScale(d.country) + vis.yScale.bandwidth()/2)
            .transition()
            .duration(1000)
            .attr('x', d => vis.xScale(d.dau) + 10 )
            .attr('y', d => vis.yScale(d.country) + vis.yScale.bandwidth()/2)
            .attr('dy', "0.3em")
            .text(d=> d3.format('.3s')(d.dau))
            .attr('fill', 'black');

        vis.barLabels.exit().remove()



        d3.select(".bar-title")
            .text('Top 10 countries - ' + selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) + ' ' + buttonList[selectedButton])

    }

    updateHover(){
        let vis=this
        let selectedCountryClass = selectedCountry.replaceAll(" ", "")
        if (selectedCountryClass!=="none"){
            d3.selectAll("." + selectedCountryClass)
                .attr('stroke-width', 1)
                .attr('fill', 'rgba(255,0,0,0.47)')
        } else {
            d3.selectAll(".topTenBars")
                .attr('stroke-width', .1)
                .attr('stroke', '#000000')
                .attr('fill', d => vis.colorScale(d.dau));
        }

    }

}