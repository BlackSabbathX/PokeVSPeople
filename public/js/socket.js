
const Socket = {};

Socket.socket = io.connect();

Socket.id = function () {
	return Socket.socket.id;
}

Socket.on = function (eventName, callback) {
	Socket.socket.on(eventName, callback);
};

Socket.emit = function (eventName, args) {
	Socket.socket.emit(eventName, args);
};

export default Socket;