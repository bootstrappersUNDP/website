
class DataTable {

    // constructor method to initialize Timeline object
    constructor(parentElement, expatData) {
        this.parentElement = parentElement;
        this.expatData = expatData;

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initTable()
    }

    initTable(){
        let tableObject = this
        tableObject.table = d3.select(`#${tableObject.parentElement}`)
            .append("table")
            .attr("class", "sortable table-bordered table")

        // append table head
        tableObject.thead = tableObject.table.append("thead")
        // let innerCol = `<tr><th scope="col">Country</th>`
        // Object.keys(tableList).map(col => {
        //     innerCol += `<th scope="col">`+col+`</th>`
        // })
        // innerCol += `</tr>`
        // tableObject.thead.html(innerCol)



        // append table body
        tableObject.tbody = tableObject.table.append("tbody")

        // wrangleData
        tableObject.wrangleData()
    }

    wrangleData(){
        let tableObject = this

        tableObject.arrayData = formatData(tableObject.expatData[selectedCategory])

        // prepare covid data by grouping all rows by state
        tableObject.formatedData = Array.from(d3.group(tableObject.arrayData, d =>d.country), ([key, value]) => ({key, value}))

        // init final data structure in which both data sets will be merged into
        tableObject.countryRow = []

        // merge
        tableObject.formatedData.forEach( d => {

            // get full state name
            let country = d.key

            let row = {}
            row.country = country
            Object.keys(tableList).forEach(key=>{
                row[key] = tableList[key](d)
            })

            tableObject.countryRow.push(row)
        })

        // console.log('final data structure', tableObject.countryRow);

        tableObject.updateTable()

    }

    updateTable(){
        let tableObject = this;

        // reset thead
        tableObject.thead.html('')
        let innerHead = `<tr><th scope="col">Country</th>`
        Object.keys(tableList).map(col => {
            innerHead += `<th scope="col">`+col+`</th>`
        })
        innerHead += `</tr>`
        tableObject.thead.html(innerHead)

        // reset tbody
        tableObject.tbody.html('')
        tableObject.countryRow.forEach(d =>{
            let row = tableObject.tbody.append("tr")
            let innerCol = `<th scope="row">`+d.country+`</th>`
            Object.keys(tableList).map(col => {
                innerCol += `<th scope="col">`+d[col]+`</th>`
            })
            row.html(innerCol)

            row.on('mouseover', function(){
                selectedCountry = d.country;
                myMapVis.updateHover()
                myBarVisOne.updateHover()

            }).on('mouseout', function(){
                selectedCountry = "none";
                myMapVis.updateHover()
                myBarVisOne.updateHover()

            })
        })

        sorttable.makeSortable(d3.selectAll("table").node());
    }
}