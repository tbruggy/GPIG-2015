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
 * @require core/PossibleTargetPositions.js
 */

var agenttracker = Ext.extend(gpigf.plugins.Tool, {

  ptype: 'app_core_agenttracker',
  
  /** Initialization of the plugin */
  init: function(target) {
    agenttracker.superclass.init.apply(this, arguments);

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
          text: 'Draw Agent Path',
          control: new OpenLayers.Control.DrawFeature(
            this.layer, OpenLayers.Handler.Path, {
            eventListeners: {
              featureadded: function(evt) {
                this.queueFeatureAddition({ 
                  func: this.addAgentPath, 
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

  addAgentPath: function(polys, evt) {
    var line = evt.feature;
    
    // Remove the line that was drawn from the layer.
    this.layer.removeFeatures([line]);
    
    // Todo add a marker to the layer representing the agent's current position.
    // A pin perhaps, like the red pins seen on google maps.
  
    return this.wpsClient.getProcess(
      'local', 'gpigf:processAgentPath'
    ).configure({
      inputs: {
        target_areas: polys,
        agent_path: line,
        agent_vision: 10 * this.target.mapPanel.map.getResolution(),
      },
    }).output();
  },
  
  // TODO other plugins (e.g. communication plugins) may need this plugin to expose 
  // a list of current agents along with their details (name, position, etc)
});

Ext.preg(agenttracker.prototype.ptype, agenttracker);