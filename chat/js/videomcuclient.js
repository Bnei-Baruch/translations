// We make use of this 'server' variable to provide the address of the
// REST Janus API. By default, in this example we assume that Janus is
// co-located with the web server hosting the HTML pages but listening
// on a different port (8088, the default for HTTP in Janus), which is
// why we make use of the 'window.location.hostname' base address. Since
// Janus can also do HTTPS, and considering we don't really want to make
// use of HTTP for Janus if your demos are served on HTTPS, we also rely
// on the 'window.location.protocol' prefix to build the variable, in
// particular to also change the port used to contact Janus (8088 for
// HTTP and 8089 for HTTPS, if enabled).
// In case you place Janus behind an Apache frontend (as we did on the
// online demos at http://janus.conf.meetecho.com) you can just use a
// relative path for the variable, e.g.:
//
// 		var server = "/janus";
//
// which will take care of this on its own.
//
//
// If you want to use the WebSockets frontend to Janus, instead, you'll
// have to pass a different kind of address, e.g.:
//
// 		var server = "ws://" + window.location.hostname + ":8188";
//
// Of course this assumes that support for WebSockets has been built in
// when compiling the gateway. WebSockets support has not been tested
// as much as the REST API, so handle with care!
//
//
// If you have multiple options available, and want to let the library
// autodetect the best way to contact your gateway (or pool of gateways),
// you can also pass an array of servers, e.g., to provide alternative
// means of access (e.g., try WebSockets first and, if that fails, fall
// back to plain HTTP) or just have failover servers:
//
//		var server = [
//			"ws://" + window.location.hostname + ":8188",
//			"/janus"
//		];
//
// This will tell the library to try connecting to each of the servers
// in the presented order. The first working server will be used for
// the whole session.
//

var srv = "v4g.kbb1.com";
var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + srv + ":8088/janus";
else
	server = "https://" + srv + ":8889/janus";

var janus = null;
var mcutest = null;
var started = false;
var janusStream;

var myusername = null;
var rmusername = null;
var myid = null;
var mystream = null;
var publisher_id = null;
var muted = false;

//var ip = "10.66.23.104";
var ip = "10.66.23.104";
var localport = null;
var remoteport = null;
var aport = 8002;
var vport = 9884;
var room = 1000;

var feeds = [];
var bitrateTimer = [];
var pluginHandles = [];

var srcaudio;
var trlaudio;
var srcvideo;


if(localStorage.makor) {
	console.log("  -- Storage Makor: " + localStorage.makor);
	console.log("  -- Storage Makor Text: " + localStorage.makortext);
	var makor = Number(localStorage.makor);
} else {
	var makor = null;
}

if(localStorage.translate) {
	console.log("  -- Storage Translate: " + localStorage.translate);
	console.log("  -- Storage Video Text: " + localStorage.translatetext);
	var translate = Number(localStorage.translate);
	localport = Number("5"+translate+"0");
	room = Number("1"+translate+"0");
} else {
	var translate = null;
}

$(document).on('click', '#makorlist li a', function () {
	console.log("Selected Option:"+$(this).text());
	makor = Number($(this).attr("id"));
	localStorage.makor = makor;
	localStorage.makortext = $(this).text();
	console.log("  -- Selected Makor: " + makor);
	$('#makor').removeClass('hide').html("Source: " + $(this).text()).show();
	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}
	if(myusername != undefined && myusername != null) {
		//attachStreamingHandle(makor, '#remoteAudio');
	}
});

$(document).on('click', '#translatelist li a', function () {
	console.log("Selected Option:"+$(this).text());
	translate = Number($(this).attr("id"));
	localport = Number("5"+translate+"0");
	room = Number("1"+translate+"0");
	console.log("  -- Port for rediraction is: " + localport);
	localStorage.translate = translate;
	localStorage.translatetext = $(this).text();
	console.log("  -- Selected Translate: " + translate);
	$('#translate').removeClass('hide').html("Translation room: " + $(this).text()).show();
	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}
});

