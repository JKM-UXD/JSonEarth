
// Fetching the Nasa Information on incoming Asteroids

function getNasaApiData() {


    // creating a new Data to get the relevant data each day
	var todaysDate = new Date();

    day = todaysDate.getDate();
    month = todaysDate.getMonth()+1;
    year = todaysDate.getUTCFullYear();

    if(day < 10) {
        day = '0'+day;
    }

    if(month < 10) {
        month = '0'+month;
    }

    // formatting it for the Nasa API
    date = year + '-' + month + '-' + day;



	
	var url = 'https://api.nasa.gov/neo/rest/v1/feed';
    var apiKey = 'nSkWIEbDCzzPUSZ8H3JLp7c0Oqw9CtQg86BMNkIu';

	var request = url + '?' + 'start_date=' + date + '&' + 'api_key=' + apiKey;

	fetch(request).then(function(response) {
		if(!response.ok) {
			throw Error(response.statusText);
		}
        return response.json();
    })
    .then(function(response) {
		console.log(response);

            // only retrieving data from the selected date
			var amountOfObjects = response.near_earth_objects[date].length;

			for(i = 0; i < amountOfObjects; i++) {
				var list = document.getElementById('asteroidNames');
				var li = document.createElement('li');

				li.appendChild(document.createTextNode(response.near_earth_objects[date][i].name));
                li.appendChild(document.createTextNode('; ------'));
                li.appendChild(document.createTextNode(' Is hazardous to Earth?: '));
                li.appendChild(document.createTextNode(response.near_earth_objects[date][i].is_potentially_hazardous_asteroid));
                li.appendChild(document.createTextNode('; ------'));
                li.appendChild(document.createTextNode(' Time of closest approach to Earth: '));
                li.appendChild(document.createTextNode(response.near_earth_objects[date][i].close_approach_data[0].close_approach_date_full));
                li.appendChild(document.createTextNode('; ------'));
                li.appendChild(document.createTextNode(' Distance to Earth: '));
                li.appendChild(document.createTextNode(Math.floor(response.near_earth_objects[date][i].close_approach_data[0].miss_distance.kilometers)));
                li.appendChild(document.createTextNode("km"));
				list.appendChild(li);
			}
    })

	.catch(function() {
		alert('Error')
	});
}

getNasaApiData();







// Mapbox initialisation

mapboxgl.accessToken = 'pk.eyJ1IjoiampqampqampqamoiLCJhIjoiY2txM3hnMHdsMDhxZzJ2bXBsN2UwbnQzZiJ9.mtc-UPwH2gGHzBDXawnhTg';

var ksc = [-80.65, 28.56];

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: ksc,
    zoom: 14,
});

// Placing a marker on the Kennedy Space Center
var marker1 = new mapboxgl.Marker().setLngLat(ksc).addTo(map);





// Placing a new green marker everytime the user clicks
var landingSpot = new mapboxgl.Marker({color: 'green'});

// Retrieving longitude and latitude on the map and using it as parameters for the other API functions
map.on('click', function (e) {
    var coordinates = e.lngLat;
    console.log(coordinates);

    var longitude = coordinates.lng;
    var latitude = coordinates.lat;
    console.log(longitude, latitude);

    landingSpot.remove();
    landingSpot.setLngLat(e.lngLat).addTo(map);

    calculateDistance(longitude, latitude);
    getTravelTime(longitude, latitude);
    getElevation(longitude, latitude);
    getWeatherData(longitude, latitude);
});



// using turf.js to calculate the distance between landing spot and KSC
function calculateDistance(longitude, latitude) {
    var options = {
        units: 'kilometers'
    };

    var from = [longitude, latitude];
    var dist = turf.distance(ksc, from, options);
    distance = Math.round(dist);

    var displayDistance = document.getElementById('distance');
    displayDistance.innerHTML = "Distance to the Kennedy Space Center: " + distance + " kilometers";
}
 


