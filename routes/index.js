/**
 * Created by nikolay on 07.02.15.
 */
var utils = require('./../utils'),
  requests = require('./requests'),
  lib = require('./../lib');

exports.addGroup = function(req, res, app) {
  var saveObj = {
    name: req.query.name,
    _id: parseInt(req.query.id),
    url: req.query.url,
    imgUrl: req.query.imgUrl,
    userId: parseInt(req.query.userId)
  };
  lib.addGroup(saveObj, function(err) {
    if(err) logger.log(err);
    (function(data) {
      app.get('/' + data.url, function(req, res) {
        data.count = countMessages;
        res.render('template', data);
      });
    }(saveObj));
    var message = 'Поздравляем, сообщество подключено к системе! Ваша персональная ссылка для отправки историй - http://aposting.me/' + saveObj.url,
      id = saveObj._id;
    requests.addToStack(id, message);
    res.send({success: true});
  });
};

exports.setNotification = function(req, res) {
  var id = parseInt(req.query.id);
  var notification = req.query.notification == 'true';

  lib.setNotification(id, notification, function(err, result) {
    if(err) return logger.error(err);
    if (!notification) return res.send(!!result);
    requests.addFriendship(result.userId, function(result) {
      res.send(result);
    });
  });
};

exports.message = function(req, res) {
  if(req.body.message.length == 0 && !req.body.img) return res.send({success: true});
  requests.addToStack(req.body.group._id, req.body.message, req.body.img);
  res.send({success: true});
};

exports.getAddedGroups = function(req, res) {
  lib.getAddedGroups(utils.callback(req, res));
};

exports.getGroupInfo = function(req, res) {
  lib.getGroupInfo(req.query, utils.callback(req, res));
};