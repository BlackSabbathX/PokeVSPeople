
const Socket = {};
const actualEvents = [];

Socket.socket = io.connect();

Socket.id = function () {
	return Socket.socket.id;
}

Socket.on = function (eventName, callback) {
	actualEvents.push(eventName);
	Socket.socket.on(eventName, callback);
};

Socket.emit = function (eventName, args) {
	Socket.socket.emit(eventName, args);
};

Socket.removeAllListeners = function () {
	for (let index = 0; index < actualEvents.length; index++)
		Socket.socket.removeAllListeners(actualEvents[index]);
}

export default Socket;