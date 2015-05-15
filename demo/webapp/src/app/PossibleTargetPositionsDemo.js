/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Handler/Polygon.js
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
                // Action for drawing the possible target position area
                new GeoExt.Action(Ext.apply({
                    text: 'Draw Possible Target Area',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon, {
                        eventListeners: {
                            featureadded: this.growPolygon,
                            scope: this
                        }
                    })
                }, actionDefaults))
            ]);
        }, this);
    },
    
    /** Last polygon used to show the growing area */
    lastPolygon: null,
    /** Distance to grow the polygon by each interval */
    growthDistance: 50,
    /** Time between each growth interval */
    growthSpeed: 5000,
    /** Number of quadrants to use when rounding corners, low number means no smoothing */
    growthSegments: 5,
    /** Interval contianing method to execute at each growth */
    growthInterval: null,
    
    /** Function grows a polygon by a set amount over the course of time. */
    growPolygon: function(evt) {
        var self = this;
        
        clearInterval(this.growthInterval);
        this.lastPolygon = evt.feature;
        this.growthInterval = setInterval(function() {
            self.wpsClient.execute({
                server: 'local',
                process: 'gpigf:processTargetPositions',
                inputs: { 
                    current_area: self.lastPolygon, 
                    growth_distance: self.growthDistance, 
                    growth_segments: self.growthSegments 
                },
                success: self.addPolygon,
                scope: self
            });
        }, this.growthSpeed);
    },
    
    /** Helper function for adding process results to the vector layer */
    addPolygon: function(outputs) {
        this.layer.addFeatures(outputs.result);
        
        // if it exists, remove the last polygon drawn
        if (this.lastPolygon != undefined) {
            this.layer.removeFeatures(this.lastPolygon);   
        }
        
        this.lastPolygon = outputs.result;
    }

});

Ext.preg(Demo.prototype.ptype, Demo);