/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 */

var WPSDemo = Ext.extend(gxp.plugins.Tool, {

    ptype: 'app_wpsdemo',
    
    /** Initialization of the plugin */
    init: function(target) {
        WPSDemo.superclass.init.apply(this, arguments);

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
                    text: 'Draw',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon,{
                            eventListeners: {
                            featureadded: this.polygonAdded,
                            scope: this
                        }
                    })
                }, actionDefaults)),

                new GeoExt.Action(Ext.apply({
                    text: 'Grow Attractor',
                    control: new OpenLayers.Control.Button({
                    displayClass: "demo", trigger: OpenLayers.Function.bind(this.grow,this)
                    })
                }, actionDefaults)),

                // Action for dragging existing geometries
                new GeoExt.Action(Ext.apply({
                    text: 'Drag',
                    control: new OpenLayers.Control.DragFeature(this.layer)
                }, actionDefaults)),
                // Action for splitting by drawing a line
                new GeoExt.Action(Ext.apply({
                    text: 'Place Attractor',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.addAttractor,
                            scope: this
                        }
                    })
                }, actionDefaults)),

                new GeoExt.Action(Ext.apply({
                    text: 'Place Deterrant',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.addDeterrant,
                            scope: this
                        }
                    })
                }, actionDefaults)),

                // Action for intersection+buffer by drawing a line
                new GeoExt.Action(Ext.apply({
                    text: 'Grow',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer,OpenLayers.Handler.Path, {
                        eventListeners: {
                            featureadded: this.grow,
                            scope: this
                        }
                    })
                }, actionDefaults))
            ]);
        }, this);
    },

    targetPolygon: null,
    /** Save the initial target area */
    polygonAdded: function(evt) {
        targetPolygon = evt.feature;
    },


    /** Add attractor point */
    addAttractor: function(evt) {
        var line = evt.feature;
        var poly = targetPolygon;
        this.layer.removeFeatures(line);
             this.wpsClient.execute({
                        server: 'local',
                        process: 'custom:addAttractor',
                        inputs: { polygon: poly, line: line },
                        success: this.addNewResult,
                        scope: this
                    });
    },

    /** Grow Atractors */
    grow: function(evt) {
        this.wpsClient.execute({
                        server: 'local',
                        process: 'custom:growShape',
                        inputs: {shape: targetAttractor},
                        success: this.addGrowResult,
                        scope: this
                    });
    },

    /** Handler function for splitting geometries */
    addDeterrant: function(evt) {
        var line = evt.feature;
        var poly = targetPolygon;
             this.wpsClient.execute({
                        server: 'local',
                        process: 'custom:addDeterrant',
                        inputs: { polygon: poly, line: line },
                        success: this.addResult,
                        scope: this
                    });


    },
    /** Add the result from a deterrant */
    addResult: function(outputs) {
        targetPolygon = outputs.result[0];
        this.layer.removeAllFeatures();
        this.layer.addFeatures(outputs.result);
        this.layer.addFeatures(targetAttractor);
    },

    targetAttractor: null,
    /** Add the result from the addition of an attractor */
    addNewResult: function(outputs) {
        targetAttractor = outputs.result[0];
        this.layer.addFeatures(outputs.result);
    },

    /** Add the result from the growth*/
    addGrowResult: function(outputs) {
        this.layer.removeFeatures(targetAttractor);
        this.layer.addFeatures(outputs.result);
        targetAttractor = outputs.result[0];
    },

});

Ext.preg(WPSDemo.prototype.ptype, WPSDemo);
