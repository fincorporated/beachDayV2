document.getElementById("go").addEventListener("click", goButton);
document.getElementById("testGeo").addEventListener("click", getMyLocation);
document.getElementById("manualLocation").addEventListener("click", manualLocation);

document.getElementById('state').addEventListener('change', locationInputChange);
document.getElementById('city').addEventListener('input', locationInputChange);

function locationInputChange() {
    if (this.value === "") {
        this.style.color = 'dimgray'
    } else {
        this.style.color = 'black'        
    }

}

function getMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getCoordinates);
    } else {
        alert('geolocation not supported :/');
        document.getElementById('inputFields').style.visibility = 'visible'
    }
}

function manualLocation() {
    document.getElementById('inputFields').style.visibility = 'visible';
    const geoUrl = new URL ("https://geocoding-api.open-meteo.com/v1/search?name=&count=50&language=en&format=json&countryCode=US");
    const params = new URLSearchParams(geoUrl.search);
    const cityName = document.getElementById("city").value;
    params.set("name", cityName);
    geoUrl.search = params.toString();
    const cityURL = geoUrl.toString();
    console.log(cityURL)
    return cityURL;    
}

async function getCoordinatesManually() {
    const stateName = document.getElementById("state").value;
    console.log(stateName)
    const citiesURL = manualLocation();
    const citiesResponse = await fetch(citiesURL);
    const citiesData = await citiesResponse.json();
    if(!citiesData.results) {
        console.log('results undefined')
        alert('ummm check the spelling on your city please')
        document.getElementById("city").innerHTML = '';
        document.getElementById("city").style.borderColor = '#D62828'
        return;
    } else {
        document.getElementById("city").style.borderColor = 'dimgray'
    }
    const findCityState = citiesData.results.filter((item) => item.admin1 === stateName);
    if(findCityState.length === 0) {
        console.log('array empty')
        alert('ummm check the spelling on your state please')
        document.getElementById('state').innerHTML = '';
        document.getElementById('state').style.borderColor = '#D62828'
        return;
    } else {
        document.getElementById("state").style.borderColor = 'dimgray'
    }

    const latitude = findCityState[0].latitude;
    const longitude = findCityState[0].longitude;
    return { latitude: latitude, longitude: longitude }
}

async function getCoordinates(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log('latitude: ' + latitude);
    console.log('longitude: ' + longitude);
    if (document.getElementById('today').rows.length > 0) {
        console.log('clearing table')
        document.getElementById('answer').innerHTML = "";
        const length = document.getElementById('today').rows.length
        for (i = 0; i < length; i++) {
            document.getElementById('today').deleteRow(0);
        }
    }
    await getAnswerForToday(latitude, longitude);    
}

async function goButton() {
    const { latitude, longitude } = await getCoordinatesManually();
    console.log('latitude:' + latitude)
    console.log('longitude' + longitude)
    if (document.getElementById('today').rows.length > 0) {
        console.log('clearing table')
        console.log(document.getElementById('today').rows)
        document.getElementById('answer').innerHTML = "";
        const length = document.getElementById('today').rows.length
        for (i = 0; i < length; i++) {
            console.log(i)
            document.getElementById('today').deleteRow(0);
        }
    }    
    await getAnswerForToday(latitude, longitude);
}

