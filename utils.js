/**
 * Created by nikolay on 03.03.15.
 */
exports.callback = function(req, res) {
  return function(err, data) {
    if (err) {
      if (typeof(err) == 'string') err = new Error(err);
      err.path = req.path;
      err.data = req.query;
      logger.error(err);
    } else {
      res.send(data);
    }
  }
};

exports.requestError = function (body, methodUrl) {
  var error = new Error('Request error');
  error.methodUrl = methodUrl;
  error.bodyError = body.error || body;
  logger.error(error);
};