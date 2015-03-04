/**
 * Created by nikolay on 03.03.15.
 */
var express = require('express'),
  bodyParser = require('body-parser'),
  init = require('./init'),
  app = express();

var getToken = 'https://oauth.vk.com/authorize?client_id=4771476&redirect_uri=https://oauth.vk.com/blank.html&scope=notify,friends,status,wall,groups,messages,notifications,stats,offline&display=page&response_type=token';

global.__home = __dirname;

module.exports = function() {
  app.listen(8080);
  app.use('/', express.static(__dirname + '/public'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(bodyParser());

  app.get('/aaa', function(req, res) {
    console.log(req.hostname);
    console.log(req.ip);
    res.end('forbidden')
  })

  init(app);
};