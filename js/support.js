function supportHandle() {
	janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			$('#details').remove();
			mcusup = pluginHandle;
			console.log("Plugin attached! (" + mcusup.getPlugin() + ", id=" + mcusup.getId() + ")");
			//Janus.listDevices(initDevices);
			console.log("  -- This is a publisher/manager");
			// Prepare the username registration
			if(localStorage.username) {
				var username = localStorage.username;
				var register = { "request": "join", "room": 1000, "ptype": "publisher", "display": username};
				myusername = username;
				var dparse = myusername.split("_");
				mydisplayname = dparse[0];
				mcusup.send({"message": register});
			}
		},
		error: function(error) {
			console.log("  -- Error attaching plugin... " + error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		mediaState: function(medium, on) {
			Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
		},
		webrtcState: function(on) {
			Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
			//$("#videolocal").parent().parent().unblock();
		},
		onmessage: function(msg, jsep) {
			console.log(" ::: Got a message (publisher) :::");
			console.log(JSON.stringify(msg));
			var event = msg["videoroom"];
			console.log("Event: " + event);
			if(event != undefined && event != null) {
				if(event === "joined") {
					// Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
					mysupid = msg["id"];
					console.log("Successfully joined room " + msg["room"] + " with ID " + mysupid + " with Name:  " + myusername);
					publishSupOwnFeed(true);
					// Any new feed to attach to?
					if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
						var list = msg["publishers"];
						console.log("Got a list of available publishers/feeds:");
						console.log(list);
						for(var f in list) {
							var id = list[f]["id"];
							var displayname = list[f]["display"];
							getSupListener(id, displayname);
							newSupRemoteFeed(id, displayname)
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
							getSupListener(id, displayname);
							newSupRemoteFeed(id, displayname)
						}
					} else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
						// One of the publishers has gone away?
						var leaving = msg["leaving"];
						console.log("Publisher left: " + leaving);
						var remoteFeed = null;
						// Need to fix here
						for(var i=1; i<6; i++) {
							if(supfeeds[i] != null && supfeeds[i] != undefined && supfeeds[i].rfid == leaving) {
								remoteFeed = supfeeds[i];
								break;
							}
						}
						if(remoteFeed != null) {
							console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
							var display = remoteFeed.rfdisplay;
							var dstatus = display.split("_");
							console.log("-- ::STATUS: " + dstatus[1]);
							if(dstatus[1] === "bb") {
								console.log("-- ::Leaving BB translator");
							} else if(dstatus[1] === "shidur") {
								console.log("-- ::Leaving Shidur modrator");
							} else {
								console.log("-- ::Leaving 2nd tranlator");
								$('#trlname').empty().hide();
							}
							//$('#remote'+remoteFeed.rfindex).empty().hide();
							//$('#trl2panel').empty().hide();
							$('#trl2panel').addClass('hide').show();
							//$('#videoremote'+remoteFeed.rfindex).empty();
							supfeeds[remoteFeed.rfindex] = null;
							remoteFeed.detach();
						}
					} else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
						// One of the publishers has unpublished?
						var unpublished = msg["unpublished"];
						console.log("Publisher unpublished: " + unpublished);
						//$('#'+unpublished).hide();
						//$('#a'+unpublished).remove();
						var remoteFeed = null;
						// Need to fix here
						for(var i=1; i<6; i++) {
							if(supfeeds[i] != null && supfeeds[i] != undefined && supfeeds[i].rfid == unpublished) {
								remoteFeed = supfeeds[i];
								break;
							}
						}
						if(remoteFeed != null) {
							console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
							var display = remoteFeed.rfdisplay;
							var dstatus = display.split("_");
							console.log("-- ::STATUS: " + dstatus[1]);
							if(dstatus[1] === "bb") {
								console.log("-- ::Leaving BB translator");
								$('#mixname').empty().hide();
							} else if(dstatus[1] === "shidur") {
								console.log("-- ::Leaving Shidur modrator");
							} else {
								console.log("-- ::Leaving 2nd tranlator");
								$('#trlname').empty().hide();
							}
							//$('#remote'+remoteFeed.rfindex).empty().hide();
							//$('#trl2panel').empty().hide();
							$('#trl2panel').addClass('hide').show();
							//$('#videoremote'+remoteFeed.rfindex).empty();
							supfeeds[remoteFeed.rfindex] = null;
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
				mcusup.handleRemoteJsep({jsep: jsep});
			}
		},
		onlocalstream: function(stream) {
			console.log(" ::: Got a local stream :::");
		},
		onremotestream: function(stream) {
			// The publisher stream is sendonly, we don't expect anything here
		},
		ondataopen: function(data) {
			Janus.log("The DataChannel is available!");
			//$('#datasend').removeAttr('disabled');
		},
		ondata: function(rmusername, data) {
			Janus.debug("We got LOCAL data from: " + rmusername + data);
			$('#datarecv').val(data);
		},
		oncleanup: function() {
			console.log(" ::: Got a cleanup notification: we are unpublished now :::");
		}
	});
}

