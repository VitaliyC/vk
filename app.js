/**
 * Created by nikolay on 07.02.15.
 */
var express = require('express'),
  bodyParser = require('body-parser'),
  init = require('./init'),
  app = express();
global.__home = __dirname;

app.use('/', express.static(__dirname + '/public'));
app.use(bodyParser());
init(app, console.log);
app.listen(8080);

