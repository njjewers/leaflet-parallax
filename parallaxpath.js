
L.ParallaxPolyline = L.Polyline.extend({
  options: {
    scaleFactor: 5000,
  },

  initialize: function (latlngs, options) {
    L.Util.setOptions(this, options);
    L.Polyline.prototype.initialize.call(this, latlngs, this.options);

    this.PPM_EQUATOR = [];
    console.log(this.options)
    this.setScaleFactor(this.options.scaleFactor);
  },

  onAdd: function (map) {
    L.Polyline.prototype.onAdd.call(this, map);

    this._moveHandler = this._reset.bind(this);

    this._map.on('move',this._moveHandler);
    this._map.on('zoom',this._moveHandler);
  },

  onRemove: function (map) {
    L.Polyline.prototype.onRemove.call(this, map);

    this._map.off('move',this._moveHandler);
    this._map.off('zoom',this._moveHandler);
  },

  // Precompute meter-per-pixel values
  setScaleFactor: function (sf) {
    for (var i=0; i<20; i++) {
      this.PPM_EQUATOR[i] = Math.pow(2, i+8)/6378137/sf;
    }
  },

  // override default projection function to our own ends
  _projectLatlngs: function (latlngs, result, projectedBounds) {
    var mapBounds = this._map.getPixelBounds();
    var origin = this._map.getPixelOrigin();

    var viewX = (mapBounds.min.x + mapBounds.max.x)/2 - origin.x;
    var viewY = mapBounds.max.y - origin.y;

    var zoom = this._map.getZoom();

    var flat = latlngs[0] instanceof L.LatLng,
        len = latlngs.length,
        i, ring;

    if (flat) {
      ring = [];
      for (i = 0; i < len; i++) {
        var latlng = latlngs[i];
        var point = ring[i] = this._map.latLngToLayerPoint(latlng);

        var altmod = latlng.alt * this.PPM_EQUATOR[zoom] / Math.cos(latlng.lat * Math.PI/180);

        point.x += (point.x - viewX) * altmod;
        point.y += (point.y - viewY) * altmod;

        projectedBounds.extend(point);
      }
      result.push(ring);
    } else {
      for (i = 0; i < len; i++) {
        this._projectLatlngs(latlngs[i], result, projectedBounds);
      }
    }
  }, 
});
