var server = null;
var srv = "v4g.kbb1.com";
if(window.location.protocol === 'http:')
	window.location = "https://" + srv + "/trlchat"; 
        //server = "http://" + srv + ":8088/janus";
else
        server = "https://" + srv + ":8889/janus";

var janus = null;
var mcutest = null;
var textroom = null;
var started = false;
var janusStream;
var datalive = null;
var myusername = null;
var rmusername = null;
var mydisplayname = null;
var myid = null;
var mychatid = null;
var mystream = null;

var lang;

var feeds = [];
var trlFeeds = [];
var pluginHandles = [];
var participants = {};
var transactions = {};
var moderators = {};

if(localStorage.translate) {
	console.log("  -- Storage Translate: " + localStorage.translate);
	console.log("  -- Storage Video Text: " + localStorage.translatetext);
	var translate = Number(localStorage.translate);
	lang = localStorage.translatetext;
	room = Number("1"+translate+"0");
} else {
        var translate = null;
}

$(document).on('click', '#translatelist li a', function () {
        console.log("Selected Option:"+$(this).text());
        translate = Number($(this).attr("id"));
        room = Number("1"+translate+"0");
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
		$('#translate').removeClass('hide').html("Translate: " + localStorage.translatetext).show();
	}
	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}
	Janus.init({ debug: true, callback: function() {
		$('#start').click(initPlugins);
		}
	});
});

function initPlugins() {
	if(started)
		return;
	started = true;
	$(this).attr('disabled', true).unbind('click');
	janus = new Janus({
		server: server,
		iceServers: [{url: "stun:v4g.kbb1.com:3478"}],
		success: function() {
			attachChat();
			$('#support').click(supportReq);
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
}

