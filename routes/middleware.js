/**
 * Created by nikolay on 08.02.15.
 */
var zSchema = require('z-schema');

var validator = new zSchema({
  assumeAdditional: true
});

module.exports = function(app, callback) {
  app.use('/addGroup', function(req, res, next) {
    validate(req.query, schemas.addGroup, next);
  });
  app.use('/getAddedGroups', function(req, res, next) {
    validate(req.query, schemas.getAddedGroups, next);
  });
  app.use('/getGroupInfo', function(req, res, next) {
    validate(req.query, schemas.getGroupInfo, next);
  });
  app.use('/message', function(req, res, next) {
    validate(req.body, schemas.message, next);
  });
  callback();
};

function validate(object, schema, next) {
  var valid = validator.validate(object, schema);
  var err = validator.getLastErrors();
  if(valid) return next();
  console.error(err);
}

var schemas = {
  'addGroup': {
    type: 'object',
    required:['name','id','url','imgUrl','userId'],
    properties: {
      name: {type: 'string', minLength: 1, maxLength: 120},
      id: {type: 'string', minLength: 1, maxLength: 10},
      url: {type: 'string', minLength: 1, maxLength: 120},
      imgUrl: {type: 'string', minLength: 1, maxLength: 120},
      userId: {type: 'string', minLength: 1, maxLength: 11}
    }
  },
  'getAddedGroups': {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {type: 'string', minLength: 1, maxLength: 11}
    }
  },
  'getGroupInfo': {
    type: 'object',
    required: ['url'],
    properties: {
      url: {type: 'string', minLength: 1, maxLength: 120}
    }
  },
  'message': {
    type: 'object',
    required: ['group', 'message'],
    properties: {
      group: {
        type: 'object',
        required:['name','_id','url','imgUrl','userId'],
        properties: {
          name: {type: 'string', minLength: 1, maxLength: 120},
          _id: {type: 'string', minLength: 1, maxLength: 10},
          url: {type: 'string', minLength: 1, maxLength: 120},
          imgUrl: {type: 'string', minLength: 1, maxLength: 120},
          userId: {type: 'string', minLength: 1, maxLength: 11}
        }
      },
      message: {type: 'string', minLength: 1, maxLength:500}
    }
  }
};