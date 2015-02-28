/**
 * Created by nikolay on 07.02.15.
 */
var request = require('request'),
  fs = require('fs'),
  rest = require('restler');

var token = '2f3b9efb3ac528935e925b63c340efe9645ddb1ad6c2c9cb9f84c5592694632fd97a51c8dc804d7cc1f41';
exports.addGroup = function(req, res, app) {
  var saveObj = {
    name: req.query.name,
    _id: parseInt(req.query.id),
    url: req.query.url,
    imgUrl: req.query.imgUrl,
    userId: parseInt(req.query.userId)
  };
  db.collection('groups').save(
    saveObj,
    function(err) {
      if(err) console.log(err);
      (function(data) {
        app.get('/' + data.url, function(req, res) {
          data.count = countMessages;
          res.render('template', data);
        });
      }(saveObj));
      var message = 'Поздравляем, сообщество подключено к системе! Ваша персональная ссылка для отправки историй - http://aposting.me/' + saveObj.url,
        id = saveObj._id;
      sendMessage(id, message);
      res.send({success: true});
    }
  )
};

exports.setNotification = function(req, res) {
  var id = parseInt(req.query.id);
  var notification = req.query.notification == 'true';

  db.collection('groups').findAndModify(
    {
      _id: id
    },
    [],
    {
      $set: {
        notification: notification
      }
    },
    {
      new: true
    },
    function(err, result) {
      if(err) return console.error(err);
      if (!notification) return res.send(!!result);

      var methodUrl = 'https://api.vk.com/method/friends.add?user_id=' + result.userId + '&text=Здравствуйте, чтобы получать от меня уведомления, добавте меня в друзья!!'
      + '&access_token=' + token;

      request(methodUrl, function(err, respond, body) {
        if(err) {
          console.error(err);
          return callback(false);
        }
        body = JSON.parse(body);
        if(!body || !body.response) {
          console.error(new Error('Something wrong'));
          console.error(body);
          return callback(false);
        }
        res.send(!!result);
      });
    }
  );
};

exports.getAddedGroups = function(req, res) {
  db.collection('groups').find(
    {},
    ['notification']
  ).toArray(function(err, data) {
      if(err) console.log(err);
      res.send(data);
    })
};

exports.getGroupInfo = function(req, res) {
  db.collection('groups').findOne(req.query, function(err, group) {
    if(err) console.log(err);
    res.send(group);
  })
};

exports.message = function(req, res) {
  if(req.body.message.length == 0 && !req.body.img) return res.send({success: true});
  sendMessage(req.body.group._id, req.body.message, req.body.img);
  res.send({success: true});
};

function sendMessage(id, message, img) {
  if(!img){
    var methodUrl = 'https://api.vk.com/method/wall.post?owner_id=-' + id + '&friends_only=0&message=' + message +
      '&access_token=' + token;
    request(methodUrl, function(err, respond, body) {
      if(err) return console.error(err);
      body = JSON.parse(body);
      if(!body || !body.response || !body.response.post_id) {
        console.error(new Error('Something wrong'));
        console.error(body);
        return;
      }
      sendNotification(id, message);
      addCount(id);
    });
    return;
  }

  var getWallUploadServer = 'https://api.vk.com/method/photos.getWallUploadServer?group_id=' + id + '&access_token='+token;
  request(getWallUploadServer, function(err, res, body) {
      if(err) return console.error(err);
      body = JSON.parse(body);
      if (!body.response.upload_url) return console.error(new Error('No upload_url'));

      var path = __home + '/public/uploads/' + img;
      fs.stat(path, function(err, stats) {
        if(err) return console.error(err);

        rest.post(body.response.upload_url, {
          multipart: true,
          data: {
            "folder_id": "0",
            'photo': rest.file(path, null, stats.size, null, 'image/jpg')
          }
        }).on('complete', function(data) {
          data = JSON.parse(data);
          if (!data || !data.server || !data.photo || !data.hash) {
            console.error(new Error('Something wrong'));
            console.log(data);
            return;
          }

          var getWallUploadServer = 'https://api.vk.com/method/photos.saveWallPhoto?group_id=' + id + '&photo=' +
            data.photo + '&server=' + data.server + '&hash=' + data.hash + '&access_token=' + token;

          request(getWallUploadServer, function(err, res, body) {
            if(err) return console.error(err);

            body = JSON.parse(body);
            if (!body.response[0].id) return console.error(new Error('Something wrong!!!'));

            var imgId = body.response[0].id;
            var methodUrl = 'https://api.vk.com/method/wall.post?owner_id=-' + id + '&friends_only=0&message=' + message +
              '&attachment=' + imgId + '&access_token=' + token;
            request(methodUrl, function(err, respond, body) {
              if(err) return console.error(err);
              body = JSON.parse(body);
              if(!body || !body.response || !body.response.post_id) {
                console.error(new Error('Something wrong'));
                console.log(body);
                return;
              }
              sendNotification(id, message, imgId);
              addCount(id);
            });
          });
        });
      });
    }
  );
}


exports.startInterval = function() {
  setInterval(function() {
    addCount(62342401);
  }, 480000)
};

/**
 * Метод, который инкримининиурет единицу к счетчику сообщений в сообщество
 * @param {Number || String} id
 */
function addCount(id) {
  db.collection('groups').update(
    {
      _id: parseInt(id)
    },
    {
      $inc: {
        count: 1
      }
    },function(err) {
      if(err) console.error(err);
      ++countMessages;
    }
  )
}


/**
 *  Метод, который уведомляет адмиа сообщество о поступившем сообщении.
 * @param id
 * @param message
 * @param imgId
 */
function sendNotification(id, message, imgId) {
  db.collection('groups').findOne(
    {
      _id: parseInt(id),
      notification: true
    },
    ['name', 'userId'],
    function(err, group) {
      if(err) return console.error(err);
      if (!group) return false;
      var groupName = group.name;
      var userId = group.userId;

      checkForFriend(userId, function(isFriend) {
        if(!isFriend) return false;
        notify(userId, groupName, message, imgId);
      })
    }
  );
}

/**
 * метод проверяет, является ли человек другом бота.
 * @param id
 * @param callback
 */
function checkForFriend (id, callback) {
  var methodUrl = 'https://api.vk.com/method/friends.areFriends?user_ids=' + id + '&access_token=' + token;

  request(methodUrl, function(err, respond, body) {
    if(err) {
      console.error(err);
      return callback(false);
    }
    body = JSON.parse(body);
    if(!body || !body.response || !Array.isArray(body.response)) {
      console.error(new Error('Something wrong'));
      console.error(body);
      return callback(false);
    }
    callback(body.response[0].friend_status === 3);
  });
}

/**
 * Уведомляет пользователя о сообщении.
 * @param id
 * @param groupName
 * @param message
 * @param imgId
 */
function notify(id, groupName, message, imgId) {
  var notification = 'В ваше сообщество ' + '"' + groupName + '"' + ' поступила новость: ' + message;
  if(imgId) notification += '&attachment=' + imgId;
  var methodUrl = 'https://api.vk.com/method/messages.send?user_id=' + id + '&message=' + notification + '&&access_token=' + token;

  request(methodUrl, function(err, respond, body) {
    if(err) return console.error(err);
    body = JSON.parse(body);
    if(!body || !body.response) {
      console.error(new Error('Something wrong'));
      console.error(body);
    }
  });
}