$(document).ready(function() {

	if(translate != undefined && translate != null) {
		$('#translate').removeClass('hide').html("Translation room: " + localStorage.translatetext).show();
	}

	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}
	// Initialize the library (console debug enabled)
	Janus.init({debug: true, callback: function() {
			// Use a button to start the demo
			$('#start').click(function() {
				if(started)
					return;
				started = true;
				$(this).attr('disabled', true).unbind('click');
				// Make sure the browser supports WebRTC
				if(!Janus.isWebrtcSupported()) {
					bootbox.alert("No WebRTC support... ");
					return;
				}
				// Create session
				janus = new Janus(
					{
						server: server,
						success: function() {

							// Attach to video MCU test plugin
							janus.attach(
								{
									plugin: "janus.plugin.videoroom",
									success: function(pluginHandle) {
										$('#details').remove();
										mcutest = pluginHandle;
										console.log("Plugin attached! (" + mcutest.getPlugin() + ", id=" + mcutest.getId() + ")");
										console.log("  -- This is a publisher/manager");
										// Prepare the username registration
										$('#videojoin').removeClass('hide').show();
										$('#registernow').removeClass('hide').show();
										$('#register').click(registerUsername);
										$('#username').focus();
										$('#start').removeAttr('disabled').html("Disconnect")
											.click(function() {
												$(this).attr('disabled', true);
												janus.destroy();
											});

									},
									error: function(error) {
										console.log("  -- Error attaching plugin... " + error);
										bootbox.alert("Error attaching plugin... " + error);
									},
									consentDialog: function(on) {
										console.log("Consent dialog should be " + (on ? "on" : "off") + " now");
										if(on) {
											// Darken screen and show hint
											$.blockUI({
												message: '<div><img src="up_arrow.png"/></div>',
												css: {
													border: 'none',
													padding: '15px',
													backgroundColor: 'transparent',
													color: '#aaa',
													top: '10px',
													left: (navigator.mozGetUserMedia ? '-100px' : '300px')
												} });
										} else {
											// Restore screen
											$.unblockUI();
										}
									},
									onmessage: function(msg, jsep) {
										console.log(" ::: Got a message (publisher) :::");
										console.log(JSON.stringify(msg));
										var event = msg["videoroom"];
										console.log("Event: " + event);
										if(event != undefined && event != null) {
											if(event === "joined") {
												// Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
												myid = msg["id"];
												console.log("Successfully joined room " + msg["room"] + " with ID " + myid + " with Name:  " + myusername);
												publishOwnFeed(true);
												// Any new feed to attach to?
												if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
													var list = msg["publishers"];
													console.log("Got a list of available publishers/feeds:");
													console.log(list);
													for(var f in list) {
														var id = list[f]["id"];
														var displayname = list[f]["display"];
														getListener(id, displayname);
														newRemoteFeed(id, displayname)
													}
												}
											} else if(event === "destroyed") {
												// The room has been destroyed
												console.log("The room has been destroyed!");
												bootbox.alert(error, function() {
													window.location.reload();
												});
											} else if(event === "event") {
												// Any new feed to attach to?
												if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
													var list = msg["publishers"];
													console.log("Got a list of available publishers/feeds:");
													console.log("--== Someone enter :| ==--");
													console.log(list);
													for(var f in list) {
														var id = list[f]["id"];
														var displayname = list[f]["display"];
														getListener(id, displayname);
														newRemoteFeed(id, displayname)
													}
												} else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
													// One of the publishers has gone away?
													var leaving = msg["leaving"];
													console.log("Publisher left: " + leaving);
													$('#'+leaving).hide();
													$('#a'+leaving).remove();
													var remoteFeed = null;
													for(var i=1; i<6; i++) {
														if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == leaving) {
															remoteFeed = feeds[i];
															break;
														}
													}
													if(remoteFeed != null) {
														console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
														feeds[remoteFeed.rfindex] = null;
														remoteFeed.detach();
													}
												} else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
													// One of the publishers has unpublished?
													var unpublished = msg["unpublished"];
													console.log("Publisher left: " + unpublished);
													$('#'+unpublished).hide();
													$('#a'+unpublished).remove();
													var remoteFeed = null;
													for(var i=1; i<6; i++) {
														if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == unpublished) {
															remoteFeed = feeds[i];
															break;
														}
													}
													if(remoteFeed != null) {
														console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
														feeds[remoteFeed.rfindex] = null;
														remoteFeed.detach();
													}
												} else if(msg["error"] !== undefined && msg["error"] !== null) {
													bootbox.alert(msg["error"]);
												}
											}
										}
										if(jsep !== undefined && jsep !== null) {
											console.log("Handling SDP as well...");
											console.log(jsep);
											mcutest.handleRemoteJsep({jsep: jsep});
										}
									},
									onlocalstream: function(stream) {
										console.log(" ::: Got a local stream :::");
										mystream = stream;
										console.log(JSON.stringify(stream));
										$('#videojoin').hide();
										$('#videos').removeClass('hide').show();
									},
									onremotestream: function(stream) {
										// The publisher stream is sendonly, we don't expect anything here
									},
									ondataopen: function(data) {
										Janus.log("The DataChannel is available!");
										$('#videos').removeClass('hide').show();
										$('#datasend').removeAttr('disabled');
										$('#registernow').addClass('hide').show();
									},
									ondata: function(rmusername, data) {
										Janus.debug("We got LOCAL data from: " + rmusername + data);
										$('#datarecv').val(data);
									},
									oncleanup: function() {
										console.log(" ::: Got a cleanup notification: we are unpublished now :::");
										mystream = null;
										muted = false;
										//$('#datasend').attr('disabled', true);
									}
								});
						},
						error: function(error) {
							console.log(error);
							bootbox.alert(error, function() {
								window.location.reload();
							});
						},
						destroyed: function() {
							window.location.reload();
						}
					});
			});
		}});
});

