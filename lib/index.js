/**
 * Created by nikolay on 03.03.15.
 */
exports.addGroup = function(saveObj, callback) {
  db.collection('groups').findOne(
    {
      url: saveObj.url
    },
    function(err, check) {
      if (err) return callback(err);
      if (check) return callback(new Error('Url already exists'));
      db.collection('groups').save(saveObj, callback);
    }
  )
};

exports.setNotification = function(id, notification, callback) {
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
    callback
  );
};

exports.getAddedGroups = function(callback) {
  db.collection('groups').find(
    {},
    ['notification']
  ).toArray(callback);
};

exports.getGroupInfo = function(saveObj, callback) {
  db.collection('groups').findOne(req.query, callback);
};

