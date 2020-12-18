/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let myDataTable,
	myMapVis,
	myBarVisOne,
	myStackedBarVis

let gradientColor = "green";
let selectedButton = -1;
let selectedCountry = 'none';

// category to show: gender, education, age, relationship
let selectedCategory = $('#categorySelector').val();

let buttonList = {}
let tableList = {}

let genderList={
	// 0: "All",
	1: "Male",
	2: "Female"
}
let educationList={
	0: "Graduated",
	1: "High School",
	2: "No Degree"
}
let ageList={
	0: "13-17",
	1: "18-24",
	2: "25-34",
	3: "35-44",
	4: "45-54",
	5: "55-64",
	6: "65+"
}
let relationshipList={
	0: "single",
	1: "in_relationship"
}

// define the metrics to show in dataTable
let genderTableList={
	"All": d=> d.value[0].dau,
	"Male":d=> d.value[1].dau,
	"Female": d=> d.value[2].dau,
	"Percent Male": d=> Math.round(d.value[1].dau/d.value[0].dau*100)
}
let educationTableList={
	"Graduated": d=> d.value[0].dau,
	"High School":d=> d.value[1].dau,
	"No Degree": d=> d.value[2].dau,
	"Graduated %": d=> Math.round(d.value[0].dau/ (d.value[0].dau + d.value[1].dau + d.value[2].dau)*100)
}
let ageTableList={
	"13-17": d=> d.value[0].dau,
	"18-24": d=> d.value[1].dau,
	"25-34": d=> d.value[2].dau,
	"35-44": d=> d.value[3].dau,
	"45-54": d=> d.value[4].dau,
	"55-64": d=> d.value[5].dau,
	"65+": d=> d.value[6].dau
}
let relationshipTableList={
	"single": d=> d.value[0].dau,
	"in_relationship": d=> d.value[1].dau,
	"single %": d=> Math.round(d.value[0].dau/ (d.value[0].dau + d.value[1].dau)*100),
	"relationship %": d=> Math.round(d.value[1].dau/ (d.value[0].dau + d.value[1].dau)*100)
}
function categoryChange() {
	selectedCategory = $('#categorySelector').val();
	selectedButton = -1;

	selectData();
	createButton();
	changeTitles(selectedCategory);
	$("#barDiv").hide();
	$("#stackedBarDiv").show();
	myMapVis.wrangleData();
	myBarVisOne.wrangleData();
	myStackedBarVis.wrangleData();
	myDataTable.wrangleData();
}

function changeTitles(title){
	console.log(title)
	// update MapTitle
	$(".title.map-title").html(title)
	// update Barchart
}



// load data using promises
let promises = [
	d3.json("data/world-topo.json"),
	d3.csv("data/2020-10-05-gender.csv"),
	d3.csv("data/2020-10-05-education.csv"),
	d3.csv("data/2020-10-04-age-13to17.csv"),
	d3.csv("data/2020-10-04-age-18to24.csv"),
	d3.csv("data/2020-10-04-age-25to34.csv"),
	d3.csv("data/2020-10-04-age-35to44.csv"),
	d3.csv("data/2020-10-04-age-45to54.csv"),
	d3.csv("data/2020-10-04-age-55to64.csv"),
	d3.csv("data/2020-10-04-age-65.csv"),
	d3.csv("data/2020-10-05-relationship.csv")
];

Promise.all(promises)
	.then( function(data){ console.log(data); initMainPage(data) })
	.catch( function (err){console.log(err)} );


// initMainPage
function initMainPage(dataArray) {
	selectData();
	createButton();
	// init map
	let expatData ={
		"gender": dataArray[1],
		"education": dataArray[2],
		"age": dataArray[3].concat(dataArray[4],dataArray[5],dataArray[6],dataArray[7],dataArray[8], dataArray[9]),
		"relationship": dataArray[10]
	}

	myMapVis = new MapVis('mapDiv', dataArray[0], expatData);
	myBarVisOne = new BarVis('barDiv', expatData);
	$("#barDiv").hide();
	myStackedBarVis = new StackedBarVis('stackedBarDiv', expatData);
	myDataTable = new DataTable('dataDiv', expatData)
	// console.log(expatData)

}

