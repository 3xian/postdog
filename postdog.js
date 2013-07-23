var net = require('net');
var conf = require('nconf')
var log4js = require('log4js');

var logger = log4js.getLogger();

conf.use('file', { file: './postdog-conf.json' });
conf.load()

var format = {
	sockMsg: function(sock, msg) {
		return sock.remoteAddress + ':' + sock.remotePort + ' [' + msg.length + ' bytes]';
	}
}

var server = net.createServer(function(clientSock) {
	clientSock.on('data', function(msg) {
		logger.info('recv ' + format.sockMsg(clientSock, msg));

		var serverSock = new net.Socket();
		serverSock.setTimeout(conf.get('timeout'));

		serverSock.connect(conf.get('remote:port'), conf.get('remote:port'), function () {
			logger.debug('send ' + format.sockMsg(serverSock, msg));
			serverSock.write(msg);
		});

		serverSock.on("data", function(data) {
			logger.debug('recv ' + format.sockMsg(serverSock, data));
			clientSock.write(data);
			logger.info('send ' + format.sockMsg(clientSock, data));
		});

		serverSock.on("timeout", function() {
			logger.warn('recv timeout!');
			serverSock.destroy();
			clientSock.destroy();
		});

		serverSock.on("error", function(data) {
			logger.error(data);
			clientSock.destroy();
		});
	});
});

logger.info('******** PostDog Start! ******** (port: ' + conf.get('local:port') + ')');
server.listen(conf.get('local:port'));
