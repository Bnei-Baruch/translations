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

//var ip = "10.66.23.104";
var ip = "10.66.23.104";
var localport = null;
var remoteport = null;
var aport = 8002;
var vport = 9884;
var room = 1000;

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
        // attachHandle();
        // autoRefreshChat();
      },
      error: function(error) {
        console.log(error);
        bootbox.alert(error, function() {
          window.location.reload();
        });
      },
      destroyed: function() {
        initPlugin();
        //window.location.reload();
      }
  });
}




function getListener(id, display) {
  var dparse = display.split("_");
  var displayname = dparse[0];
  var userstatus = dparse[1];
  // Chek who enter to room
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

function unpublishOwnFeed() {
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
        var listen = { "request": "join", "room": roomid, "ptype": "listener", "feed": id };
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
                remoteFeed.rfindex = i;
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
                var body = { "request": "start", "room": roomid };
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
        // Setup audio elemnt
        trlAudio = document.createElement('audio');
        trlAudio.setAttribute('id', 'a'+remoteFeed.rfid);
        trlAudio.setAttribute('class', 'trldAudio');
        //trlAudio.setAttribute('controls', 'yes');
        trlAudio.setAttribute('autoplay', 'yes');
        document.body.appendChild(trlAudio);
        trlAudio.volume = trlaud.volume;
        trlAudio.muted = trlaud.muted;
        attachMediaStream($('#a'+remoteFeed.rfid).get(0), stream);
        $('#trl2panel').removeClass('hide').show();
        $('#datain').removeClass('hide').show();
        $('#dataout').removeClass('hide').show();
      },
      ondataopen: function(data) {
        Janus.log("The DataChannel is available!");
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
            $('#rp'+dataparse[1]).css('background-color', 'white');
          }
          if(dataparse[2] === "On") {
            Janus.debug(" -- User ID: " + dataparse[1] + " mic is open!");
            $('#rp'+dataparse[1]).css('background-color', '#a9e0b5');

          }
        }
        if(dataparse[0] === "support") {
          Janus.debug(" -- Translator: " + dataparse[1] + " from: " + dataparse[2] + " need support!");
        }
      },
      oncleanup: function() {
        console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
        //$('#waitingvideo'+remoteFeed.rfindex).remove();
        //$('#datasend').attr('disabled', true);
      }
    });
}