function getSupListener(id, display) {
	var dparse = display.split("_");
	var displayname = dparse[0];
	var userstatus = dparse[1];
	// Chek who enter to room
	if(userstatus === "bb") {
		console.log("-- ::BB translator in the room");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	} else if(userstatus === "shidur") {
		console.log("-- ::Shidur modrator in the room");
	} else {
		console.log("-- ::Tranlator in the room");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	}
}

function publishSupOwnFeed(useAudio) {
	mcusup.createOffer({
		media: { audioRecv: false, videoRecv: false, audioSend: false , videoSend: false, data: true },
		success: function(jsep) {
			console.log("Got publisher SDP!");
			console.log(jsep);
			JSON.stringify(jsep)
			var publish = { "request": "configure", "audio": true, "video": false };
			mcusup.send({"message": publish, "jsep": jsep});
		},
		error: function(error) {
			console.log("WebRTC error:");
			console.log(error);
			if (useAudio) {
				publishSupOwnFeed(false);
			} else {
				bootbox.alert("WebRTC error... " + JSON.stringify(error));
				$('#publish').removeAttr('disabled').click(function() { publishSupOwnFeed(true); });
			}
		}
	});
}

function unpublishSupOwnFeed() {
	// Unpublish our stream
	$('#unpublish').attr('disabled', true).unbind('click');
	var unpublish = { "request": "unpublish" };
	mcusup.send({"message": unpublish});
}

function sendSupData() {
	var data = $('#datasend').val();
	logDiv = document.getElementById("datarecv");
	$('#datarecv').last().append("<span style='color: #2fa4e7'>" + mydisplayname + "</span>" + " : " + data + "<br>");
	logDiv.scrollTop = logDiv.scrollHeight;
	if(data === "") {
		bootbox.alert('Insert a message to send on the DataChannel');
		return;
	}
	datamsg = "<span style='color: #2fa4e7'>" + mydisplayname + "</span>" + " : " + data + "<br>";
	mcusup.data({
		text: datamsg,
		error: function(reason) { bootbox.alert(reason); },
		success: function() { $('#datasend').val(''); },
	});
}

function newSupRemoteFeed(id, display) {
	var remoteFeed = null;
	janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			remoteFeed = pluginHandle;
			console.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
			console.log("  -- This is a subscriber");
			// We wait for the plugin to send us an offer
			var listen = { "request": "join", "room": 1000, "ptype": "listener", "feed": id };
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
						if(supfeeds[i] === undefined || supfeeds[i] === null) {
							supfeeds[i] = remoteFeed;
							remoteFeed.rfindex = i;
							break;
						}
					}
					remoteFeed.rfid = msg["id"];
					remoteFeed.rfdisplay = msg["display"];
					console.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
					rmusername = remoteFeed.rfdisplay;
					$('#remote'+remoteFeed.rfindex).removeClass('hide').html(remoteFeed.rfdisplay).show();
					$('#trl2panel').removeClass('hide').show();
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
				remoteFeed.createAnswer({
					jsep: jsep,
					media: { audioSend: false, video: false , data: true},  // We want recvonly audio/video
					success: function(jsep) {
						console.log("Got SDP!");
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
		webrtcState: function(on) {
			Janus.log("-- ::Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
		},
		onlocalstream: function(stream) {
			// The subscriber stream is recvonly, we don't expect anything here
		},
		onremotestream: function(stream) {
			console.log("Remote feed #" + remoteFeed.rfindex);
			//attachMediaStream($('#remotevideo'+remoteFeed.rfindex).get(0), stream);
			// Forward rtp remote feed
			//console.log("  -- Start Remote RTP forward: " + remoteFeed.rfid);
			//$('#forward'+remoteFeed.rfindex).click(function () {
			//        var rmid = remoteFeed.rfid;
			//        var rmusername = remoteFeed.rfdisplay;
			//        forwardRemoteFeed(rmid, rmusername);
			//});
		},
		ondataopen: function(data) {
			Janus.log("The DataChannel is available!");
			datalive = 1;
			$('#videos').removeClass('hide').show();
			$('#datasend').removeAttr('disabled');
		},
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
		}
	});
}

