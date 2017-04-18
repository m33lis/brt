(function() {
	'use strict';

	var Brt = {
		init: init,
		activeSockets: [],
		vendors: [{name: "cex", url: "wss://ws.cex.io/ws/", config: { subscribe: { e: "subscribe", rooms: [ "tickers"]}}},
					{name: "acx", url: "wss://ws-feed.gdax.com/", config: {subscribe: { type: "subscribe", product_ids: ["BTC-USD"]}}}]
	};

	function init() {
		console.log("DEBUG:: Initiating Bitcoin Realtime Tracker");
		// config
		// connect sockets
		// subscribe to feeds
		// start writing data into applicable arrays
		//connect(Brt.vendors[0]);
		connect(Brt.vendors[0]);
		connect(Brt.vendors[1]);


		console.log("DEBUG:: activeSockets: ", Brt.activeSockets);

	}

	function config() {
		// load configuration 
	}

	function connect(vendor) {

		var socket = new WebSocket(vendor.url);
		console.log("DEBUG:: Loading socket: "+vendor.name+", with data: ", socket);
		socket.onopen = function (event) {

			console.log("DEBUG:: Event", event);

					subscribe(socket, vendor.config);

			socket.onmessage = function (data) {
				console.log("DEBUG:: data: ", data);
				if (JSON.parse(data.data).e == "connected") {
					// let's subscribe
					subscribe(socket, vendor.config);
				} else {
					console.log("DEBUG:: data: ", JSON.parse(data.data));
					document.getElementById("btcusd").innerHTML = JSON.parse(data.data).price;
				}
			}

			Brt.activeSockets.push(socket);
		}
	}

	function subscribe(socket, config) {
		socket.send(JSON.stringify(config.subscribe));
	}


	function validateData(data) {

	}

	Brt.init();

})();