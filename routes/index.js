/**
 * Created by nikolay on 07.02.15.
 */
var request = require('request'),
  fs = require('fs'),
  rest = require('restler');

var token = 'f083a052fa33dfe3ab210ddf8e19297ae2ee0cea703323aa60bcfe79751113dff7e3a49ce4ac002905dd2';
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

exports.getAddedGroups = function(req, res) {
  db.collection('groups').find(
    {}
  ).toArray(function(err, data) {
      if(err) console.log(err);
      data = data.map(function(i) {
        return i._id;
      });
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

            var methodUrl = 'https://api.vk.com/method/wall.post?owner_id=-' + id + '&friends_only=0&message=' + message +
              '&attachment=' + body.response[0].id + '&access_token=' + token;
            request(methodUrl, function(err, respond, body) {
              if(err) return console.error(err);
              body = JSON.parse(body);
              if(!body || !body.response || !body.response.post_id) {
                console.error(new Error('Something wrong'));
                console.log(body);
                return;
              }
              addCount(id);
            });
          });
        });
      });
    }
  );
}

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