const moment = require('moment');
let value = 0;
let lastValue = 0;
const generateMockData = (startDate, data, month) => {
    endDate = startDate.clone().endOf('month').add(1, 'days');
    while (startDate.format(moment.defaultFormat) != endDate.format(moment.defaultFormat)) {
        const fromArray = [value];
        for (let i = 0; i < 23; i++) {
            value = Math.random();
            fromArray.push(value);
        }
        data[month][startDate.date()] = fromArray;
        startDate = startDate.clone().add(1, 'days');
        prevDate = startDate.clone().add(-1, 'days');
    }
}

const mapPrevNextData = (data, month, key) => {
    console.log(key + '.' + moment().year())
    console.log(month)
    const date = moment(key + '.' + moment().year(), 'DD.MM.YYYY').add(1, 'days').toDate();
    console.log(date)
}

module.exports = { generateMockData, mapPrevNextData }