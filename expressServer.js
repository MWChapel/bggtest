'use strict';

var express = require('express');
var app = express();
var request = require('request');

var BGG_BASE_URL = 'https://www.boardgamegeek.com';

app.use(express.static('app'));

app.get(['/xmlapi2/*', '/xmlapi/*', '/geekmarket/*'], function(req, res) {
  req.pipe(request('https://www.boardgamegeek.com' + req.url)).on('error', error => {
      res.status(500).send(error.message);
  }).pipe(res);
});

app.listen(8000, function (err) {
  console.log('\x1b[33mStarting up http-server, serving \x1b[36m./app');
  console.log('\x1b[33mAvailable on:');
  console.log('  \x1b[32mhttp://localhost:8000\x1b[0m');
});