async function getNWSURL(latitude, longitude) {
    console.log(`https://api.weather.gov/points/${latitude},${longitude}`)
    const grid = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`);
    const gridData = await grid.json();
    console.log(gridData.properties.forecastHourly)
    return gridData.properties.forecastHourly
}

async function getTideURL(latitude, longitude) {
    const stationsURL = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=english';
    const stationResponse = await fetch(stationsURL);
    const stationData = await stationResponse.json();
    const matchingLatLong = stationData.stations.filter((object) => object.lat.toFixed(2).toString().slice(0, length-1) === latitude.toFixed(2).toString().slice(0, length-1) && object.lng.toFixed(2).toString().slice(0, length-1) === longitude.toFixed(2).toString().slice(0, length-1));
    const closestLatLong = stationData.stations.filter((object) => (object.lat.toFixed(0) === latitude.toFixed(0) || object.lat.toFixed(0) + 1 === latitude.toFixed(0) || object.lat.toFixed(0) -1 === latitude.toFixed(0)) && (object.lng.toFixed(0) === longitude.toFixed(0) || object.lng.toFixed(0) +1 === longitude.toFixed(0) || object.lng.toFixed(0) -1 === longitude.toFixed(0)))
    const matchingLat = stationData.stations.filter((object) => object.lat.toFixed(2).toString().slice(0, length-1) === latitude.toFixed(2).toString().slice(0, length-1));
    const matchingLong = stationData.stations.filter((object) => object.lng.toFixed(2).toString().slice(0, length-1) === longitude.toFixed(2).toString().slice(0, length-1));
    const differenceInLat = closestLatLong.map((item) => item.lat - latitude);
    const differenceInLng = closestLatLong.map((item) => item.lng - longitude);
    if (matchingLatLong.length === 0) {
        console.log('array is empty, here is the closest array');
        console.log(closestLatLong);
        
        if(closestLatLong.length === 0) {
            document.getElementById("city").value = '';
            alert("you aren't very close to the water, are you?");                
            return
        } else {
            console.log(differenceInLat.indexOf(Math.min(...differenceInLat)))
            console.log(Math.min(...differenceInLat))
            console.log(differenceInLng.indexOf(Math.min(...differenceInLng)))
            console.log(Math.min(...differenceInLng))
            const closestIndex = (Math.abs(Math.min(...differenceInLat)) > Math.abs(Math.min(...differenceInLng))) ? differenceInLng.indexOf(Math.min(...differenceInLng)):differenceInLat.indexOf(Math.min(...differenceInLat));
            console.log(closestIndex)
            console.log(closestLatLong[closestIndex])
            return closestLatLong[closestIndex].id
        }
    }
    const subtractionLat = matchingLatLong.map((object) => object.lat - latitude);
    console.log(subtractionLat)
    console.log(subtractionLat.indexOf(Math.min(...subtractionLat)))
    const subtractionLng = matchingLatLong.map((object) => object.lng - longitude);
    console.log(subtractionLng);
    console.log(subtractionLng.indexOf(Math.min(...subtractionLng)))
    let tideIndex;
    if (latitude.toString().length > longitude.toString().length) {
        tideIndex = subtractionLat.indexOf(Math.min(...subtractionLat))
    } else {
        tideIndex = subtractionLng.indexOf(Math.min(...subtractionLng))
    }

    console.log(matchingLatLong[tideIndex].id)
    return matchingLatLong[tideIndex].id
}

async function getTides(latitude, longitude) {
    const stationID = await getTideURL(latitude, longitude);
    const testtideURL = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${stationID}&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&application=DataAPI_Sample&format=json`
    const testtideResponse = await fetch(testtideURL);
    const testtideData = await testtideResponse.json();
    const tidesArray = testtideData.predictions
    console.log(tidesArray);
    for (i=0; i < tidesArray.length; i++) {

    }
    const firstTide = {
        time: new Date(testtideData.predictions[0].t).toLocaleTimeString(),
        hour: new Date(testtideData.predictions[0].t).getHours(),
        tide: testtideData.predictions[0].type
    }
    console.log(firstTide)
    return tidesArray
}

