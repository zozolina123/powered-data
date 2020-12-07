const moment = require('moment');
moment.defaultFormat = "DD.MM";
const express = require('express');
const app = express();
const port = 3001;

const data = generateConsumptionData();

function generateConsumptionData() {
    const monthsArray = moment.months();
    const data = {};
    let startDate = moment(new Date(2020, 1, 1), moment.defaultFormat).subtract(1, 'month');
    let endDate = startDate.clone().endOf('month');
    endDate.add(1, 'days');

    monthsArray.forEach(month => {
        data[month] = {};
        while (startDate.format(moment.defaultFormat) != endDate.format(moment.defaultFormat)) {
            const fromArray = [];
            for (let i = 0; i < 23; i++) {
                fromArray.push(Math.random());
            }
            data[month][startDate.format(moment.defaultFormat)] = fromArray;
            startDate = startDate.clone().add(1, 'days')
        }
        endDate = startDate.clone().endOf('month');
        endDate.add(1, 'days');
    })

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
app.get('/:monthName/:day', (req, res) => {
    const month = moment().month(req.params.monthName).format("M");
    const key = `${req.params.day < 10 ? "0" : ''}${req.params.day}.${month < 10 ? "0" : ''}${month}`;

    if (data[req.params.monthName] && data[req.params.monthName][key]) {
        return res.send(data[req.params.monthName][key]);
    }
    return res.send({
        error: "Month name or dayy number invalid"
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})