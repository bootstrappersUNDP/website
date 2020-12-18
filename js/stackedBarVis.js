/* * * * * * * * * * * * * *
*        ScatterVis        *
* * * * * * * * * * * * * */


class StackedBarVis {

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
        vis.colorScale = d3.scaleOrdinal()

        vis.margin = {top: 40, right: 20, bottom: 20, left: 150};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        vis.legendWidth = 80

        // add title
        d3.select("#" + vis.parentElement).append('g')
            .attr('class', 'title stacked-bar-title')
            .append('text')
            .text('Top 10 countries - All ' + selectedCategory + ' groups')
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
            .attr('class', 'barG')

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
        vis.legendG = d3.select("#" + vis.parentElement).append('svg')
            .attr('class', 'legend')
            .style('top', - $("#" + vis.parentElement).height() + vis.margin.top /3)
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            // .attr('transform', `translate(${vis.width / 2}, 0)`)

        vis.browserText = (function () {
            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');
            /**
             * Measures the rendered width of arbitrary text given the font size and font face
             * @param {string} text The text to measure
             * @param {number} fontSize The font size in pixels
             * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
             * @returns {number} The width of the text
             **/
            function getWidth(text, fontSize, fontFace) {
                context.font = fontSize + 'px ' + fontFace;
                return context.measureText(text).width;
            }

            return {
                getWidth: getWidth
            };
        })();

        // having initialized the map, move on to wrangle data
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this

        vis.stackedList = buttonList
        if (selectedCategory=="gender"){
            delete vis.stackedList[0]
        }
        // console.log(vis.stackedList)
        vis.arrayData = formatData(vis.expatData[selectedCategory])
        // vis.filterData = d3.rollup(vis.arrayData, v=>d3.sum(v, d=>d.mau), d=> d.country)
        // vis.groupedData = d3.group(vis.arrayData, d=> d.country)
        vis.groupedData = d3.rollup(vis.arrayData, function(v) {
            let calculated_obj = {}
            Object.keys(vis.stackedList).map((i) =>{
                calculated_obj[vis.stackedList[i]] = d3.sum(v, function(d) { return d[selectedCategory] == i ? d.dau : 0})
            })
            calculated_obj["sum"] = d3.sum(v, function(d) { return d.dau})
            return calculated_obj
                //
                // return {
                //     sum: d3.sum(v, function(d) { return d.gender==1 || d.gender==2 ?d.mau : 0; }),
                //     male: d3.sum(v, function(d) { return d.gender==1 ? d.mau : 0; }),
                //     female: d3.sum(v, function(d) { return d.gender==2 ? d.mau : 0; }),
                // };
            }, d=>d.country);

        // convert to flat format
        vis.filterData = Array.from(vis.groupedData,function ([key, value]) {
            let calculated_obj = {}
            Object.keys(vis.stackedList).map((i) =>{
                calculated_obj[vis.stackedList[i]] = value[vis.stackedList[i]]
            })
            calculated_obj.country = key
            calculated_obj.sum = value.sum
                return calculated_obj
            })

        vis.filterData = vis.filterData.sort((a,b) => {return b.sum - a.sum})

        vis.topTenData = vis.filterData.slice(0, 10)

        // console.log(Object.keys(vis.topTenData[0]).slice(1))

        vis.series = d3.stack()
            .keys(Object.values(vis.stackedList))
            (vis.topTenData)
            .map(d => (d.forEach(v => v.key = d.key), d))
        // console.log(vis.series)

        vis.legendWidth = d3.max(vis.series, d=> vis.browserText.getWidth(d.key, 12)) + 60

        // console.log('final data structure', vis.series, vis.legendWidth);
        vis.updateVis()

    }

    updateVis(){
        let vis = this;

       vis.colorScale.domain(vis.series.map(d=> d.key))
            .range(d3.schemeTableau10)
            .unknown("#ccc")

        // scale for x axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0, d3.max(vis.series, d=> d3.max(d, d=>d[1]))])
            // .domain([0, d3.max(vis.arrayData, d => d.mau)*1.2])

        // scale for y axis
        vis.yScale = d3.scaleBand()
            .domain((vis.topTenData).map(d => d.country))
            .range([0, vis.height])
            .round(true)
            .padding(.2)

        // scale for legend
        vis.colors = d3.scaleOrdinal(d3.schemeCategory10);

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
        vis.barG.selectAll("g")
            .data(vis.series)
            .join("g")
            .attr("fill", d => vis.colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr('class', d => "topTenBars " + d.data.country.replaceAll(" ", ""))
            .attr('x',  0)
            .attr('height', vis.yScale.bandwidth())
            .on('mouseover', function(event, d){
                selectedCountry = d.data.country;
                // myMapVis.updateHover()
                // update color of hovered state
                d3.select(this)
                    .attr('stroke','darkred')
                    .attr('stroke-width', 1)
                    .attr('fill', 'rgba(255,0,0,0.47)')
                    .style('opacity', 1)

                let tooltipText = ""
                Object.values(vis.stackedList).map(k => {
                    tooltipText+= "<h5>"+ k + ": " + d3.format(',')(d.data[k])+"</h5>"
                })
                // update tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`<div>
                            <h4>${d.data.country}<h4>
                            <h5>Expats from Serbia<h5>`
                            + tooltipText +`</div>`);
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
                    .attr('fill', d => vis.colorScale(d.key));
            })
            .attr('y', d => vis.yScale(d.data.country))
            .transition()
            .duration(1000)
            .attr('x', d=> vis.xScale(d[0]))
            .attr('y', d => vis.yScale(d.data.country))
            .attr('width', d => vis.xScale(d[1])-vis.xScale(d[0]))
            .attr('stroke-width', .1)
            .attr('stroke', '#000000')
            .attr('fill', d => vis.colorScale(d.key));

        // // draw bar labels
        // vis.barLabels = vis.barG.selectAll(".barLabels").data(vis.topTenData)
        //
        // vis.barG.selectAll("g .barLabelsG")
        //     .data(vis.series)
        //     .join("g")
        //     .attr("class", "barLabelsG")
        //     .selectAll("text")
        //     .data(d => d)
        //     .join("text")
        //     .attr('class', "barLabels")
        //     // .attr('x', d => vis.xScale(d.mau) + 10 )
        //     .attr('y', d => vis.yScale(d.data.country) + vis.yScale.bandwidth()/2)
        //     .transition()
        //     .duration(1000)
        //     .attr('x', d=> vis.xScale(d[0]) + 10)
        //     .attr('y', d => vis.yScale(d.data.country) + vis.yScale.bandwidth()/2)
        //     .attr('dy', "0.3em")
        //     .text(d=> d3.format('.2s')(d.data[d.key]))
        //     .attr('fill', 'white');

        // draw legends
        vis.legend = vis.legendG.selectAll('rect')
            .data(vis.series)

        vis.legend
            .enter()
            .append('rect')
            .merge(vis.legend)
            .attr('x', (d, i) => i * vis.legendWidth )
            .attr('y', 0)
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', function(d, i){
                return vis.colorScale(d.key);
            });

        vis.legend.exit().remove();

        vis.legendText  = vis.legendG.selectAll('text')
            .data(vis.series)

        vis.legendText.enter()
            .append('text')
            .merge(vis.legendText)
            .text(d=>d.key)
            .attr('x', (d,i) => 20 + i * vis.legendWidth)
            .attr('y', 0)
            .attr('text-anchor', 'start')
            .attr('alignment-baseline', 'hanging');

        vis.legendText.exit().remove();

        d3.select(".stacked-bar-title")
            .text('Top 10 countries - All ' + selectedCategory + ' groups')

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