var http = require('http');
var net = require('net');
var url = require('url');
var conf = require('nconf')
var log4js = require('log4js');

var logger = log4js.getLogger();

conf.use('file', { file : './postdog-conf.json' });
conf.load()

var format = {
	sockMsg : function(sock, msg) {
		return sock.remoteAddress + ':' + sock.remotePort + ' [' + msg.length + ' bytes]';
	}
};

var tcpServer = net.createServer(function(clientSock) {
	clientSock.on('data', function(msg) {
		logger.info('recv ' + format.sockMsg(clientSock, msg));

		var serverSock = new net.Socket();
		serverSock.setTimeout(conf.get('timeout'));

		serverSock.connect(conf.get('remote:port'), conf.get('remote:host'), function () {
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

httpServer = http.createServer(function(request, response) {
	var ip = request.connection.remoteAddress;
	var key = url.parse(request.url, true).query['key'];
	logger.info('conf request from ' + ip + ', key: ' + key);
	if (key == 'LingoSail') {
		conf.set('remote:host', ip);
		conf.save();
		logger.info('conf updated');
		response.end('ok');
	} else {
		response.end();
	}
});

logger.info('********** PostDog Start! ********** (tcp:'+conf.get('tcp-port') + ', http:'+conf.get('http-port') + ')');
tcpServer.listen(conf.get('tcp-port'));
httpServer.listen(conf.get('http-port'));
