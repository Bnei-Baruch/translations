function StreamElementMuter(remoteStream, remoteId, rfindex) {
function getBufferAverage(analyser) {
	var array =  new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(array);
	var average = getAverageVolume(array);
	return average;
}

function getAverageVolume(array) {
	var values = 0;
	var average;
	var length = array.length;
	for (var i = 0; i < length; i++) {
		values += array[i];
	}
	average = values / length;
	return average;
}

	var analyser1;

	if (typeof AudioContext === 'function') {
        context = new AudioContext();
    } else if (typeof webkitAudioContext === 'function') {
        context = new webkitAudioContext(); 
    } else {
        alert('Sorry! Web Audio is not supported by this browser');
    }

	var source = context.createMediaStreamSource(remoteStream);
	console.log('Created Web Audio source from remote stream: ', source);
	analyser1 = context.createAnalyser();
	source.connect(analyser1);

	var sampleAudioMuting = function() {
		var average1 = getBufferAverage(analyser1);
		var chatid = getKey(remoteId);
		if (average1 > 0.1) {
		    //console.log("--:: Translator speaking:"+chatid);
			$('#rp'+chatid).css('background-color', '#a9e0b5');
		} else {
		    //console.log("--:: Translator NOT speaking:"+chatid);
			$('#rp'+chatid).css('background-color', 'white');
		}
	};
	t = setInterval(sampleAudioMuting, 50);
	tvals[rfindex] = t;

}

function getKey(value) {
    for( var prop in participants ) {
        if( participants.hasOwnProperty( prop ) ) {
             if( participants[ prop ] === value )
                 return prop;
        }
    }
}
