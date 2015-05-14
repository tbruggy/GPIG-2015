/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
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
                // Action for splitting by drawing a line
                new GeoExt.Action(Ext.apply({
                    text: 'Draw Agent Path',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.agentPath,   // or this.agentPath2
                            scope: this
                        }
                    })
                }, actionDefaults))
            ]);
        }, this);
    },

    /** Implemented by with gpigf service - only 1 service request **/
    agentPath: function(evt) {
        var line = evt.feature;
        var poly;
        for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
            if (poly !== line && line.geometry.intersects(poly.geometry)) {
                this.wpsClient.execute({
                    server: 'local',
                    process: 'gpigf:processAgentPath',
                    inputs: {
                        target_area: poly,
                        agent_path: line,
                        agent_vision: 10 * this.target.mapPanel.map.getResolution(),
                    },
                    success: this.addResult,
                    scope: this
                });
                this.layer.removeFeatures([poly]);
            }
        }
        this.layer.removeFeatures([line]); 
    },

    /** Implemented by reusing current JTS services - requires 2 service requests **/
    agentPath2: function(evt) {
        var line = evt.feature;                         // This is the line that was drawn by the tool, representing the agent's path
        var poly;
        for (var i=this.layer.features.length-1; i>=0; --i) {
            poly = this.layer.features[i];
            if (poly !== line && line.geometry.intersects(poly.geometry)) {
                this.wpsClient.execute({
                    server: 'local',
                    process: 'JTS:difference',          // Subtracts polygon b from a
                    inputs: {
                        a:
                            poly,
                        b:
                            this.wpsClient.getProcess(
                                'local', 'JTS:buffer'   // Applies 'padding space' to a line or polygon
                            ).configure({
                                inputs: { distance: 10 * this.target.mapPanel.map.getResolution(), geom: line }
                            }).output()
                    },
                    success: this.addResult,            // The returned polygon is the new polygon from b minus a, this new polygon gets added to the layer
                    scope: this
                });
                this.layer.removeFeatures([poly]);      // Remove the old polygon, aka 'a'. Comment this line out and see what happens!
            }
        }
        this.layer.removeFeatures([line]);              // Remove the agents line/path feature. Comment this line out and see what happens!
    },

    /** Helper function for adding process results to the vector layer */
    addResult: function(outputs) {
        this.layer.addFeatures(outputs.result);
    }

});

Ext.preg(Demo.prototype.ptype, Demo);