async function getAnswerForToday(latitude, longitude) {
    const now = new Date().getDate();
    const tidesArray = await getTides(latitude, longitude);
    const tidesTimesArray = tidesArray.map((object) => new Date(object.t).getHours())

    const url = await getNWSURL(latitude, longitude);
    const response = await fetch (url);
    const data = await response.json();
    const periods = data.properties.periods;
    let endIndex;
    periods.forEach((period) => {
        if (new Date(period.startTime).getHours() === 23 && new Date(period.startTime).getDate() === now) {
            endIndex = period.number
        }
    })
    const groups = Object.groupBy(periods, ({ startTime }) => new Date(startTime).getDate())
    const dailyTempArrays = [];
    const tempMaxMap = new Map();
    Object.entries(groups).forEach((group) => {
        const newArray = group[1].map(a => a.temperature)
        
        dailyTempArrays.push(newArray)

        tempMaxMap.set(group[0], Math.max(...newArray))
        
    })

    const todayPeriods = periods.slice(0, endIndex)
    const titles = ['Time', 'Temperature', 'Forecast', 'Precipitation', 'Wind Speed', 'Tides']
    const headingTitlesRow = document.createElement('tr');
    titles.forEach((item) => {
        const cell = document.createElement('th');
        cell.innerHTML = item;
        headingTitlesRow.appendChild(cell);
    })  
    document.getElementById('today').append(headingTitlesRow)  

    let maxTempTimes = [];
    let sunTimes = [];
    for (i = 0; i < todayPeriods.length; i++) {
        const dayNumber = new Date(periods[i].startTime).getDate();
        const row = document.createElement('tr');
        
        const forecast = {
            dateTime: new Date(periods[i].startTime).toLocaleTimeString(),
            temperature: periods[i].temperature + '&deg' + periods[i].temperatureUnit,
            forecastString: periods[i].shortForecast,
            precipitation: periods[i].probabilityOfPrecipitation.value + '%',
            wind: periods[i].windSpeed,
        }
        Object.values(forecast).forEach((item) => {
            const cell = document.createElement('td')
            cell.innerHTML = item;
            row.append(cell);
            if (item === (tempMaxMap.get(dayNumber.toString()) + '&degF')) {
                cell.style.backgroundColor = '#F77F00';
                maxTempTimes.push({
                    time: forecast.dateTime,
                    temp: forecast.temperature,
                    forecast: forecast.forecastString
                });             
            } else if (item.toLowerCase().includes('sun')) {
                cell.style.backgroundColor = '#FCBF49'
                sunTimes.push({
                    time: forecast.dateTime,
                    temp: forecast.temperature,
                    forecast: forecast.forecastString
                }); 
            }
        })

        if (tidesTimesArray.includes(new Date(periods[i].startTime).getHours()) === true) {
            const tideData = tidesArray[tidesTimesArray.indexOf(new Date(periods[i].startTime).getHours())]
            console.log(tideData)
            let highOrLow;
            if (tideData.type === "H") {
                highOrLow = 'High tide'
            } else {
                highOrLow = 'Low tide'
            }
            const cell = document.createElement('td')
            cell.innerHTML = highOrLow;
            row.append(cell)
        }
        document.getElementById('today').style.visibility = 'visible';
        document.getElementById('today').appendChild(row)

    }
    
    getActualAnswer(maxTempTimes, sunTimes)
    
}

function getActualAnswer(maxTempTimes, sunTimes) {
    let answer;
    console.log(maxTempTimes)
    console.log(sunTimes)
    if (sunTimes.length === 0) {
        answer = `I am so sorry to say unfortunately no :/ today is not a beach day :((`
    } else if (sunTimes.length === 1) {
        answer = `Kind of! it'll be ${sunTimes[0].forecast} for an hour at ${sunTimes[0].time}, and the temperature will be ${sunTimes[0].temp}`
    } else if (sunTimes.length > 1 && maxTempTimes.length > 1) {
        answer = `Yes! it will be sunny from ${sunTimes[0].time} to ${sunTimes[sunTimes.length-1].time}, it will be the hottest, ${maxTempTimes[0].temp}, from ${maxTempTimes[0].time} to ${maxTempTimes[maxTempTimes.length-1].time}`
    } else {
        answer = `Yes! it will be sunny from ${sunTimes[0].time} to ${sunTimes[sunTimes.length-1].time}, it will be the hottest, ${maxTempTimes[0].temp}, at ${maxTempTimes[0].time}`
    }

    document.getElementById('answer').innerHTML = answer;
}