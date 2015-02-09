/**
 * Created by nikolay on 07.02.15.
 */
var mongo = require('mongodb'),
  middleware = require('./routes/middleware'),
  routes = require('./routes');
module.exports = function(app, callback) {
  dbInit(function(err) {
    if(err) return callback(err);
    middleware(app, function() {
      routing(app, function(err) {
        if(err) return callback(err);
        callback('start');
      })
    })
  })
};

function dbInit(next) {
  mongo.connect('mongodb://localhost:27017/aposting', function (err, conn) {
      if (err) return next(err);
      global.db = conn;
      next();
    }
  );
}

function routing(app, next) {
  app.get('/addGroup', function(req, res) {
    routes.addGroup(req, res, app);
  });
  app.get('/getAddedGroups', routes.getAddedGroups);
  app.get('/getGroupInfo', routes.getGroupInfo);
  app.post('/message', routes.message);
  createRouts(app, next);
}

function createRouts(app, next) {
  db.collection('groups').find({},['url']).toArray(
    function(err, groups) {
      if(err) return next(err);
      for(var i = 0; i < groups.length; i++) {
        app.get('/' + groups[i].url, function(req, res) {
          res.sendfile(__dirname + '/views/index.html');
        });
      }
      next()
    }
  )
}