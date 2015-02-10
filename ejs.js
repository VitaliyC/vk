/**
 * Created by nikolay on 10.02.15.
 */
var ejs = require('ejs'),
  fs = require('fs'),
  users = ['geddy', 'neil', 'alex'];

fs.readFile('./template.ejs', function(err, data) {
  var tmp = data.toString();
  var result = ejs.render(tmp, {huy:{
    name: 'asdasd'
  }});
  console.log(result)
});

//var result = ejs.render({url: '/ejs.js'});

//var s = ejs.render('<%- include('footer'); -%>', {users: users}, {delimiter: '$'});

//console.log(result);