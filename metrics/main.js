/*global L, $, preprocessTimeline*/
var root = 'http://184.169.128.35:8080';
var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/devseed.07f51987/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q', {
//    maxZoom: 2,
    minZoom: 2
});

var map = L.map('map', { zoomControl: false })
    .addLayer(mapboxTiles)
    .setView([18.025966, -5], 2)
    .setMaxBounds([ [89, -180], [-89, 180] ]);

var geojsonLayer = L.geoJson().addTo(map);

var nextTimeline = [];
var currentTimeline = [];
var paused = false;
var progressBarWidth = 0;
var currentProgress = 0;

function reset () {
  $('#logroll').empty();
  $('#progress-bar').css('width', '0%');

  currentTimeline = nextTimeline;
  progressBarWidth = currentTimeline.length;
  currentTimeline.unshift('LAST');
  currentProgress = 0;
}

$.get(root + '/timeline', function (timeline) {
  nextTimeline = preprocessTimeline(timeline);
  fillLeaderboard('changes');
  reset();
  $('#spinner').hide();
  setInterval(function () {
    if (!paused) {
      render(currentTimeline.pop());
    }
  }, 3000);
});

function render (element) {
  if (element === 'LAST') {
    paused = true;
    setTimeout(function () {
      paused = false;
      $.get(root + '/timeline', function (timeline) {
        nextTimeline = preprocessTimeline(timeline);
        reset();
      });
    }, 3000);
    return;
  }

  var logroll = $('#logroll');

  var timecode = new Date(Date.parse(element.properties.created_at));
  var minutefix = timecode.getMinutes();

  if(minutefix < 10){
    minutefix = "0" + minutefix;
  };

  var date = timecode.getHours() + ':' + minutefix;  geojsonLayer.clearLayers();
  console.log(element);
  if (element.features.length) {
    geojsonLayer.addData(element);
  } else {
    var meta = element.properties;
    geojsonLayer.addData({
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[
          [meta.min_lon, meta.min_lat],
          [meta.max_lon, meta.min_lat],
          [meta.max_lon, meta.max_lat],
          [meta.min_lon, meta.max_lat],
          [meta.min_lon, meta.min_lat]
        ]]
      }
    });
  }
  map.fitBounds(geojsonLayer.getBounds(), {maxZoom: 16});
  $('#editor_name').empty();
  $('#editor_name').append('Contributions from <h1>' + element.properties.user + '</h1>');

  currentProgress += 1;
  $('#progress-bar').css('width', (100 * currentProgress / progressBarWidth) + '%');

  logroll.prepend('<div class="logroll-item"><i>' +
                  date + '</i> - ' +
                  element.properties.user + '</div>');

  if (logroll.children().length > 100) {
    $('#logroll div:last-child').remove();
  }
}

var fillEvery5 = setInterval(function () {
  fillLeaderboard('changes');
}, 5 * 60 * 1000);

function fillLeaderboard (hash) {
  $('#leaderboard').empty();
  $('#Total').empty();
  $.get(root + '/' + hash, function (data) {
    for (var i = 2; i < data.length; i += 2) {
      var rank = (i / 2);

      var username = data[i];
      if (data[i].length > 20) {
        username = username.substring(0, 17) + '...';
      }

      $('#leaderboard').append(
        '<li>' + rank + '.  ' + username + ' <i>' + data[i + 1] + '</i></li>'
      );
    }
    var total = 0;
    if (data.length) {
      total = data[1];
    }

    $('#Total').append(
      '<li>Total Contributions:<i> ' + total + '</i></li>'
    );
  });

  clearInterval(fillEvery5);
  fillEvery5 = setInterval(function () {
    fillLeaderboard(hash);
  }, 5 * 60 * 1000);
}

$('#Leaderboard-All').click(function () {
  fillLeaderboard('changes');
  return $('#leadertitletext').text('LEADERBOARDS');
});

$('#Leaderboard-Building').click(function () {
  fillLeaderboard('buildings');
  return $('#leadertitletext').text('BUILDINGS');
});

$('#Leaderboard-Roads').click(function () {
  fillLeaderboard('highways');
  return $('#leadertitletext').text('ROADS');
});

$('#Leaderboard-Rivers').click(function () {
  fillLeaderboard('waterways');
  return $('#leadertitletext').text('RIVERS');
});
