/**
 * Created by nikolay on 07.02.15.
 */
var mongo = require('mongodb'),
  middleware = require('./routes/middleware'),
  fs = require('fs'),
  multer = require('multer'),
  routes = require('./routes');

var fileFilter = ['image/jpeg', 'image/png'];

var multerConf = {
  dest: './public/uploads/',
  limits: {
    fieldNameSize: 100,
    fileSize: 3000000,
    files: 1,
    fields: 5
  },
  onFileSizeLimit: function(file) {
    fs.unlink('./' + file.path);
    return false;
  },
  rename: function (fieldname, filename) {
    return filename + Date.now();
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function (file) {
    if(fileFilter.indexOf(file.mimetype) == -1) {
      fs.unlink('./' + file.path);
      return false;
    }
    console.log(file.fieldname + ' uploaded to  ' + file.path);
    file.success = true;
  }
};

module.exports = function (app, callback) {
  dbInit(function (err) {
    if (err) return callback(err);
    middleware(app, function () {
      routing(app, function (err) {
        if (err) return callback(err);
        routes.startInterval();
        callback('start');
      })
    })
  })
};

function dbInit(next) {
  mongo.connect('mongodb://localhost:27017/aposting', function (err, conn) {
      if (err) return next(err);
      global.db = conn;
      db.collection('groups').aggregate(
        [
          {
            $group: {
              _id:{},
              count: {
                $sum: '$count'
              }
            }
          }
        ],function(err, data) {
          if(err) return next(err);
          global.countMessages = data[0].count;
          next()
        }
      );
    }
  );
}

function routing(app, next) {
  app.post('/loadPhoto', multer(multerConf), function (req, res) {
    if (req.files.userPhoto.success) {
      res.send({
        filePath: 'http://aposting.me/uploads/' + req.files.userPhoto.name,
        name: req.files.userPhoto.name
      });
    }
  });
  app.get('/addGroup', function (req, res) {
    routes.addGroup(req, res, app);
  });
  app.get('/getAddedGroups', routes.getAddedGroups);
  app.get('/getGroupInfo', routes.getGroupInfo);
  app.post('/message', routes.message);
  app.get('/setNotification', routes.setNotification);
  createRouts(app, next);
}

function createRouts(app, next) {
  db.collection('groups').find({}).toArray(
    function (err, groups) {
      if (err) return next(err);
      for (var i = 0; i < groups.length; ++i) {
        (function (data) {
          app.get('/' + data.url, function (req, res) {
            data.count = countMessages;
            res.render('template', data);
          });
        }(groups[i]))
      }
      next()
    }
  )
}