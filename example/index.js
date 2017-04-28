// Basic bootstrap

var map;

window.addEventListener('load', function() {
  var center = [43.506906, -80.548722];

  map = L.map('container', {
    center: center,
    zoom: 17
  });

  map.addLayer(
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
  );

  var RADIUS = 100;
  var NPOINTS = 10000;
  var MAXHEIGHT = 50;
  var yd = 111111;
  var xd = 111111 * Math.cos(center[0]*Math.PI/180);

  var path = [];
  for (var i=0; i<NPOINTS; i++) {
    var angle = i*2*Math.PI/NPOINTS;
    path.push([
      center[0] + RADIUS*Math.sin(angle)/yd,
      center[1] + RADIUS*Math.cos(angle)/xd,
      MAXHEIGHT*(0.5 + 0.5*Math.cos((angle+Math.PI/3)*2))
    ]);
  }
  path.push(path[0]);

  map.addLayer(
    L.polyline(path, {color: 'black'})
  );

  map.addLayer(
    new L.ParallaxPolyline(path, {
      color: "red",
      smoothFactor: 0,
    })
  );
})
