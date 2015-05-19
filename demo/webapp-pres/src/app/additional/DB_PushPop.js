/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/SelectFeature.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 *
 * @require gpigf/Tool.js
 */

var attractors = Ext.extend(gpigf.plugins.Tool, {

  ptype: 'app_db_pushpop',
  
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
          text: '| Draw Poly',
          control: new OpenLayers.Control.DrawFeature(
            this.layer, OpenLayers.Handler.Polygon, {
            eventListeners: {
            }
          })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Push',
          control: new OpenLayers.Control.SelectFeature(
            this.layer,
            {
              clickout: true, toggle: false,
              multiple: false, hover: false,
              toggleKey: "ctrlKey", // ctrl key removes from selection
              multipleKey: "shiftKey", // shift key adds to selection
              box: true,
              eventListeners: {
                  featurehighlighted: this.pushSelected,
                  scope: this
              }
            }
          )
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Pop',
          control: new OpenLayers.Control.SelectFeature(
            this.layer,
            {
              clickout: true, toggle: false,
              multiple: false, hover: false,
              toggleKey: "ctrlKey", // ctrl key removes from selection
              multipleKey: "shiftKey", // shift key adds to selection
              box: true,
              eventListeners: {
                  featurehighlighted: this.popSelected,
                  scope: this
              }
            }
          )
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Delete',
          control: new OpenLayers.Control.SelectFeature(
            this.layer,
            {
              clickout: true, toggle: false,
              multiple: false, hover: false,
              toggleKey: "ctrlKey", // ctrl key removes from selection
              multipleKey: "shiftKey", // shift key adds to selection
              box: true,
              eventListeners: {
                  featurehighlighted: this.deleteSelected,
                  scope: this
              }
            }
          )
        }, actionDefaults))
      ]);
    }, this);
  },
  
  pushSelected: function(evt) {
      var poly = evt.feature;
      this.wpsClient.execute({
          server: 'local',
          process: 'gpigf:push',
          inputs: {
              target_areas: poly,
          },
          success: this.pushedResult,
          scope: this
      });
  },
  
  popSelected: function(evt) {
      var poly = evt.feature;
      this.wpsClient.execute({
          server: 'local',
          process: 'gpigf:pop',
          inputs: {
              target_areas: poly,
          },
          success: this.poppedResult,
          scope: this
      });
  },
  
  deleteSelected: function(evt) {
      var poly = evt.feature;
      this.layer.removeFeatures([poly]);
  },
  
  pushedResult: function(outputs) {
  },
  
  poppedResult: function(outputs) {
    if (outputs.result == undefined) {
      console.log("undefined from pop");
      return;
    }
    
    this.layer.addFeatures(outputs.result);
  }
});

Ext.preg(attractors.prototype.ptype, attractors);