const moment = require('moment');
const cors = require('cors');
moment.defaultFormat = "DD.MM";
const express = require('express');
const app = express();
const port = 3001;
app.use(cors())

const { generateMockData, mapPrevNextData } = require('./utils');
const data = generateConsumptionData();
var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function generateConsumptionData() {
    const monthsArray = moment.months();
    const data = {};
    let startDate = moment(new Date(2020, 1, 1), moment.defaultFormat).subtract(1, 'month');
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

app.get('/', (req, res) => {
    res.send(data);
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
    // const startDate = new Date(req.params.weekStartDate)
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
        console.log(parsedDate.month())
        console.log(parsedDate.date())
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