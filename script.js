document.getElementById("go").addEventListener("click", goButton);
document.getElementById("testGeo").addEventListener("click", getMyLocation);
document.getElementById("manualLocation").addEventListener("click", manualLocation);

document.getElementById('state').addEventListener('change', locationInputChange);
document.getElementById('city').addEventListener('input', locationInputChange);

document.getElementById('kiteBtn').addEventListener('click', revealKiteAnswer)
document.getElementById('tanningBtn').addEventListener('click', revealTanningAnswer)

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
        document.getElementById('inputFields').style.display = 'flex'
    }
}

function manualLocation() {
    document.getElementById('inputFields').style.display = 'flex'; 
}

async function getCoordinatesManually() {
    const geoUrl = new URL ("https://geocoding-api.open-meteo.com/v1/search?name=&count=50&language=en&format=json&countryCode=US");
    const params = new URLSearchParams(geoUrl.search);
    const cityName = document.getElementById("city").value;
    params.set("name", cityName);
    geoUrl.search = params.toString();
    const cityURL = geoUrl.toString();    
    const stateName = document.getElementById("state").value;
    const citiesResponse = await fetch(cityURL);
    const citiesData = await citiesResponse.json();
    if(!citiesData.results) {
        // console.log('results undefined')
        alert('ummm check the spelling on your city please')
        document.getElementById("city").innerHTML = '';
        document.getElementById("city").style.borderColor = '#D62828'
        return;
    } else {
        document.getElementById("city").style.borderColor = 'dimgray'
    }
    const findCityState = citiesData.results.filter((item) => item.admin1 === stateName);
    if(findCityState.length === 0) {
        // console.log('array empty')
        alert('ummm check the spelling on your state please')
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
    // console.log('latitude: ' + latitude);
    // console.log('longitude: ' + longitude);
    if (document.getElementById('today').rows.length > 0) {
        // console.log('clearing table')
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
    // console.log('latitude:' + latitude)
    // console.log('longitude' + longitude)
    if (document.getElementById('today').rows.length > 0) {
        // document.getElementById('kite').style.display = 'none'
        // document.getElementById('kiteAnswer').style.display = 'none'
        document.getElementById('answer').innerHTML = "";
        const length = document.getElementById('today').rows.length
        for (i = 0; i < length; i++) {
            document.getElementById('today').deleteRow(0);
        }
    }    
    await getAnswerForToday(latitude, longitude);
}

async function getNWSURL(latitude, longitude) {
    // console.log(`https://api.weather.gov/points/${latitude},${longitude}`)
    const grid = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`);
    const gridData = await grid.json();
    // console.log(gridData.properties.forecastHourly)
    return gridData.properties.forecastHourly
}

async function getTides(latitude, longitude) {
    const stationsURL = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=english';
    const stationResponse = await fetch(stationsURL);
    const stationData = await stationResponse.json();
    const matchingLatLong = stationData.stations.filter((object) => object.lat.toFixed(2).toString().slice(0, length-1) === latitude.toFixed(2).toString().slice(0, length-1) && object.lng.toFixed(2).toString().slice(0, length-1) === longitude.toFixed(2).toString().slice(0, length-1));
    const closestLatLong = stationData.stations.filter((object) => (object.lat.toFixed(0) === latitude.toFixed(0) || object.lat.toFixed(0) + 1 === latitude.toFixed(0) || object.lat.toFixed(0) -1 === latitude.toFixed(0)) && (object.lng.toFixed(0) === longitude.toFixed(0) || object.lng.toFixed(0) +1 === longitude.toFixed(0) || object.lng.toFixed(0) -1 === longitude.toFixed(0)));
    const differenceInLat = closestLatLong.map((item) => item.lat - latitude);
    const differenceInLng = closestLatLong.map((item) => item.lng - longitude);
    let stationID;
    if (matchingLatLong.length === 0 && closestLatLong.length === 0) {
        return null
    } else {
        if (matchingLatLong.length === 0 && closestLatLong.length > 0 ) {
            const closestIndex = (Math.abs(Math.min(...differenceInLat)) > Math.abs(Math.min(...differenceInLng))) ? differenceInLng.indexOf(Math.min(...differenceInLng)):differenceInLat.indexOf(Math.min(...differenceInLat));
            stationID = closestLatLong[closestIndex].id
        } else {
            const subtractionLat = matchingLatLong.map((object) => object.lat - latitude);
            const subtractionLng = matchingLatLong.map((object) => object.lng - longitude);
        let tideIndex;
            if (latitude.toString().length > longitude.toString().length) {
                tideIndex = subtractionLat.indexOf(Math.min(...subtractionLat))
            } else {
                tideIndex = subtractionLng.indexOf(Math.min(...subtractionLng))
            }
            stationID = matchingLatLong[tideIndex].id
        }
        const testtideURL = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${stationID}&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&application=DataAPI_Sample&format=json`
        const testtideResponse = await fetch(testtideURL);
        const testtideData = await testtideResponse.json();
        const tidesArray = testtideData.predictions
        return tidesArray
    }

}

async function addTides(latitude, longitude, periods, row, i) {
    const tidesArray = await getTides(latitude, longitude);
    if (tidesArray === null) {
        return
    }
    const tidesTimesArray = tidesArray.map((object) => new Date(object.t).getHours())    
    if (tidesTimesArray.includes(new Date(periods[i].startTime).getHours()) === true) {        
        const tideData = tidesArray[tidesTimesArray.indexOf(new Date(periods[i].startTime).getHours())]
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
}

async function getUV(latitude, longitude, periods) {
    const url = `https://currentuvindex.com/api/v1/uvi?latitude=${latitude}&longitude=${longitude}`;
    const response = await fetch(url);
    const data = await response.json();
    const relevantHistory = data.history.filter((object) => (new Date(object.time.split('Z')[0]).getHours() >= new Date(periods[0].startTime).getHours()) && (new Date(object.time.split('Z')[0]).getDate() === new Date(periods[0].startTime).getDate()) )
    // console.log(url)
    // console.log(relevantHistory)
    // console.log(data.now)
    const relaventForecast = data.forecast.slice(0,12)
    const UVArray = [...relevantHistory, data.now, ...relaventForecast]
    // console.log(UVArray)
    return UVArray
}

async function getAnswerForToday(latitude, longitude) {

    const now = new Date().getDate();
    const url = await getNWSURL(latitude, longitude);
    const response = await fetch (url);
    // console.log(url)
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

    const UVArray = await getUV(latitude, longitude, periods);

    const todayPeriods = periods.slice(0, endIndex)
    const titles = ['Time', 'Temperature', 'Forecast', 'Precipitation', 'UV', 'Wind Speed', 'Tides']
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
            UV: UVArray[i].uvi,
            wind: periods[i].windSpeed,
        }
        Object.values(forecast).forEach((item) => {
            const cell = document.createElement('td')
            cell.innerHTML = item;
            row.append(cell);
            if (typeof item === "string") {
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
            }

        })
        addTides(latitude, longitude, periods, row, i)

        document.getElementById('today').style.visibility = 'visible';
        document.getElementById('today').appendChild(row)
    }

    const isYes = getActualAnswer(maxTempTimes, sunTimes);

    if (isYes) {
        document.getElementById('kite').style.display = 'block';
        document.getElementById('tanning').style.display = 'block';
        document.getElementById('swimming').style.display = 'block';        
    }
    

    function getTanningAnswer() {
        const safeTanningArray = UVArray.filter((object) => (object.uvi > 3 && object.uvi < 6) && (sunTimes.map((object) => object.time).includes(new Date(object.time.split('Z')[0]).toLocaleTimeString())) )
        // console.log(safeTanningArray)

        const peakTanningArray = UVArray.filter((object) => (object.uvi > 6) && (sunTimes.map((object) => object.time).includes(new Date(object.time.split('Z')[0]).toLocaleTimeString())) )
        // console.log(peakTanningArray)

        const safeTanningTimes = safeTanningArray.map((object) => new Date(object.time.split('Z')[0]).toLocaleTimeString())
        const peakTanningTimes = peakTanningArray.map((object) => new Date(object.time.split('Z')[0]).toLocaleTimeString())    
        
        let tanningAnswer
        if (safeTanningTimes.length === 0) {
            tanningAnswer = `There is no safe time to tan today. The most effective, yet dangerous, time to tan will be from ${peakTanningTimes[0]} to ${peakTanningTimes[peakTanningTimes.length-1]}. Please use sunscreen.`
        } else {
            tanningAnswer = `The safest time to tan will be from ${safeTanningTimes[0]} to ${safeTanningTimes[safeTanningTimes.length-1]}. The most effective, yet dangerous, time to tan will be from ${peakTanningTimes[0]} to ${peakTanningTimes[peakTanningTimes.length-1]}. Please use sunscreen.`
        }

        document.getElementById('tanningAnswer').innerHTML = tanningAnswer
    }

    getTanningAnswer();

    function getKiteFlyingAnswer() {
        let kiteFlyingAnswer;
        const kiteTimesArray = todayPeriods.filter((object) => Number(object.windSpeed.split(' mph')[0]) >= 8)
        const kiteTimes = kiteTimesArray.map((item) => new Date(item.startTime).toLocaleTimeString())
        if (kiteTimes.length > 0) {
            kiteFlyingAnswer = `It's a good day for kites! The wind will be best from ${kiteTimes[0]} to ${kiteTimes[kiteTimes.length-1]}`
            
        } else {
            kiteFlyingAnswer = "Not a good day for kites"
        }
        document.getElementById('kiteAnswer').innerHTML = kiteFlyingAnswer
        // console.log(kiteTimes)
        
    }
    getKiteFlyingAnswer();
    
}

