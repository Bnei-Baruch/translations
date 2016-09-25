var mixer = null;
var spinner = null;
var mymixid;
var webrtcUp = false;
var audioenabled = false;


function attachAudio() {
	janus.attach({ plugin: "janus.plugin.audiobridge",
	success: function(pluginHandle) {
		$('#details').remove();
		mixer = pluginHandle;
		Janus.log("Plugin attached! (" + mixer.getPlugin() + ", id=" + mixer.getId() + ")");
		registerUsername();
		$('#start').removeAttr('disabled').html("Disconnect")
			.click(function() {
				$(this).attr('disabled', true);
				janus.destroy();
			});
	},
	error: function(error) {
		Janus.error("  -- Error attaching plugin...", error);
		bootbox.alert("Error attaching plugin... " + error);
	},
	onmessage: function(msg, jsep) {
		Janus.debug(" ::: Got a message :::");
		Janus.debug(JSON.stringify(msg));
		var event = msg["audiobridge"];
		Janus.debug("Event: " + event);
		if(event != undefined && event != null) {
			if(event === "joined") {
				// Successfully joined, negotiate WebRTC now
				mymixid = msg["id"];
				Janus.log("Successfully joined room " + msg["room"] + " with ID " + mymixid);
				if(!webrtcUp) {
					webrtcUp = true;
					// Publish our stream
					mixer.createOffer(
						{
							media: { video: false},	// This is an audio only room
							success: function(jsep) {
								Janus.debug("Got SDP!");
								Janus.debug(jsep);
								var publish = { "request": "configure", "muted": true };
								mixer.send({"message": publish, "jsep": jsep});
							},
							error: function(error) {
								Janus.error("WebRTC error:", error);
								bootbox.alert("WebRTC error... " + JSON.stringify(error));
							}
						});
				}
				// Any room participant?
				if(msg["participants"] !== undefined && msg["participants"] !== null) {
					var list = msg["participants"];
					Janus.debug("Got a list of participants:");
					Janus.debug(list);
					for(var f in list) {
						var id = list[f]["id"];
						var display = list[f]["display"];
						var muted = list[f]["muted"];
						Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
						if($('#rp'+id).length === 0 && display !== "bb_shidur") {
							// Add to the participants list
							$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display.split("_")[0]+'</li>');
						}
						if(muted === true || muted === "true") {
							$('#rp'+id).css('background-color', 'white');
						} else {
							$('#rp'+id).css('background-color', '#a9e0b5');
						}
					}
				}
			} else if(event === "roomchanged") {
				// The user switched to a different room
				mymixid = msg["id"];
				Janus.log("Moved to room " + msg["room"] + ", new ID: " + mymixid);
				// Any room participant?
				$('#list').empty();
				if(msg["participants"] !== undefined && msg["participants"] !== null) {
					var list = msg["participants"];
					Janus.debug("Got a list of participants:");
					Janus.debug(list);
					for(var f in list) {
						var id = list[f]["id"];
						var display = list[f]["display"];
						var muted = list[f]["muted"];
						Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
						if($('#rp'+id).length === 0 && display !== "bb_shidur") {
							// Add to the participants list
							$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display.split("_")[0]+'</li>');
						}
						if(muted === true || muted === "true") {
                                                        $('#rp'+id).css('background-color', 'white');
                                                } else {
                                                        $('#rp'+id).css('background-color', '#a9e0b5');
                                                }
					}
				}
			} else if(event === "destroyed") {
				// The room has been destroyed
				Janus.warn("The room has been destroyed!");
				bootbox.alert("The room has been destroyed", function() {
					window.location.reload();
				});
			} else if(event === "event") {
				if(msg["participants"] !== undefined && msg["participants"] !== null) {
					var list = msg["participants"];
					Janus.debug("Got a list of participants:");
					Janus.debug(list);
					for(var f in list) {
						var id = list[f]["id"];
						var display = list[f]["display"];
						var muted = list[f]["muted"];
						Janus.debug("  >> [" + id + "] " + display + " (muted=" + muted + ")");
						if($('#rp'+id).length === 0) {
							// Add to the participants list
							//$('#list').append('<li id="rp'+id+'" class="list-group-item">'+display.split("_")[0]+'</li>');
							//$('#rp'+id + ' > i').hide();
						}
						if(muted === true || muted === "true") {
                                                        $('#rp'+id).css('background-color', 'white');
                                                } else {
                                                        $('#rp'+id).css('background-color', '#a9e0b5');
                                                }
					}
				} else if(msg["error"] !== undefined && msg["error"] !== null) {
					bootbox.alert(msg["error"]);
					return;
				}
				// Any new feed to attach to?
				if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
					// One of the participants has gone away?
					var leaving = msg["leaving"];
					Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
					$('#rp'+leaving).remove();
				}
			}
		}
		if(jsep !== undefined && jsep !== null) {
			Janus.debug("Handling SDP as well...");
			Janus.debug(jsep);
			mixer.handleRemoteJsep({jsep: jsep});
		}
	},
	onlocalstream: function(stream) {
		Janus.debug(" ::: Got a local stream :::");
		Janus.debug(JSON.stringify(stream));
		// We're not going to attach the local audio stream
		$('#audiojoin').hide();
		$('#room').removeClass('hide').show();
		$('#participant').removeClass('hide').html(myusername).show();
		// Lets try
		$('#input').hide();
		$('#videojoin').hide();
		$('#videos').removeClass('hide').show();
		$('#micpanel').removeClass('hide').show();
		$('#publisher').removeClass('hide').html(mydisplayname).show();
		$('#makor').html("Source: " + localStorage.makortext).show();
		$('#translate').addClass('disabled');
		$('#devices').addClass('disabled');
		$('#srcaudpanel').removeClass('hide').html(localStorage.makortext).show();
		$('#trlaudpanel').removeClass('hide').html(localStorage.translatetext).show();
		attachStreamingHandle(makor, '#remoteAudio');
		attachStreamingHandle(translate, '#mixAudio');
		$('#togglevideo').click(toggleVideo);
	},
	onremotestream: function(stream) {
		$('#room').removeClass('hide').show();
		if($('#roomaudio').length === 0) {
			$('#mixedaudio').append('<audio class="rounded centered" id="roomaudio" width="100%" height="100%" autoplay/>');
		}
		attachMediaStream($('#transAudio').get(0), stream);
		listFwmix();
		// Mute button
		//audioenabled = true;
		$('#mute').click(
			function() {
				audioenabled = !audioenabled;
				if(audioenabled)
					$('#mute').removeClass('btn-danger').addClass('btn-success').html("ON&nbsp;").show();
				else
					$('#mute').removeClass('btn-success').addClass('btn-danger').html("OFF").show();
				mixer.send({message: { "request": "configure", "muted": !audioenabled }});
			}).removeClass('hide').show();

	},
	oncleanup: function() {
		webrtcUp = false;
		Janus.log(" ::: Got a cleanup notification :::");
		$('#participant').empty().hide();
		$('#list').empty();
		$('#mixedaudio').empty();
		$('#room').hide();
	}
});
}

