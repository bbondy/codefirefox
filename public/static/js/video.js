define(['jsx!comment'], function() {

if (!useAmara) {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/player_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// !useAmara
function onYouTubePlayerAPIReady() {
  var player = new YT.Player('player', {
    width: '900',
    height: '506',
    videoId: youtubeid,
    events: {
      onReady: onIFramePlayerReady
    }
  });
}

function initPlayer(player) {
  player.playVideo();
  player.addEventListener("onStateChange", "onPlayerStateChange");
}

// !useAmara
function onIFramePlayerReady(event) {
  initPlayer(event.target);
}


// useAmara
function onYouTubePlayerReady(id) {
  var player = document.getElementsByTagName('object')[0];
  initPlayer(player);
}

// Video in player ends
function onPlayerStateChange(state) {

  // iframe API passes in an event with a data member
  // old embedded API that amara uses just passes in the data directly
  if (typeof state === 'object')
    state = state.data;

  // Later I'll add code to callback to report video as watched here
  if (state === 0) {
    console.log("Reporting video watched");
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/video/' + videoSlug, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.addEventListener("loadend", function(e) {
      var res = JSON.parse(this.responseText);
      if (res && res.status === "okay") {
        console.log("reported watched video successfully");
      }
    }, false);

    xhr.send(JSON.stringify({
      videoSlug: videoSlug, 
    }));
  }
}


return {
  onYouTubePlayerAPIReady: onYouTubePlayerAPIReady,
  onIFramePlayerReady: onIFramePlayerReady,
  onPlayerStateChange: onPlayerStateChange
}

});
