/**
 * Created by nikolay on 07.02.15.
 */
var cluster = require('cluster');

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('listening', function(worker, address) {
    console.warn('Worker %d is now listening on port %d',
      worker.process.pid, address.port);
  });

  cluster.on('exit', function(worker) {
    console.warn('Worker %d died.', worker.process.pid);
    cluster.fork();
  });
} else {
  require('./constructor')();
}