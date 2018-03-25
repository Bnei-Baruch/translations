var server = "https://v4g.kbb1.com/janusgxy";

var roomId = 9999;

var janus = null;
var mcutest = null;
var started = false;
var janusStream;

var myusername = "bb_shidur";
var rmusername = null;
var myid = null;
var mychatid = null;
var mystream = null;
var roomid = null;
var publisher_id = null;
var muted = false;

var feeds = [];
var supfeeds = [];
var bitrateTimer = [];
var pluginHandles = [];
var textroom = null;
var participants = {}
var transactions = {}

$(document).ready(function() {
	// Initialize the library (console debug enabled)
	Janus.init({ debug: true, callback: initPlugin });
});

function initPlugin() {
	// Create session
	janus = new Janus({
		server: server,
		iceServers: [{url: "stun:v4g.kbb1.com:3478"}],
		success: function() {
			attachChat();
		},
		error: function(error) {
			console.log(error);
			bootbox.alert(error, function() {
				window.location.reload();
			});
		},
		destroyed: function() {
			initPlugin();
		}
	});
}

function publishOwnFeed(useAudio) {
	// Publish our stream
	$('#publish').attr('disabled', true).unbind('click');
	mcutest.createOffer(
		{
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

function checkEnter(event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		sendData();
		return false;
	} else {
		return true;
	}
}

