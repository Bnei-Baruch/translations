//var janus = null;
//var textroom = null;
//var myusername = null;
//var myid = null;
//var participants = {}
//var transactions = {}

function attachChat() {
	janus.attach({
		plugin: "janus.plugin.textroom",
		success: function(pluginHandle) {
			//$('#details').remove();
			textroom = pluginHandle;
			Janus.log("Plugin attached! (" + textroom.getPlugin() + ", id=" + textroom.getId() + ")");
			// Setup the DataChannel
			var body = { "request": "setup" };
			Janus.debug("Sending message (" + JSON.stringify(body) + ")");
			textroom.send({"message": body});
		},
		error: function(error) {
			console.error("  -- Error attaching plugin...", error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		webrtcState: function(on) {
			Janus.log("Janus says our DataChannel WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
			$("#videoleft").parent().unblock();
		},
		onmessage: function(msg, jsep) {
			Janus.debug(" ::: Got a message :::");
			Janus.debug(JSON.stringify(msg));
			if(msg["error"] !== undefined && msg["error"] !== null) {
				bootbox.alert(msg["error"]);
			}
			if(jsep !== undefined && jsep !== null) {
				// Answer
				textroom.createAnswer(
					{
						jsep: jsep,
						media: { audio: false, video: false, data: true },	// We only use datachannels
						success: function(jsep) {
							Janus.debug("Got SDP!");
							Janus.debug(jsep);
							var body = { "request": "ack" };
							textroom.send({"message": body, "jsep": jsep});
						},
						error: function(error) {
							Janus.error("WebRTC error:", error);
							bootbox.alert("WebRTC error... " + JSON.stringify(error));
						}
					});
			}
		},
		ondataopen: function(data) {
			Janus.log("The DataChannel is available!");
                	datalive = 1;
                	$('#chat').removeClass('hide').show();
                	$('#datasend').removeAttr('disabled');
			// Prompt for a display name to join the default room
			enterChat();
		},
		ondata: function(data) {
			Janus.debug("We got data from the DataChannel! " + data);
			//~ $('#datarecv').val(data);
			var json = JSON.parse(data);
			var transaction = json["transaction"];
			if(transactions[transaction]) {
				// Someone was waiting for this
				transactions[transaction](json);
				delete transactions[transaction];
				return;
			}
			var what = json["textroom"];
			if(what === "message") {
				// Incoming message: public or private?
				var msg = json["text"];
				msg = msg.replace(new RegExp('<', 'g'), '&lt');
				msg = msg.replace(new RegExp('>', 'g'), '&gt');
				var from = json["from"];
				var whisper = json["whisper"];
				if(whisper === true) {
					// Private message
					$('#datarecv').append('<p style="color: purple;"><b>[whisper from ' + participants[from].split("_")[0] + ']</b> ' + msg);
					$('#datarecv').get(0).scrollTop = $('#datarecv').get(0).scrollHeight;				
				} else {
					// Public message
					//$('#datarecv').append('<p><b>' + participants[from] + ':</b> ' + msg);
					//$('#datarecv').get(0).scrollTop = $('#datarecv').get(0).scrollHeight;				
					var user = participants[from].split("_")[0];
					var text = msg;
					datamsg = "<span style='color: #2fa4e7'>" + user + "</span>" + " : " + text + "<br>";
					showMessage(user, text, datamsg);
				}
			} else if(what === "join") {
				// Somebody joined
				var username = json["username"];
				var display = json["display"];
				participants[username] = display ? display : username;
				if(username !== mychatid && $('#rp' + username).length === 0) {
					// Add to the participants list
					$('#list').append('<li id="rp' + username + '" class="list-group-item">' + participants[username].split("_")[0] + '</li>');
					$('#rp' + username).css('cursor', 'pointer').click(function() {
						var username = $(this).attr('id').split("rp")[1];
						sendPrivateMsg(username);
					});
				}
				var displayname = participants[username].split("_")[0]
				datamsg = "<span style='color: green;'><i>" + displayname + "</span> joined</i><br>";
				var user = "SYSTEM";
                                var text = displayname + " joined";
				showMessage(user, text, datamsg);
			} else if(what === "leave") {
				// Somebody left
				var username = json["username"];
				var displayname = participants[username].split("_")[0]
				$('#rp' + username).remove();
				datamsg = "<span style='color: green;'><i>" + displayname + "</span> leave</i><br>";
                                var user = "SYSTEM";
                                var text = displayname + " leave";
                                showMessage(user, text, datamsg);
				delete participants[username];
			} else if(what === "destroyed") {
				// Room was destroyed, goodbye!
				Janus.warn("The room has been destroyed!");
				bootbox.alert("The room has been destroyed", function() {
					window.location.reload();
				});
			}
		},
		oncleanup: function() {
			Janus.log(" ::: Got a cleanup notification :::");
			$('#datasend').attr('disabled', true);
		}
	});
}

function checkEnter(field, event) {
        var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
        if(theCode == 13) {
                if(field.id == 'username')
                        registerUsername();
                else if(field.id == 'datasend')
                        sendData();
                return false;
        } else {
                return true;
        }
}

function enterChat(roomid) {
	if(roomid != null) {
		// Leave previus room
		if(room != 1000) {
			var transaction = randomString(12);
			var req = { textroom: "leave", transaction: transaction, room: room };
			textroom.data({
				text: JSON.stringify(req),
				error: function(reason) {
					bootbox.alert(reason);
				}
			});
		}
		room = roomid;
	}
	var mydisplayname = myusername.split("_")[0];
	var userstatus = myusername.split("_")[1];
	mychatid = randomString(12);
	var transaction = randomString(12);
	var register = {
		textroom: "join",
		transaction: transaction,
		room: room,
		username: mychatid,
		display: myusername
	};
	transactions[transaction] = function(response) {
		if(response["textroom"] === "error") {
			// Something went wrong
			bootbox.alert(response["error"]);
			$('#username').removeAttr('disabled').val("");
			$('#register').removeAttr('disabled').click(registerUsername);
			return;
		}
		// We're in
		//$('#roomjoin').hide();
		//$('#room').removeClass('hide').show();
		//$('#participant').removeClass('hide').html(myusername).show();
		//$('#datarecv').css('height', ($(window).height()-420)+"px");
		$('#datasend').removeAttr('disabled');
		// Any participants already in?
		console.log("Participants:", response.participants);
		if(response.participants && response.participants.length > 0) {
			for(var i in response.participants) {
				var p = response.participants[i];
				participants[p.username] = p.display ? p.display : p.username;
				if(p.username !== mychatid && $('#rp' + p.username).length === 0) {
					// Add to the participants list
					$('#list').append('<li id="rp' + p.username + '" class="list-group-item">' + participants[p.username].split("_")[0] + '</li>');
					$('#rp' + p.username).css('cursor', 'pointer').click(function() {
						var username = $(this).attr('id').split("rp")[1];
						sendPrivateMsg(username);
					});
				}
				//$('#datarecv').append('<p><i style="color: green;">' + participants[p.username] + ' joined</i></p>');
				//$('#datarecv').get(0).scrollTop = $('#datarecv').get(0).scrollHeight;				
			}
		}
	};
	textroom.data({
		text: JSON.stringify(register),
		error: function(reason) {
			bootbox.alert(reason);
			$('#username').removeAttr('disabled').val("");
			$('#register').removeAttr('disabled').click(registerUsername);
		}
	});
}

function sendPrivateMsg(username) {
	var display = participants[username];
	if(!display)
		return;
	bootbox.prompt("Private message to " + display, function(result) {
		if(result && result !== "") {
			var message = {
				textroom: "message",
				transaction: randomString(12),
				room: room,
				to: username,
				text: result
			};
			textroom.data({
				text: JSON.stringify(message),
				error: function(reason) { bootbox.alert(reason); },
				success: function() {
					$('#datarecv').append('<p style="color: purple;"><b>[whisper to ' + display + ']</b> ' + result);
					$('#datarecv').get(0).scrollTop = $('#datarecv').get(0).scrollHeight;				
				}
			});
		}
	});
	return;
}

/*
function checkEnter(event) {
        var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
        if(theCode == 13) {
                if(mysupid) {
                sendSupData();
                } else {
                sendData();
                }
                return false;
        } else {
                return true;
        }
}

function sendData() {
    var data = $('#datasend').val();
        logDiv = document.getElementById("datarecv");
        $('#datarecv').last().append("<span style='color: #2fa4e7'>" + mydisplayname + "</span>" + " : " + data + "<br>");
        logDiv.scrollTop = logDiv.scrollHeight;
        if(data === "") {
                        bootbox.alert('Insert a message to send on the DataChannel');
                        return;
        }
        datamsg = "<span style='color: #2fa4e7'>" + mydisplayname + "</span>" + " : " + data + "<br>";
        mcutest.data({
                        text: datamsg,
                        error: function(reason) { bootbox.alert(reason); },
                        success: function() { $('#datasend').val(''); },
        });
}
*/

function showMessage(user, text, datamsg) {
	var logDiv = document.getElementById("datarecv");
	$('#datarecv').last().append(datamsg);
	logDiv.scrollTop = logDiv.scrollHeight;
	var visProp = getHiddenProp();
	if (document[visProp]) {
		notifyMe(user, text);
	}
}

function notifyMe(title, message) {
        if (!Notification) {
                alert('Desktop notifications not available in your browser. Try Chromium.');
                return;
        }
        if (Notification.permission !== "granted")
                Notification.requestPermission();
        else {
                var notification = new Notification(title+":", {
                        icon: 'nlogo.png',
                        body: message,
                });
        }
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

function sendData() {
	var data = $('#datasend').val();
	if(data === "") {
		bootbox.alert('Insert a message to send on the DataChannel');
		return;
	}
	var message = {
		textroom: "message",
		transaction: randomString(12),
		room: room,
		text: data
	};
	textroom.data({
		text: JSON.stringify(message),
		error: function(reason) { bootbox.alert(reason); },
		success: function() { $('#datasend').val(''); }
	});
}

// Just an helper to generate random usernames
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}