function formatData(data) {
	let formatedData = []

	if (selectedCategory=="gender"){
		data.map(d=>{
			let loc_str = d.geo_locations.replaceAll('\'', '\"')
			let loc = JSON.parse(loc_str)
			formatedData.push({
				"country": country_list.find(d=> d.country_code==loc.values[0]).name,
				"gender": +parseInt(d.genders),
				"mau": +parseInt(d.mau_audience),
				"dau": +parseInt(d.dau_audience)
			})
		})
	} else if (selectedCategory=="education"){
		data.map(d=>{
			let loc_str = d.geo_locations.replaceAll('\'', '\"')
			let loc = JSON.parse(loc_str)
			let edu_str = d.scholarities.replaceAll('\'', '\"')
			let edu = JSON.parse(edu_str)

			formatedData.push({
				"country": country_list.find(d=> d.country_code==loc.values[0]).name,
				"education": Object.keys(educationList).find(key => educationList[key] === edu.name),
				"mau": +parseInt(d.mau_audience),
				"dau": +parseInt(d.dau_audience)
			})
		})
	} else if (selectedCategory=="age"){
		data.map(d=>{
			let loc_str = d.geo_locations.replaceAll('\'', '\"')
			let loc = JSON.parse(loc_str)
			let age_str = d.ages_ranges.replaceAll('\'', '\"')
			let age = JSON.parse(age_str)
			let age_range = age.max ? age.min + "-" + age.max : age.min + "+"

			formatedData.push({
				"country": country_list.find(d=> d.country_code==loc.values[0]).name,
				"age": Object.keys(ageList).find(key => ageList[key] === age_range),
				"mau": +parseInt(d.mau_audience),
				"dau": +parseInt(d.dau_audience)
			})
		})
	} else if (selectedCategory=="relationship"){
		data.map(d=>{
			let loc_str = d.geo_locations.replaceAll('\'', '\"')
			let loc = JSON.parse(loc_str)
			let rel_str = d.relationship_statuses.replaceAll('\'', '\"')
			let rel = JSON.parse(rel_str)

			formatedData.push({
				"country": country_list.find(d=> d.country_code==loc.values[0]).name,
				"relationship": Object.keys(relationshipList).find(key => relationshipList[key] === rel.name),
				"mau": +parseInt(d.mau_audience),
				"dau": +parseInt(d.dau_audience)
			})
		})
	}

	return formatedData
}

// for "Overview" button only
function formatOverviewData(data) {
	let formatedData = []
	data.map(d=>{
			let loc_str = d.geo_locations.replaceAll('\'', '\"')
			let loc = JSON.parse(loc_str)
			formatedData.push({
				"country": country_list.find(d=> d.country_code==loc.values[0]).name,
				"gender": +parseInt(d.genders),
				"mau": +parseInt(d.mau_audience),
				"dau": +parseInt(d.dau_audience)
			})
	})

	return formatedData
}

function createButton() {
	$("#button-selection").empty();
	// default overview button
	var button = document.createElement("button");
	button.innerHTML = "Overview";
	button.setAttribute("class", "btn btn-primary mr-2 active");
	button.setAttribute("value", -1);
	button.setAttribute("type", "button");
	button.addEventListener("click", function () {
		$("#stackedBarDiv").show();
		$("#barDiv").hide();
		selectedButton = parseInt($(this).val());
		myMapVis.wrangleData();
		myStackedBarVis.wrangleData();
		myDataTable.wrangleData();
	});
	$("#button-selection").append(button);

	Object.keys(buttonList).map(i => {
		var button = document.createElement("button");
		button.innerHTML = buttonList[i];
		button.setAttribute("class", "btn btn-secondary mr-2");
		button.setAttribute("value", i);
		button.setAttribute("type", "button");
		button.addEventListener("click", function () {
			$("#barDiv").show();
			$("#stackedBarDiv").hide();
			selectedButton = parseInt($(this).val());
			myMapVis.wrangleData();
			myBarVisOne.wrangleData();
			myDataTable.wrangleData();
		});
		$("#button-selection").append(button);
	})

}

function selectData() {
	switch (selectedCategory){
		case "gender":
			buttonList = genderList;
			tableList = genderTableList;
			gradientColor="green"
			break;
		case "education":
			buttonList = educationList;
			tableList = educationTableList;
			gradientColor="blue"
			break;
		case "age":
			buttonList = ageList;
			tableList = ageTableList;
			gradientColor="red"
			break;
		case "relationship":
			buttonList = relationshipList;
			tableList = relationshipTableList;
			gradientColor="orange"
			break;
		default:
			break;
	}

}
