// Load the iframe player API async
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Create a youtube iframe after the API code downloads
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '506',
    width: '900',
    videoId: youtubeid,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// Video player is ready
function onPlayerReady(event) {
  player.setPlaybackQuality('hd1080');
  event.target.playVideo();
}

// Video in player ends
function onPlayerStateChange(event) {
  // Later I'll add code to callback to report video as watched here
  if (event.data === 0) {
  }
}