function toggleMute() {
        astatus = document.getElementById('mute').value;
        if(astatus == "On") {
                document.getElementById("mute").value="On";
                $('#mute').removeClass('btn-success');
                $('#mute').addClass('btn-danger');
                $('#mute').html("OFF").show();
                console.log("Audio is ON");
        } else {
                document.getElementById("mute").value="Off";
                $('#mute').removeClass('btn-danger');
                $('#mute').addClass('btn-success');
                $('#mute').html("ON&nbsp;").show();
                console.log("Audio is OFF");
        }
}

function setaudioUsername() {
		var register = { "request": "join", "room": myroom, "display": username };
		mixer.send({"message": register});
}

function startFwmix() {
        var forward = { "request": "rtp_forward","room":room,"ptype":111,"secret":"adminpwd","host":ip,"port":mixport };
        mixer.send({"message": forward,
	      success: function(data) {
			stream_id = data["stream_id"];
			console.log("  -- We got rtp forward stream ID: " + stream_id);
			console.log(JSON.stringify(data));
		},
	});
}

function listFwmix() {
	var listfw = { "request" : "listforwarders", "room" : room, "secret": "adminpwd"}
	mixer.send({"message": listfw,
              success: function(data) {
			if(data["rtp_forwarders"].length > 0) {
				console.log("-- Got mix forward: id - " +  data["rtp_forwarders"][0]["stream_id"] + " ip - " + data["rtp_forwarders"][0]["ip"] + " port - " + data["rtp_forwarders"][0]["port"])	
			} else {
				startFwmix();
			}
                },
        });
}