function getListener(id, display) {
	var dparse = display.split("_");
	var displayname = dparse[0];
	var userstatus = dparse[1];
	if(userstatus === "bb") {
		console.log("-- ::Enter BB translator");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	} else if(userstatus === "shidur") {
		console.log("-- ::Shidur modrator enter");
	} else {
		console.log("-- ::2nd tranlator enter");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	}
}

function checkregEnter(field, event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		registerUsername();
		return false;
	} else {
		return true;
	}
}

function registerUsername() {
	if($('#username').length === 0) {
		// Create fields to register
		$('#register').click(registerUsername);
		$('#username').focus();
	} else {
		// Try a registration
		$('#username').attr('disabled', true);
		$('#register').attr('disabled', true).unbind('click');
		var username = $('#username').val();
		if(username === "") {
			$('#you')
				.removeClass().addClass('label label-warning')
				.html("Insert your display name (e.g., pippo)");
			$('#username').removeAttr('disabled');
			$('#register').removeAttr('disabled').click(registerUsername);
			return;
		}
		if(/[^a-zA-Z0-9]/.test(username)) {
			$('#you')
				.removeClass().addClass('label label-warning')
				.html('Input is not alphanumeric');
			$('#username').removeAttr('disabled').val("");
			$('#register').removeAttr('disabled').click(registerUsername);
			return;
		}
		var username = username + "_bb";
		var register = { "request": "join", "room": room, "ptype": "publisher", "display": username};
		myusername = username;
		mcutest.send({"message": register});
		$('#translate').addClass('disabled');
	}
}

function publishOwnFeed(useAudio) {
	// Publish our stream
	$('#publish').attr('disabled', true).unbind('click');
	mcutest.createOffer(
		{
			//media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: false, data: true },	// Publishers are sendonly
			media: { audio: false, video: false, data: true },       // Publishers are sendonly
			success: function(jsep) {
				console.log("Got publisher SDP!");
				console.log(jsep);
				var publish = { "request": "configure", "audio": false, "video": false };
				mcutest.send({"message": publish, "jsep": jsep});
			},
			error: function(error) {
				console.log("WebRTC error:");
				console.log(error);
				if (useAudio) {
					publishOwnFeed(false);
				} else {
					bootbox.alert("WebRTC error... " + JSON.stringify(error));
					$('#publish').removeAttr('disabled').click(function() { publishOwnFeed(true); });
				}
			}
		});
}

function unpublishOwnFeed() {
	// Unpublish our stream
	$('#unpublish').attr('disabled', true).unbind('click');
	var unpublish = { "request": "unpublish" };
	mcutest.send({"message": unpublish});
}

function checkEnter(event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		sendData();
		return false;
	} else {
		return true;
	}
}

function sendData() {
	var data = $('#datasend').val();
	logDiv = document.getElementById("datarecv");
	$('#datarecv').last().append("<span style='color: #2fa4e7'>" + myusername + "</span>" + " : " + data + "<br>");
	logDiv.scrollTop = logDiv.scrollHeight;
	if(data === "") {
		bootbox.alert('Insert a message to send on the DataChannel');
		return;
	}
	datamsg = "<span style='color: #73a839'>" + myusername + "</span>" + " : " + data + "<br>";
	mcutest.data({
		text: datamsg,
		error: function(reason) { bootbox.alert(reason); },
		success: function() { $('#datasend').val(''); },
	});
}

function getHiddenProp(){
	var prefixes = ['webkit','moz','ms','o'];
	if ('hidden' in document) return 'hidden';
	for (var i = 0; i < prefixes.length; i++){
		if ((prefixes[i] + 'Hidden') in document)
			return prefixes[i] + 'Hidden';
	}
	return null;
}

