/**
 * Created by nikolay on 07.02.15.
 */
var express = require('express'),
  bodyParser = require('body-parser'),
  init = require('./init'),
  fileUpload = false,
  app = express();
global.__home = __dirname;

app.use('/', express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser());
init(app);
app.listen(8080);

var getToken = 'https://oauth.vk.com/authorize?client_id=4771476&redirect_uri=https://oauth.vk.com/blank.html&scope=notify,friends,status,wall,groups,messages,notifications,stats,offline&display=page&response_type=token';