// Fetching the Mapbox Directions API to get the duration object of the route from landing spot to KSC
function getTravelTime(longitude, latitude) {

    var urlMapBox = "https://api.mapbox.com/directions/v5/mapbox/driving/"

    var request2 = urlMapBox + longitude + ',' + latitude + ';-80.65, 28.56?geometries=geojson&access_token=' + mapboxgl.accessToken;

    fetch(request2).then(function(response) {
        if(!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(function(response) {
        console.log(response);

        var seconds = response.routes[0].duration;
        var minutes = Math.round(seconds/60);

        if(minutes > 59) {
            hours = Math.floor(minutes/60);
            document.getElementById('travelTime').innerHTML = 'Travel Time: ' + hours + 'h';
        }
        else {
            document.getElementById('travelTime').innerHTML = 'Travel Time: ' + minutes + 'min';
        }
    })
    // I disabled the error message, otherwise it would put out an error each time you click overseas
}



// Fetching the mapbox tilequery to access the elevation property
function getElevation(longitude, latitude) {

    var urlMapBox2 = "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/"

    var request3 = urlMapBox2 + longitude + ',' + latitude + '.json?layers=contour&access_token=' + mapboxgl.accessToken;

    fetch(request3).then(function(response) {
        if(!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(function(response) {
        console.log(response);

        var elev = response.features[0].properties.ele;
        console.log(elev);
        document.getElementById('elevation').innerHTML = 'Elevation: ' + elev + 'm';
    })

    .catch(function() {
        alert('Something went wrong')
    });
}



// Creating and adding a new Geocoder and a navigation control
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    zoom: 4,
    placeholder: 'Search for a place',
    mapboxgl: mapboxgl,
})

map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());


// Using the coordinates of the search-result as parameters for the other API functions
geocoder.on('result', function(e) {
    console.log(e.result.geometry);

    longitude = e.result.geometry.coordinates[0];
    latitude = e.result.geometry.coordinates[1];

    calculateDistance(longitude, latitude);
    getWeatherData(longitude, latitude);
    getTravelTime(longitude, latitude);
    getElevation(longitude, latitude);
});





// Fetching the Weather Data of the nearest weather station to the selected landing spot

function getWeatherData(longitude, latitude) {
    var url = 'https://api.openweathermap.org/data/2.5/weather'
    var key = '4d931dc0b10efaf4f70ed7091a158254';

    var request = url + '?lat=' + latitude + '&lon=' + longitude + '&appid=' + key;

    fetch(request).then(function(response) {
        if(!response.ok) {
            throw Error(response.statusText);
        }
        return response.json();
    })
    .then(function(response) {
        console.log(response);

        var station = response.name;
        var country = response.sys.country;
		var temp = response.main.temp;
        var temperature = Math.round(temp-270.15);
        var weather = response.weather[0].description;
        document.getElementById('infoWeather').innerHTML = 'Nearest Station: ' + station + ', ' + country + '<br>' + 'Temperature: ' + temperature + '°C' + '<br>' + weather;
    })

    .catch(function() {
        alert('Something went wrong')
    });
}

























// This section is entirely from the Mapbox examples (adding the Ocean depth and switching styles)

map.on('load', function () {

    map.addSource('10m-bathymetry-81bsvj', 
        {
            type: 'vector',
            url: 'mapbox://mapbox.9tm8dx88'
        });
     
    map.addLayer(
        {
        'id': '10m-bathymetry-81bsvj',
        'type': 'fill',
        'source': '10m-bathymetry-81bsvj',
        'source-layer': '10m-bathymetry-81bsvj',
        'layout': {},
        'paint': {
            'fill-outline-color': 'hsla(337, 82%, 62%, 0)',
            'fill-color': [
                'interpolate',
                ['cubic-bezier', 0, 0.5, 1, 0.5],
                ['get', 'DEPTH'],
                200,
                '#78bced',
                9000,
                '#15659f'
            ]
        }
        },
        'land-structure-polygon'
    );
});


var layerList = document.getElementById('menu');
var inputs = layerList.getElementsByTagName('input');
 
function switchLayer(layer) {
    var layerId = layer.target.id;
    map.setStyle('mapbox://styles/mapbox/' + layerId);
}
 
for (var i = 0; i < inputs.length; i++) {
    inputs[i].onclick = switchLayer;
}