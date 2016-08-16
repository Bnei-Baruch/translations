function attachChat() {
	janus.attach({
		plugin: "janus.plugin.textroom",
		success: function(pluginHandle) {
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
			// Enter to all rooms
      enterChat(roomId);
		},
		ondata: function(data) {
			Janus.debug("We got data from the DataChannel! " + data);
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
				var fromroom = json["room"];
				var whisper = json["whisper"];

        var user = from;
        if (from.indexOf('bb_shidur') !== -1) {
          // Public message
          user = 'bb_shidur';
        }
        showMessage(user, msg, json["to"]);
			} else if(what === "join") {
        addUser(json);
			} else if(what === "leave") {
        removeUser(json);
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
    if(field.id == 'datasend')
      sendData();
    return false;
  } else {
    return true;
  }
}

function addUser(p) {
  if (p.display === 'bb_shidur') {
    return;
  }
  removeUser(p);
  $('#rooms-list').append('<a id="user-' + p.username + '" href="#" class="list-group-item">' + p.display + '</a>');
  $('#user-' + p.username).click(function() {
    setActive($(this));
    console.log('Clicked on ' + p.username + ' ' + p.display);
  });
  checkActive();
}

function removeUser(p) {
  $('#rooms-list a[id=user-' + p.username + ']').remove();
  checkActive();
}

function setActive(elem) {
  $('#rooms-list a.active').removeClass('active');
  elem.addClass('active');
}

function checkActive() {
  if (!$('#rooms-list a.active').size()) {
    $('#rooms-list a').first().addClass('active');
  }
}

function getActiveUsername() {
  return $('#rooms-list a.active').attr('id').replace(/^user-/, '');
}

function enterChat(roomid) {
	var transaction = randomString(12);
	var register = {
		textroom: "join",
		transaction: transaction,
		room: roomid,
		username: 'bb_shidur_' + randomString(12),
		display: 'bb_shidur'
	};
	transactions[transaction] = function(response) {
		if (response["textroom"] === "error") {
      debugger;
			// Something went wrong
			bootbox.alert(response["error"]);
			return;
		}
		// We're in
		$('#datasend').removeAttr('disabled');
    addUser({ username: 'everyone', display: 'Everyone' });
		// Any participants already in?
		console.log("Participants:", response.participants);
    response.participants.forEach(function (p) {
      addUser(p);
    });
	};
  // Send join request
	textroom.data({
		text: JSON.stringify(register),
		error: function(reason) {
			bootbox.alert(reason);
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

function showMessage(user, text, to) {
  var toMsg = "";
  if (user == 'bb_shidur') {
    toMsg = to ? " (to " + to + ")" : " (to everyone)";
  }
  var datamsg = "<span style='color: #2fa4e7'>" + user + toMsg + "</span>" + " : " + text + "<br>";
	var logDiv = document.getElementById("datarecv");
	$('#datarecv').last().append(datamsg);
	logDiv.scrollTop = logDiv.scrollHeight;
	var visProp = getHiddenProp();
	if (document[visProp]) {
		notifyMe(user, text, false);
	}
}

function notifyMe(title, message, tout) {
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
                        requireInteraction: tout
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
		room: roomId,
		text: data
	};
  var to = getActiveUsername();
  if (to !== 'everyone') {
    message.to = to;
    showMessage('bb_shidur', data, to);
  }
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

