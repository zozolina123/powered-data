const moment = require('moment');
const cors = require('cors');
moment.defaultFormat = "DD.MM";
const express = require('express');
const fs = require('fs/promises');
const app = express();
const port = process.env.PORT || 3001;
app.use(cors())
const admin = require('firebase-admin');
let latestFile = "";

const serviceAccount = require('../gcloud-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "licenta-data.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const { generateMockData, mapPrevNextData } = require('./utils');
const data = generateConsumptionData();
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function processReading(entryName, fileSaveName) {
    const destFileName = 'latest.jpg'
    var file = await bucket.file(latestFile).download({
        destination: destFileName,
    });
    console.log(`downloaded file to ${destFileName}`)

}

async function generateConsumptionData() {
    const monthsArray = moment.months();
    const data = {};
    let startDate = moment(new Date(2021, 1, 1), moment.defaultFormat).subtract(1, 'month');
    let endDate = startDate.clone().endOf('month');
    endDate.add(1, 'days');

    monthsArray.forEach((month) => {
        data[month] = {};
        generateMockData(startDate, data, month);
        startDate.endOf('month').add(1, 'days');
    });
    data['January']['1'][0] = data['December'][31][23];

    return data;

}

let initState = true;
db.collection('readings').onSnapshot(querySnapshot => {
    console.log(`Received query snapshot of size ${querySnapshot.size}`);
    if (initState) {
        initState = false;
    } else {
        querySnapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                console.log('New reading: ', change.doc.data());
                latestFile = change.doc.data().date;
                processReading(latestFile)
            }
        }, err => {
            console.log(`Encountered error: ${err}`);
        });
    }
});

app.get('/', (req, res) => {
    res.send(data);
})

app.get('/overview/month', (req, res) => {
    const monthOverview = {};
    let monthData;
    Object.keys(data).forEach(monthName => {
        monthData = 0;
        Object.keys(data[monthName]).forEach(dayNumber => {
            const dayData = data[monthName][dayNumber].reduce((sum, val) => sum = sum + val);
            monthData = monthData + dayData;
        })
        monthOverview[monthName] = monthData;
    })
    res.send(monthOverview);
})

app.get('/overview/hour', (req, res) => {
    const hourOverview = {};
    let hourCounter = 0;
    Object.keys(data).forEach(monthName => {
        Object.keys(data[monthName]).forEach(dayNumber => {
            data[monthName][dayNumber].forEach((val, index) => {
                if (!!!hourOverview[index]) hourOverview[index] = 0;
                hourOverview[index] = hourOverview[index] + val;
            });
        })
    })
    Object.keys(hourOverview).forEach(hour => hourOverview[hour] = hourOverview[hour] / 365);
    res.send(hourOverview);
})

app.get('/overview/day', (req, res) => {
    const dayOverview = {};
    Object.keys(data).forEach(monthName => {
        Object.keys(data[monthName]).forEach(dayNumber => {
            const weekdayNumber = moment(dayNumber + '-' + monthName + '2021', 'YYYY-MMMM-DD').day();
            const weekdayName = dayNames[weekdayNumber];
            data[monthName][dayNumber].forEach((val, index) => {
                if (!!!dayOverview[weekdayName]) dayOverview[weekdayName] = 0;
                dayOverview[weekdayName] = dayOverview[weekdayName] + val;
            });
        })
    })
    Object.keys(dayOverview).forEach(day => dayOverview[day] = dayOverview[day] / 43);
    res.send(dayOverview);
})

app.get('/month/:monthName', (req, res) => {
    if (data[req.params.monthName]) {
        return res.send(data[req.params.monthName]);
    }
    return res.send({
        error: "Month name invalid"
    })
})

app.get('/week/:monthName/:day', (req, res) => {
    const str = new Date().getFullYear() + '-' + req.params.monthName + '-' + req.params.day;
    const parsedDate = moment(str, 'YYYY-MMMM-DD');
    const weekData = [];

    if (!data[monthNames[parsedDate.month()]] || !data[monthNames[parsedDate.month()]][parsedDate.date()]) {
        return res.send({
            error: "Start date invalid"
        })
    }

    weekData.push(data[monthNames[parsedDate.month()]][parsedDate.date()]);
    for (let i = 0; i < 6; i++) {
        parsedDate.add('1', 'days');
        weekData.push(data[monthNames[parsedDate.month()]][parsedDate.date()]);
    }
    return res.send(weekData);

})
app.get('/:monthName/:day', (req, res) => {
    if (data[req.params.monthName] && data[req.params.monthName][req.params.day]) {
        // mapPrevNextData(data[req.params.monthName][key], req.params.monthName, key)
        return res.send(data[req.params.monthName][req.params.day]);
    }

    return res.send({
        error: "Month name or day number invalid"
    })
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})