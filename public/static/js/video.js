function onYouTubePlayerReady(id) {
  var player = document.getElementsByTagName('object')[0];
  player.setPlaybackQuality('hd1080');
  player.playVideo();
  player.addEventListener("onStateChange", "onPlayerStateChange");
}

// Video in player ends
function onPlayerStateChange(data) {
  // Later I'll add code to callback to report video as watched here
  if (data === 0) {
    console.log("Reporting video watched");
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/video/' + videoSlug, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.addEventListener("loadend", function(e) {
      var data = JSON.parse(this.responseText);
      if (data && data.status === "okay") {
        console.log("reported watched video successfully");
      }
    }, false);

    xhr.send(JSON.stringify({
      videoSlug: videoSlug, 
    }));
  }
}
