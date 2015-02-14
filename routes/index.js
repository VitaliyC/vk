/**
 * Created by nikolay on 07.02.15.
 */
var request = require('request');
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
          res.render('template', data);
        });
      }(saveObj));
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
  var token = '7004cafb92853c6cb94d079314faf27f996d33f26a7fc893fb6f2d0eadf3426ae8de22faf7369c3ac0cc7',
    methodUrl = 'https://api.vk.com/method/wall.post?owner_id='+'-'+req.body.group._id+'&friends_only=0&message='+req.body.message+
      '&access_token='+token;
  request(methodUrl, function(err, respond, body) {
    if(err) {
      console.log(err);
    } else {
      body = JSON.parse(body);
      if('post_id' in body.response) {
        res.send({success: true});
      }
    }
  })
};