function getActualAnswer(maxTempTimes, sunTimes) {
    let answer;
    let isYes;

    // console.log(maxTempTimes)
    // console.log(sunTimes)
    if (sunTimes.length === 0) {
        answer = `I am so sorry to say unfortunately no :/ today is not a beach day :((`
        isYes = false
    } else if (sunTimes.length === 1) {
        answer = `Kind of! it'll be ${sunTimes[0].forecast} for an hour at ${sunTimes[0].time}, and the temperature will be ${sunTimes[0].temp}`;
        isYes = true
    } else if (sunTimes.length > 1 && maxTempTimes.length > 1) {
        answer = `Yes! it will be sunny from ${sunTimes[0].time} to ${sunTimes[sunTimes.length-1].time}, it will be the hottest, ${maxTempTimes[0].temp}, from ${maxTempTimes[0].time} to ${maxTempTimes[maxTempTimes.length-1].time}`
        isYes = true
    } else {
        answer = `Yes! it will be sunny from ${sunTimes[0].time} to ${sunTimes[sunTimes.length-1].time}, it will be the hottest, ${maxTempTimes[0].temp}, at ${maxTempTimes[0].time}`
        isYes = true
    }

    document.getElementById('answer').innerHTML = answer;

    return isYes

}

function revealKiteAnswer() {
    if (document.getElementById('kiteAnswer').style.visibility === 'visible') {
        console.log('true')
        document.getElementById('kiteAnswer').style.visibility = 'hidden';
    } else {
        console.log('false')
        document.getElementById('kiteAnswer').style.visibility = 'visible';        
    }

    
}

function revealTanningAnswer() {
    if (document.getElementById('tanningAnswer').style.visibility === 'visible') {

        document.getElementById('tanningAnswer').style.visibility = 'hidden';
    } else {
        document.getElementById('tanningAnswer').style.visibility = 'visible';    
    }
    
}
