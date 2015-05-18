/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 *
 * @require gpigf/Tool.js
 */

var attractors = Ext.extend(gpigf.plugins.Tool, {

  ptype: 'app_opt_attactors',
  
  /** Initialization of the plugin */
  init: function(target) {
    attractors.superclass.init.apply(this, arguments);

    // Create a WPSClient instance for use with the local GeoServer
    this.wpsClient = new OpenLayers.WPSClient({
      servers: {
        local: '/geoserver/wps'
      }
    });

    // Add action buttons when the viewer is ready
    target.on('ready', function() {
      // Get a reference to the vector layer from app.js
      this.layer = target.getLayerRecordFromMap({
        name: 'sketch',
        source: 'ol'
      }).getLayer();
      // Some defaults
      var actionDefaults = {
        map: target.mapPanel.map,
        enableToggle: true,
        toggleGroup: this.ptype,
        allowDepress: true
      };
      this.addActions([
        new GeoExt.Action(Ext.apply({
          text: 'Place Attractor',
          control: new OpenLayers.Control.DrawFeature(
            this.layer, OpenLayers.Handler.Point, {
            eventListeners: {
              featureadded: function(evt) {
                this.queueFeatureAddition({ 
                  func: this.addAttractor, 
                  scope: this,
                  data: evt
                });
              },
              scope: this
            }
          })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Place Deterrent',
          control: new OpenLayers.Control.DrawFeature(
            this.layer, OpenLayers.Handler.Point, {
            eventListeners: {
              featureadded: function(evt) {
                this.queueFeatureAddition({ 
                  func: this.addDeterrent, 
                  scope: this,
                  data: evt
                });
              },
              scope: this
            }
          })
        }, actionDefaults))
      ]);
    }, this);
  },

  addAttractor: function(polys, evt) {
    var point = evt.feature;
  
    return this.wpsClient.getProcess(
      'local', 'gpigf:processAttractorPoint'
    ).configure({
      inputs: {
        target_areas: polys,
        attractor_point: point,
        attractor_radius: 2000,
        attractor_scale: 10 * this.target.mapPanel.map.getResolution(),
      }
    }).output();
  },

  addDeterrent: function(polys, evt) {
    var point = evt.feature;
  
    return this.wpsClient.getProcess(
      'local', 'gpigf:processDeterrentPoint'
    ).configure({
      inputs: {
        target_areas: polys,
        deterrent_point: point,
        deterrent_radius: 2000,
        deterrent_scale: 10 * this.target.mapPanel.map.getResolution(),
      }
    }).output();
  },
});

Ext.preg(attractors.prototype.ptype, attractors);