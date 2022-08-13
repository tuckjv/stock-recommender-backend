import axios from 'axios';
import herokuSSLRedirect from 'heroku-ssl-redirect'
const sslRedirect = herokuSSLRedirect.default

import express from "express"
const app = express();

app.use(sslRedirect());

app.use(express.json());

app.post('/', async (req, res) => {
  let tickers = [req.body.first, req.body.second, req.body.third, req.body.fourth, req.body.fifth];
  let reccomend = [];
  let notRec = [];
  let neutral = []; 
  for (var i = 0; i < 5; ++i) {
    let curr = await callApi(tickers[i]);
    if (curr[0] - curr[1] > 0) {
      reccomend.push(tickers[i])
    }
    else if (curr[0] - curr[1] < 0) {
      notRec.push(tickers[i])
    }
    else {
      neutral.push(tickers[i])
    }
  }
  res.json({reccomend: reccomend, notRec: notRec, neutral: neutral});
})

async function callApi(ticker) {
  console.log(ticker);
  let today = new Date();
  let month1 = String(today.getMonth() + 1).padStart(2, '0');
  let day1 = String(today.getDate()).padStart(2, '0');
  let year1 = today.getFullYear();
  console.log(month1);
  let sum = 0;
  const resp = await axios.get(`http://api.marketstack.com/v1/eod?access_key=9ab57e74c200c57c32baa2f8fab0e558&symbols=${ticker}&date_from=2000-01-01&date_to=${year1}-${month1}-${day1}&limit=200`);
  if (resp === 'hello') {
    return
  }
  for (let i = 0; i < 50; ++i) {
    console.log(resp.data['data'][i]['date'])
    sum += resp.data['data'][i]['close'];
  }
  let day50avg = sum / 50;
  console.log(day50avg);
  for (let i = 50; i < 200; ++i) {
    sum += resp.data['data'][i]['close'];
  }
  let day200avg = sum / 200;
  console.log(day200avg);
  return [day50avg, day200avg]
}