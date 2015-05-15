/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/SelectFeature.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 */

var Demo = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_demo',
    
    /** Initialization of the plugin */
    init: function(target) {
        Demo.superclass.init.apply(this, arguments);

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
                // Action for drawing new geometreis
                new GeoExt.Action(Ext.apply({
                    text: 'Draw Target Area',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon
                    )
                }, actionDefaults)),
                // Action for growing a selected area
                new GeoExt.Action(Ext.apply({
                    text: 'Grow Area',
                    control: new OpenLayers.Control.SelectFeature(
                        this.layer,
                        {
                          clickout: true, toggle: false,
                          multiple: false, hover: false,
                          toggleKey: "ctrlKey", // ctrl key removes from selection
                          multipleKey: "shiftKey", // shift key adds to selection
                          box: true,
                          eventListeners: {
                              featurehighlighted: this.growSelected,
                              scope: this
                          }
                        }
                    )
                }, actionDefaults)),
                // Action for growing a selected area
                new GeoExt.Action(Ext.apply({
                    text: 'Shrink Area',
                    control: new OpenLayers.Control.SelectFeature(
                        this.layer,
                        {
                          clickout: true, toggle: false,
                          multiple: false, hover: false,
                          toggleKey: "ctrlKey", // ctrl key removes from selection
                          multipleKey: "shiftKey", // shift key adds to selection
                          box: true,
                          eventListeners: {
                              featurehighlighted: this.shrinkSelected,
                              scope: this
                          }
                        }
                    )
                }, actionDefaults))
            ]);
        }, this);
    },
    
    growSelected: function(evt) {
        var poly = evt.feature;
        this.wpsClient.execute({
            server: 'local',
            process: 'JTS:buffer',
            inputs: {
                geom: poly,
                distance: 10 * this.target.mapPanel.map.getResolution(),
            },
            success: this.addResult,
            scope: this
        });
        this.layer.removeFeatures([poly]);  // Remove this line for psuedo-heatmap styling!
    },
    
    shrinkSelected: function(evt) {
        var poly = evt.feature;
        this.wpsClient.execute({
            server: 'local',
            process: 'JTS:buffer',
            inputs: {
                geom: poly,
                distance: -10 * this.target.mapPanel.map.getResolution(),
            },
            success: this.addResult,
            scope: this
        });
        this.layer.removeFeatures([poly]);
    },

    /** Helper function for adding process results to the vector layer */
    addResult: function(outputs) {
        this.layer.addFeatures(outputs.result);
    }

});

Ext.preg(Demo.prototype.ptype, Demo);