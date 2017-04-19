(function() {
	'use strict';

	var Brt = {
		init: init,
		currentBtcUsd: 0,
		currentEurUsd: 0,
		btcUsdActiveSockets: [],
		eurUsdActiveSockets: [],
		btcUsdSources: [{	
							type: "btcusd",
							name: "okcoin", 
							url: "wss://real.okcoin.com:10440/websocket/okcoinapi", 
							config: { 
								subscribe: { 
									event: "addChannel", 
									channel: "ok_sub_spotusd_btc_ticker"
								},
								processData: function (data) {
									return data[0].data.sell;
								}
							}
						},
						{
							type: "btcusd",
							name: "gdax", 
							url: "wss://ws-feed.gdax.com/", 
							config: { 
								subscribe: { 
									type: "subscribe", 
									product_ids: ["BTC-USD"]
								},
								processData: function (data) {
									if (data.type === "done" && data.reason !== "canceled") {
										return data.price;
									}
								}
							}
						},
						{
							type: "btcusd",
							name: "bitfinex", 
							url: "wss://api.bitfinex.com/ws/2", 
							config: {
								subscribe: { 
									event: "subscribe", 
									channel: "ticker", 
									symbol: "tBTCUSD"
								},
								processData: function (data) {
									if (data[1] !== "hb") {
										return data[1][6];
									}
								}
							}
						}],
		eurUsdSources: [{
							type: "eurusd",
							name: "xapi",
							url: "wss://clientapi.tradeblock.com/fix",
							config: {
								subscribe: {
									action: "subscribe",
									channel: "orderbooks"
								},
								processData: function (data) {
									return data.returnData;
								}
							}
						},
						{
							type: "eurusd",
							name: "binary",
							url: "wss://ws.binaryws.com/websockets/v3?app_id=1089",
							config: {
								subscribe: {
									ticks: "frxEURUSD"
								},
								processData: function (data) {
									return data.tick.quote;
								}
							}
						}]
	};

	function init() {
		console.log("DEBUG:: Initiating Bitcoin Realtime Tracker");
		// config
		// connect sockets
		// subscribe to feeds
		// start writing data into applicable arrays
		//connect(Brt.btcUsdSources[0]);
		//connect(Brt.btcUsdSources[1]);
		//connect(Brt.btcUsdSources[0]);
		//connect(Brt.btcUsdSources[1]);
		//connect(Brt.btcUsdSources[2]);
		//connect(Brt.eurUsdSources[0]);
		connect(Brt.eurUsdSources[0]);

		console.log("DEBUG:: btcUsdActiveSockets: ", Brt.btcUsdActiveSockets);

	}

	function config() {
		// load configuration 
	}

	function connect(vendor) {

		var socket = new WebSocket(vendor.url);
		console.log("DEBUG:: Loading socket: " + vendor.name + ", with data: ", socket);
		socket.onopen = function (event) {
			
			subscribe(socket, vendor.config);

			socket["type"] = vendor.type;

			socket.onmessage = function (data) {

				if (data.srcElement.type === "btcusd") {
					var btcUsd = formatBtcUsdData(data);
					if (btcUsd !== undefined) {
						Brt.currentBtcUsd = btcUsd;
						document.getElementById("btcusd").innerHTML = btcUsd;
						console.log("DEBUG:: btcUsd: " + btcUsd + ", origin: " + data.origin);
					}

				} else if (data.srcElement.type === "eurusd") {
					var eurUsd = formatEurUsdData(data);
					if (eurUsd !== undefined) {
						Brt.currentEurUsd = eurUsd;
						document.getElementById("eurusd").innerHTML = eurUsd;
						console.log("DEBUG:: eurUsd: " + eurUsd + ", origin: " + data.origin);	
					}	
				} else {
					console.log("ERROR: Unsupported element type!");
				}
			}

			if (vendor.type === "btcusd") {
				Brt.btcUsdActiveSockets.push(socket);
			} else if (vendor.type === "eurusd") {
				Brt.eurUsdActiveSockets.push(socket);
			}

			updateActiveSources();

			if (Brt.btcUsdActiveSockets.length > 0 && Brt.eurUsdActiveSockets.length > 0) {
				// we have both values, let's calculate BTC/EUR
				document.getElementById("btceur").innerHTML = Brt.currentBtcUsd / Brt.currentEurUsd;
			}
		}
	}

	function subscribe(socket, config) {
		console.log("DEBUG:: config:: ", config);

		socket.send(JSON.stringify(config.subscribe));
	}


	function formatBtcUsdData(data) {
		if (data.origin !== "undefined") {
			for (var i=0; i<Brt.btcUsdSources.length; i++) {
				if (Brt.btcUsdSources[i].url.indexOf(data.origin) == 0) {
					return Brt.btcUsdSources[i].config.processData(JSON.parse(data.data));
				}
			}
		} else {
			console.log("ERROR: WS data origin undefined!!");
		}
	}

	function formatEurUsdData(data) {
			if (data.origin !== "undefined") {
			for (var i=0; i<Brt.eurUsdSources.length; i++) {
				if (Brt.eurUsdSources[i].url.indexOf(data.origin) == 0) {
					return Brt.eurUsdSources[i].config.processData(JSON.parse(data.data));
				}
			}
		} else {
			console.log("ERROR: WS data origin undefined!!");
		}	
	}

	function updateActiveSources() {
		document.getElementById("btcusdSources").innerHTML = 
			"(" + Brt.btcUsdActiveSockets.length + " of " + Brt.btcUsdSources.length + ")";
		document.getElementById("eurusdSources").innerHTML = 
			"(" + Brt.eurUsdActiveSockets.length + " of " + Brt.eurUsdSources.length + ")";
	}

	Brt.init();

})();