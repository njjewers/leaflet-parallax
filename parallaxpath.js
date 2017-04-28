"use strict";

L.ParallaxContext = L.Class.extend({
  options: {
    scaleFactor: 5000,
  },

  initialize: function(map, options) {
    L.Util.setOptions(this, options);

    // Pre-bind event handlers
    this._zoomHandler = this._zoomHandler.bind(this);
    this._moveHandler = this._moveHandler.bind(this);

    // Initialization
    this._parallaxLayers = {};

    this.setMap(map);
    this._updatePixelScale();
    this._updateParallaxLayers();
  },

  setMap: function(map) {
    if (this._map) {
      this._removeMapListeners(this._map);
    }

    if (!map) {
      throw new TypeError("ParallaxContext initialized without a map");
    }

    this._map = map;

    map.on('move',this._moveHandler);
    map.on('zoom',this._zoomHandler);
  },

  _removeMapListeners: function(map) {
    map.off('move',this._moveHandler);
    map.off('zoom',this._zoomHandler);
  },

  // Setters
  setScaleFactor: function(scaleFactor) {
    this.options.scaleFactor = scaleFactor;

    this._updatePixelScale();
  },

  // Adding/removing layers
  _addLayer: function(layer) {
    this._parallaxLayers[L.Util.stamp(layer)] = layer;
  },

  _removeLayer: function(layer) {
    delete this._parallaxLayers[L.Util.stamp(layer)];
  },

  // Other private methods
  _updatePixelScale: function(scaleFactor) {
    this.PPM_EQUATOR = Math.pow(2, this._map.getZoom()+8)/6378137/this.options.scaleFactor;
  },

  _zoomHandler: function() {
    this._updatePixelScale();
    this._updateParallaxLayers();
  },

  _moveHandler: function() {
    this._updateParallaxLayers();
  },

  _updateParallaxLayers: function() {
    var mapBounds = this._map.getPixelBounds();
    var origin = this._map.getPixelOrigin();

    this.viewX = (mapBounds.min.x + mapBounds.max.x)/2 - origin.x;
    this.viewY = mapBounds.max.y - origin.y;

    for (var i in this._parallaxLayers) {
      this._parallaxLayers[i]._reset();
    }
  },

  projectLatLng: function(latlng) {
    var point = this._map.latLngToLayerPoint(latlng);
    var altmod = latlng.alt * this.PPM_EQUATOR / Math.cos(latlng.lat * Math.PI/180);

    point.x += (point.x - this.viewX) * altmod;
    point.y += (point.y - this.viewY) * altmod;

    return point;
  },
});

var HasParallaxContextMixin = {
  setParallaxContext: function(parallaxContext) {
    if (this._parallaxContext) {
      this._parallaxContext._removeLayer(this);
    }

    this._parallaxContext = parallaxContext;
    this._parallaxContext._addLayer(this);
  },
};

L.ParallaxPolyline = L.Polyline.extend({
  includes: HasParallaxContextMixin,

  initialize: function (latlngs, parallaxContext, options) {
    L.Util.setOptions(this, options);

    this.setParallaxContext(parallaxContext);

    L.Polyline.prototype.initialize.call(this, latlngs, this.options);
  },

  onAdd: function(map) {
    L.Polyline.prototype.onAdd.call(this, map);

    this._parallaxContext._addLayer(this);
  },

  onRemove: function(map) {
    L.Polyline.prototype.onRemove.call(this, map);

    this._parallaxContext._removeLayer(this);
  },

  
  // override default projection function to our own ends
  _projectLatlngs: function (latlngs, result, projectedBounds) {

    var flat = latlngs[0] instanceof L.LatLng,
        len = latlngs.length,
        i, ring;

    if (flat) {
      ring = [];
      for (i = 0; i < len; i++) {
        var point = ring[i] = this._parallaxContext.projectLatLng(latlngs[i]);

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
