(function() {
	'use strict';

	var Brt = {
		init: init,
		closeAll: closeAll,
		
		currentBtcUsd: 0,
		currentEurUsd: 0,
		maxAge:  3600000, // message max age
		latest: 0,
		timer: null,

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
									var t = JSON.parse(data.data);
									return { 
												price: t[0].data.sell,
												timestamp: t[0].data.timestamp
											 };
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
									var t = JSON.parse(data.data);
									if (t.type === "done" && t.reason !== "canceled") {
										return { 
													price: t.price, 
													timestamp: new Date(t.time).getTime() };
												};
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
									var t = JSON.parse(data.data);
									if (t[1] !== "hb" && t.event !== "info" && t.event !== "subscribed") {
										return {
													price: t[1][6],
													timestamp: Date.now() // fixme!, incorrect time
												};
									}
								}
							}
						}],
		eurUsdSources: [{
							type: "eurusd",
							name: "binary",
							url: "wss://ws.binaryws.com/websockets/v3?app_id=1089",
							config: {
								subscribe: {
									ticks: "frxEURUSD"
								},
								processData: function (data) {
									var t = JSON.parse(data.data);
									return {
												price: t.tick.quote,
												timestamp: Date.now() // fixme!, incorrect time
											};
								}
							}
						}]
	};

	function init() {

		Brt.timer = timer(Brt.maxAge);

		// connect btcusd sources
		for (var i=0;i<Brt.btcUsdSources.length;i++) {
			connect(Brt.btcUsdSources[i]);
		}
		// connect eurusd source
		for (var j=0;j<Brt.eurUsdSources.length;j++) {
			connect(Brt.eurUsdSources[j]);
		}
	}

	function connect(vendor) {

		var socket = new WebSocket(vendor.url);
		socket.onopen = function (event) {
			
			subscribe(socket, vendor.config);
			socket["type"] = vendor.type;

			socket.onmessage = function (data) {

				if (data.srcElement.type === "btcusd" || data.srcElement.type === "eurusd") {
					
					var res = formatData(data, data.srcElement.type);

					if (res !== undefined) {
						data.srcElement.type === "btcusd"
						? Brt.currentBtcUsd = res.price
						: Brt.currentEurUsd = res.price;
						
						Brt.timer = timer(Brt.maxAge);
						Brt.latest = new Date().getTime();

						if ((Date.now() - res.timestamp) < Brt.maxAge) {
							document.getElementById(data.srcElement.type).innerHTML = res.price;
							console.log("DEBUG:: price: "+res.price+", timestamp: "+res.timestamp+", origin: "+data.origin+", timeDiff: "+(Date.now() - res.timestamp));
						}
					}

				} else {
					console.log("ERROR: Unsupported element type!");
				}


				if (Brt.btcUsdActiveSockets.length > 0 && Brt.eurUsdActiveSockets.length > 0) {
					// we have both values, let's calculate BTC/EUR
					document.getElementById("btceur").innerHTML = (Brt.currentBtcUsd / Brt.currentEurUsd).toFixed(5);
				}
			}

			if (vendor.type === "btcusd") {
				Brt.btcUsdActiveSockets.push(socket);
			} else if (vendor.type === "eurusd") {
				Brt.eurUsdActiveSockets.push(socket);
			}

			updateActiveSources();

		}
	}

	function subscribe(socket, config) {
		socket.send(JSON.stringify(config.subscribe));
	}

	function formatData(data, sType) {
		var sources;

		sType === "btcusd" 
			? sources = Brt.btcUsdSources
			: sources = Brt.eurUsdSources;

		if (data.origin !== "undefined") {
			for (var i=0; i<sources.length; i++) {
				if (sources[i].url.indexOf(data.origin) == 0) {
					return sources[i].config.processData(data);
				}
			}
		}
	}

	function updateActiveSources() {
		document.getElementById("btcusdSources").innerHTML = 
			"(" + Brt.btcUsdActiveSockets.length + " of " + Brt.btcUsdSources.length + ")";
		document.getElementById("eurusdSources").innerHTML = 
			"(" + Brt.eurUsdActiveSockets.length + " of " + Brt.eurUsdSources.length + ")";
	}

	function closeAll(sockets) {
		for (var i=0;i<sockets.length;i++) {
			sockets[i].close();
		};
	}

	function timer(time) {
		setTimeout(function(){
			if ((new Date().getTime() - Brt.latest) > Brt.maxAge) {
				alert("Newest message is " + time/60000 + " minutes old, please refresh the web-page to try again!");	
			}
			
		}, time);
	}

	window.addEventListener("beforeunload", function (event) {
		closeAll(Brt.btcUsdActiveSockets);
		closeAll(Brt.eurUsdActiveSockets);
	})

	Brt.init();

})();