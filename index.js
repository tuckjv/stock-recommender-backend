import axios from 'axios';
import herokuSSLRedirect from 'heroku-ssl-redirect'
const sslRedirect = herokuSSLRedirect.default
import timeout from 'connect-timeout'

import express from "express"
const app = express();

app.listen(process.env.PORT || 5000);

app.use(timeout('15s')); 

app.use(sslRedirect());

app.use(express.json());

app.use(haltOnTimedout);

app.post('/', async (req, res) => {
  let tickers = [req.body.first, req.body.second, req.body.third, req.body.fourth, req.body.fifth];
  let reccomend = [];
  let notRec = [];
  let neutral = []; 
  for (var i = 0; i < 5; ++i) {
    let curr = await callApi(tickers[i]);
    if (curr === 'fail') {
      res.json({reccomend: 'fail', notRec: 'fail', neutral: 'fail'});
      return;
    } //If the request is a fail, set all responses to 'fail'
    if (curr[0] - curr[1] > 0) {
      reccomend.push(tickers[i])
    } //If the stock recommendation is positive, add it to the recommended array
    else if (curr[0] - curr[1] < 0) {
      notRec.push(tickers[i])
    } //If the stock recommendation is negative, add it to the not recommended array
    else {
      neutral.push(tickers[i])
    } //If the stock is recommendation is neutral, add it to the neutral array
  } //Use a for loop to access the marketstack api data for each stock, add the stock to the array for the category it falls into
  res.json({reccomend: reccomend, notRec: notRec, neutral: neutral}); 
}) //Handles post requests to the server

async function callApi(ticker) {
  console.log(ticker);
  let today = new Date();
  let month1 = String(today.getMonth() + 1).padStart(2, '0');
  let day1 = String(today.getDate()).padStart(2, '0');
  let year1 = today.getFullYear();
  let sum = 0;
  const resp = await axios.get(`http://api.marketstack.com/v1/eod?access_key=9ab57e74c200c57c32baa2f8fab0e558&symbols=${ticker}&date_from=2000-01-01&date_to=${year1}-${month1}-${day1}&limit=200`).catch(() => {return 'fail';});
  if (resp === 'fail') {
    return 'fail';
  } //If the request fails, return 'fail' so the program knows to not calculate any more values
  for (let i = 0; i < 50; ++i) {
    console.log(resp.data['data'][i]['date'])
    sum += resp.data['data'][i]['close'];
  } //sum up the most recent 50 days worth of prices
  let day50avg = sum / 50;
  for (let i = 50; i < 200; ++i) {
    sum += resp.data['data'][i]['close'];
  } //continue the sum for the last 200 days
  let day200avg = sum / 200;
  return [day50avg, day200avg]
} // handle calling the marketstack api and calculate the 50 and 200 day moving averages

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next()
} //Handles server timeout