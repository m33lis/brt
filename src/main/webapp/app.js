(function() {
	'use strict';

	var Brt = {
		init: init,
		activeSocket: null
	};

	function init() {
		console.log("DEBUG:: Initiating Bitcoin Realtime Tracker");
		// config
		// connect sockets
		// subscribe to feeds
		// start writing data into applicable arrays
		connect();

	}

	function config() {
		// load configuration 
	}

	function connect(socket) {

		var socket = new WebSocket("wss://ws.cex.io/ws/");
		console.log("DEBUG:: Socket: ", socket);
		socket.onopen = function (event) {
			console.log("DEBUG:: Event", event);
			Brt.activeSocket = socket;

			Brt.activeSocket.onmessage = function (data) {
				console.log("DEBUG:: data: ", data);
				if (JSON.parse(data.data).e == "connected") {
					// let's subscribe
					subscribe(socket);
				} else {
					console.log("DEBUG:: data: ", JSON.parse(data.data));
				}
			}

			
		}
	}

	function subscribe(socket) {
		var msg = {
			e: "subscribe",
			rooms: [
				"tickers"
			]
		}

		var jsonString = JSON.stringify(msg);
		socket.send(jsonString);

	}




	function validateData(data) {

	}

	Brt.init();

})();