var janusStream;
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

$(document).on('click', '#makorlist li a', function () {
	console.log("Selected Option:"+$(this).text());
	makor = Number($(this).attr("id"));
	localStorage.makor = makor;
	localStorage.makortext = $(this).text();
	console.log("  -- Selected Makor: " + makor);
	$('#makor').removeClass('hide').html("Source: " + $(this).text()).show();
	if(myusername != undefined && myusername != null) {
		attachStreamingHandle(makor, '#remoteAudio');
	}
});

if(makor != undefined && makor != null) {
	$('#makor').removeClass('hide').html("Source: " + localStorage.makortext).show();
}

function toggleVideo() {
        vstatus = document.getElementById('togglevideo').value;
        if(vstatus == "Off"){
                document.getElementById("togglevideo").value="On";
		$('#togglevideo').removeClass('btn-warning');
		$('#togglevideo').addClass('btn-success');
		$('#togglevideo').html("Video ON").show();
		console.log("Video is ON");
		attachStreamingHandle(11, '#remoteVideo');
        } else {
                document.getElementById("togglevideo").value="Off";
		$('#togglevideo').removeClass('btn-success');
		$('#togglevideo').addClass('btn-warning');
		$('#togglevideo').html("Video OFF").show();
		console.log("Video is OFF");
		var body = { "request": "stop" };
                srcvideo.send({"message": body});
                srcvideo.hangup();
        }
}

function attachStreamingHandle(streamId, mediaElementSelector) {
        var streaming;
	// Detach previos handle if any (Yeah it's look ugly)
        var body = { "request": "stop" };
        if(mediaElementSelector === '#remoteVideo' && srcvideo !== undefined && srcvideo !== null) {
		srcvideo.send({"message": body});
		srcvideo.hangup();
        }
	if (mediaElementSelector === '#remoteAudio' && srcaudio !== undefined && srcaudio !== null) {
		srcaudio.send({"message": body});
		srcaudio.hangup();
        }
	if (mediaElementSelector === '#transAudio' && trlaudio !== undefined && trlaudio !== null) {
		trlaudio.send({"message": body});
		trlaudio.hangup();
        }
	
        janus.attach({
            plugin: "janus.plugin.streaming",
            success: function(pluginHandle) {
                streaming = pluginHandle;

		// We need to remember where audio and where video handle 
		if(mediaElementSelector === '#remoteVideo'){
                        srcvideo = streaming;
                } else if(mediaElementSelector === '#remoteAudio')  {
                        srcaudio = streaming;
                } else if(mediaElementSelector === '#transAudio')  {
                        trlaudio = streaming;
                }

                pluginHandles.push(streaming);

                // Play stream
                var body = { "request": "watch", id: streamId };
                streaming.send({"message": body});
            },
            error: function(error) {
                displayError("Error attaching plugin: " + error);
            },
            onmessage: function (msg, jsep) {
                onStreamingMessage(streaming, msg, jsep);
            },
            onremotestream: function(stream) {
                console.debug("Got a remote stream!", stream);
                attachMediaStream($(mediaElementSelector).get(0), stream);
                janusStream = stream;
            },
            oncleanup: function() {
                console.debug("Got a cleanup notification");
            }
        });
}

$(window).unload(function () {
            pluginHandles.forEach(function (handle) {
                var body = { "request": "stop" };
                handle.send({"message": body});
                handle.hangup();
            });

            janus.destroy();
});

function onStreamingMessage(handle, msg, jsep) {
        console.debug("Got a message", msg);

        var result = msg.result;

        if(jsep !== undefined && jsep !== null) {
            console.debug("Handling SDP as well...", jsep);

            // Answer
            handle.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
                success: function(jsep) {
                    console.log("Got SDP!");
                    console.log(jsep);
                    var body = { "request": "start" };
                    handle.send({"message": body, "jsep": jsep});
                },
                error: function(error) {
                    displayError("WebRTC error: " + error);
                }
            });
        }
}