function newRemoteFeed(id, display) {
	// A new feed has been published, create a new plugin handle and attach to it as a listener
	var remoteFeed = null;
	janus.attach(
		{
			plugin: "janus.plugin.videoroom",
			success: function(pluginHandle) {
				remoteFeed = pluginHandle;
				console.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
				console.log("  -- This is a subscriber");
				// We wait for the plugin to send us an offer
				var listen = { "request": "join", "room": room, "ptype": "listener", "feed": id };
				remoteFeed.send({"message": listen});
			},
			error: function(error) {
				console.log("  -- Error attaching plugin... " + error);
				bootbox.alert("Error attaching plugin... " + error);
			},
			onmessage: function(msg, jsep) {
				console.log(" ::: Got a message (listener) :::");
				console.log(JSON.stringify(msg));
				var event = msg["videoroom"];
				console.log("Event: " + event);
				if(event != undefined && event != null) {
					if(event === "attached") {
						// Subscriber created and attached
						for(var i=1;i<6;i++) {
							if(feeds[i] === undefined || feeds[i] === null) {
								feeds[i] = remoteFeed;
								remoteFeed.rfindex = 1;
								break;
							}
						}
						remoteFeed.rfid = msg["id"];
						remoteFeed.rfdisplay = msg["display"];
						console.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
						rmusername = remoteFeed.rfdisplay;
					} else if(msg["error"] !== undefined && msg["error"] !== null) {
						bootbox.alert(msg["error"]);
					} else {
						// What has just happened?
					}
				}
				if(jsep !== undefined && jsep !== null) {
					console.log("Handling SDP as well...");
					console.log(jsep);
					// Answer and attach
					remoteFeed.createAnswer(
						{
							jsep: jsep,
							media: { audioSend: false, video: false , data: true},	// We want recvonly audio/video
							success: function(jsep) {
								console.log("Got SDP!");
								console.log(jsep);
								var body = { "request": "start", "room": room };
								remoteFeed.send({"message": body, "jsep": jsep});
							},
							error: function(error) {
								console.log("WebRTC error:");
								console.log(error);
								bootbox.alert("WebRTC error... " + JSON.stringify(error));
							}
						});

				}
			},
			onlocalstream: function(stream) {
				// The subscriber stream is recvonly, we don't expect anything here
			},
			onremotestream: function(stream) {
				console.log("Remote feed #" + remoteFeed.rfindex);
				//attachMediaStream($('#remotevideo'+remoteFeed.rfindex).get(0), stream);
				//attachMediaStream($('#transAudio').get(0), stream);
				$('#trl2panel').removeClass('hide').show();
				$('#datain').removeClass('hide').show();
				$('#dataout').removeClass('hide').show();
			},
			ondataopen: function(data) {
				Janus.log("The DataChannel is available!");
				$('#videos').removeClass('hide').show();
				$('#datasend').removeAttr('disabled');
			},
			/*ondata: function(data) {
                    Janus.debug("We got data from: " + data);
    logDiv = document.getElementById("datarecv");
                    $('#datarecv').last().append(data);
    logDiv.scrollTop = logDiv.scrollHeight;
    var visProp = getHiddenProp();
    if (document[visProp]) {
    //notifyMe('NEW MESSAGE!');
    var html = data;
    var div = document.createElement("div");
    div.innerHTML = html;
    var text = div.textContent || div.innerText || "";
    var message = text.split(":");
    var user = message[0];
    var text = message[1];
    notifyMe(user, text);
    }
            },*/
			ondata: function(data) {
				var dataparse = data.split(":");
				Janus.debug("We got data from: " + data);
				Janus.debug(" -- Split data: " + dataparse[0]);
				if(dataparse[0] === "micst") {
					Janus.debug(" -- Going to select userid: " + dataparse[1]);
					if(dataparse[2] === "Off") {
						Janus.debug(" -- User ID: " + dataparse[1] + " mic is closed!");
						$('#'+dataparse[1]).removeClass('active');
					}
					if(dataparse[2] === "On") {
						Janus.debug(" -- User ID: " + dataparse[1] + " mic is open!");
						$('#'+dataparse[1]).addClass('active');
					}
				} else {
					logDiv = document.getElementById("datarecv");
					$('#datarecv').last().append(data);
					logDiv.scrollTop = logDiv.scrollHeight;
					var visProp = getHiddenProp();
					if (document[visProp]) {
						//notifyMe('NEW MESSAGE!');
						var html = data;
						var div = document.createElement("div");
						div.innerHTML = html;
						var text = div.textContent || div.innerText || "";
						var message = text.split(":");
						var user = message[0];
						var text = message[1];
						notifyMe(user, text);
					}
				}
			},
			oncleanup: function() {
				console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
				//$('#waitingvideo'+remoteFeed.rfindex).remove();
				//$('#datasend').attr('disabled', true);
			}
		});
}
