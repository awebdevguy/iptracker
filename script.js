/* 
  IP Address Tracker/Locator on map.
  Gets City, Region, Country, Zip, Timezone, ISP
*/
/*jshint esversion: 6 */

const input = document.getElementById("ip-input");
const searchButton = document.getElementById("submit");
const ipElement = document.getElementById("ip-address");
const locationElement = document.getElementById("location");
const timezoneElement = document.getElementById("timezone");
const offsetElement = document.getElementById("offset");
const ispElement = document.getElementById("isp");
const resultsContainer = document.getElementsByClassName("results-container");
const hideShow = document.getElementById("hide-show");
let popupMsg = document.createElement("div");
let mymap;
let marker;
const zoomSize = 15;
// const mapKey = MAPBOX_KEY; // If using Mapbox, not needed for OSM

// Load
locateIP();

// HTTP Request using plain js
function locateIP() {
	let ipAddress = input.value;
	const xhr = new XMLHttpRequest(),
		method = "GET",
		url = `http://ip-api.com/json/${ipAddress}?fields=33580031`;

	xhr.open(method, url, true);
	xhr.onreadystatechange = function () {
		// In local files, status is 0 upon success in Mozilla Firefox
		if (xhr.readyState === XMLHttpRequest.DONE) {
			var status = xhr.status;
			if (status === 0 || (status >= 200 && status < 400)) {
				const data = JSON.parse(xhr.responseText); // Convert json response to js object
				// console.log("xhr: ", xhr);
				enterAddressInfo(data);
				enterMapInfo(data);
			} else {
				alert("There was a problem connecting.");
			}
		}
	};
	xhr.send();
}

// Fill in results container
function enterAddressInfo(data) {
	// Destructure data object
	const { lat, lon, query, city, region, regionName, country, countryCode, zip, timezone, offset, isp } = data;
	// console.log(lat, lon, query, city, region, regionName, country, countryCode, zip, timezone, offset, isp);

	// Address not found or available
	if (!city) {
		ipElement.textContent = "Not Found";
		locationElement.textContent = "-";
		timezoneElement.textContent = "-";
		offsetElement.textContent = "";
		ispElement.textContent = "-";
	} else {
		ipElement.textContent = query;
		locationElement.textContent = `${city}, ${region} ${country} ${zip}`;
		const utc = msToTime(offset); // Format UTC
		const sign = offset > 0 ? "+" : "";
		timezoneElement.textContent = timezone;
		offsetElement.textContent = `UTC ${sign}${utc}`;
		ispElement.textContent = isp;
		popupMsg.innerHTML = `${query}<br>${city}, ${region} ${country} ${zip}<br>UTC: ${sign}${utc}<br>${isp}<br>Latitude: ${lat}<br>Longitude: ${lon}`;
	}
}

// Calculate then formats UTC
function msToTime(s) {
	// Pad to 2 or 3 digits, default is 2
	function pad(n, z) {
		z = z || 2;
		return ("00" + n).slice(-z);
	}

	// var ms = s % 1000;
	// s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	return pad(hrs) + ":" + pad(mins);
	// return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}

// Marker icon
var dropIcon = L.icon({
	iconUrl: "images/icon-location.svg",
	iconSize: [30, 40], // size of the icon
	shadowSize: [50, 64], // size of the shadow
	iconAnchor: [14, 0], // point of the icon which will correspond to marker's location
	// iconAnchor: [14, -50], // point of the icon which will correspond to marker's location
	shadowAnchor: [4, 62], // the same for the shadow
	popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
	// popupAnchor: [2, 50] // point from which the popup should open relative to the iconAnchor
});

// Fill in map coordinates
function enterMapInfo(data) {
	try {
		if (mymap) {
			loadMapView(data); // If map already loaded just render map view
		} else {
			initialMapLoad(data); // If map not yet loaded, load.
		}

		if (marker) {
			mymap.removeLayer(marker); // remove existing marker before creating new one
		}

		marker = new L.marker([data.lat, data.lon], {
			icon: dropIcon
		})
			.addTo(mymap)
			.bindPopup(popupMsg)
			.closePopup();

		if (hideShow.innerHTML === "Details") {
			marker.openPopup();
		}
	} catch (e) {
		console.log(e);
	}
}

/* Mapbox styles */
// mapbox/streets-v11
// mapbox/outdoors-v11
// mapbox/light-v10
// mapbox/dark-v10
// mapbox/satellite-v9
// mapbox/satellite-streets-v11

// Initial loading of mymap and during page refresh/reload
function initialMapLoad(coord) {
	mymap = L.map("map-container").setView([coord.lat, coord.lon], zoomSize);

	// If using OpenStreetMap tiles
	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	}).addTo(mymap);

	// show the scale bar on the lower left corner
	L.control.scale().addTo(mymap);

	// If using Mapbox tiles
	// L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
	// 	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	// 	maxZoom: 18,
	// 	id: "mapbox/streets-v11",
	// 	// id: "mapbox/outdoors-v11",
	// 	// id: "mapbox/light-v10",
	// 	// id: "mapbox/dark-v10",
	// 	// id: "mapbox/satellite-streets-v11",
	// 	// id: "mapbox/satellite-v9",
	// 	tileSize: 512,
	// 	zoomOffset: -1,
	// 	zoomControl: true,
	// 	accessToken: mapKey
	// }).addTo(mymap);
}

// Changing map view without reloading or refreshing page
function loadMapView(coord) {
	try {
		mymap.setView([coord.lat, coord.lon], zoomSize);
	} catch (e) {
		console.log(e);
		alert("Please enter a valid ip or domain address to search.");
	}
}

function handleClick(e) {
	e.preventDefault(); // Make changes without reloading page
	locateIP();
}

searchButton.addEventListener("click", handleClick);

function hideResultsContainer(e) {
	e.preventDefault();
	if (hideShow.innerHTML === "Hide") {
		resultsContainer[0].style.visibility = "hidden";
		hideShow.innerHTML = "Details";
		hideShow.title = "Show details";
		hideShow.style.right = "0";
		hideShow.style.visibility = "visible";
		marker.openPopup();
	} else {
		resultsContainer[0].style.visibility = "visible";
		hideShow.innerHTML = "Hide";
		hideShow.title = "Hide details";
		hideShow.style.right = "10px";
		hideShow.style.visibility = "visible";
		marker.closePopup();
	}
}

hideShow.addEventListener("click", hideResultsContainer);

function moveDetails(x) {
	if (x.matches && hideShow.innerHTML == "Details") {
		hideShow.style.right = "0";
	} else {
		hideShow.style.right = "10px";
	}
}

var screenW = window.matchMedia("(max-width: 900px)");
screenW.addEventListener("change", screenW => {
	if (screenW.matches && hideShow.innerHTML == "Details") {
		hideShow.style.right = "0";
	} else {
		hideShow.style.right = "10px";
	}
});
