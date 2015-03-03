/**
 * Created by nikolay on 03.03.15.
 */
var request = require('request'),
  fs = require('fs'),
  utils = require('./../utils'),
  rest = require('restler');

var stack = [];
var token = '591197cb61cbcb9c588f2a399e29c02b04a647bbaf43d49191c818bf0b84a7ea22143003d18b9655e5167';

exports.addToStack = addToStack;

exports.startCountInterval = function() {
  setInterval(
    function() {
      addCount(62342401);
    }, 480000
  );
};

exports.startMessageInterval = function() {
  setInterval(getFromStackAndSend, 1500);
};


exports.addFriendship = function(userId, callback) {
  var methodUrl = 'https://api.vk.com/method/friends.add?user_id=' + userId + '&text=Здравствуйте, чтобы получать от меня уведомления, добавте меня в друзья!!'
    + '&access_token=' + token;

  request(methodUrl, function(err, respond, body) {
    if(err) return callback(false);
    body = JSON.parse(body);
    if(!body || !body.response) utils.requestError(body, methodUrl);
    callback(true);
  });
};

function addToStack(id, message, img) {
  var element = new CreateElementStack(id, message, img);
  stack.push(element);
}

function CreateElementStack(id, message, img) {
  this.element = {
    id: id,
    message: message,
    img: img || null
  };
  return this.element;
}

function getFromStackAndSend() {
  if (stack.length === 0) return false;
  var stackElement = stack.shift();
  var id = stackElement.id;
  var message = stackElement.message;
  var img = stackElement.img;
  sendMessage(id, message, img);
}

function sendMessage(id, message, img) {
  if(!img){
    var methodUrl = 'https://api.vk.com/method/wall.post?owner_id=-' + id + '&friends_only=0&message=' + message +
      '&access_token=' + token;
    request(methodUrl, function(err, respond, body) {
      if(err) return logger.error(err);
      body = JSON.parse(body);
      if(!body || !body.response || !body.response.post_id) return utils.requestError(body, methodUrl);
      sendNotification(id, message);
      addCount(id);
    });
    return;
  }

  var getWallUploadServer = 'https://api.vk.com/method/photos.getWallUploadServer?group_id=' + id + '&access_token='+token;
  request(getWallUploadServer, function(err, res, body) {
      if(err) return logger.error(err);
      body = JSON.parse(body);
      if (!body.response.upload_url) return utils.requestError(body, getWallUploadServer);

      var path = __home + '/public/uploads/' + img;
      fs.stat(path, function(err, stats) {
        if(err) return logger.error(err);

        rest.post(body.response.upload_url, {
          multipart: true,
          data: {
            "folder_id": "0",
            'photo': rest.file(path, null, stats.size, null, 'image/jpg')
          }
        }).on('complete', function(data) {
          data = JSON.parse(data);
          if (!data || !data.server || !data.photo || !data.hash) return utils.requestError(body, null);

          var getWallUploadServer = 'https://api.vk.com/method/photos.saveWallPhoto?group_id=' + id + '&photo=' +
            data.photo + '&server=' + data.server + '&hash=' + data.hash + '&access_token=' + token;

          request(getWallUploadServer, function(err, res, body) {
            if(err) return logger.error(err);

            body = JSON.parse(body);
            if (!body.response[0].id) return logger.error(body);

            var imgId = body.response[0].id;
            var methodUrl = 'https://api.vk.com/method/wall.post?owner_id=-' + id + '&friends_only=0&message=' + message +
              '&attachment=' + imgId + '&access_token=' + token;

            request(methodUrl, function(err, respond, body) {
              if(err) return logger.error(err);
              body = JSON.parse(body);
              if(!body || !body.response || !body.response.post_id) return utils.requestError(body, methodUrl);
              sendNotification(id, message, imgId);
              addCount(id);
            });
          });
        });
      });
    }
  );
}

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
      if(err) logger.error(err);
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
      if(err) return logger.error(err);
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
      logger.error(err);
      return callback(false);
    }
    body = JSON.parse(body);
    if(!body || !body.response || !Array.isArray(body.response)) {
      utils.requestError(body, methodUrl);
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
    if(err) return logger.error(err);
    body = JSON.parse(body);
    if(!body || body.error) utils.requestError(body, methodUrl);
  });
}