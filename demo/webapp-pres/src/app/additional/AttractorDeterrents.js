/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 */

var WPSDemo = Ext.extend(gpigf.plugins.Tool, {

    ptype: 'app_attractor_deterrants',
    
    registered: false,
    attractors : [],
    detterants : [],
    
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
                        this.layer, OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.addAttractor,
                            scope: this
                        }
                    })
                }, actionDefaults)),

                new GeoExt.Action(Ext.apply({
                    text: 'Place Deterrant',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Point, {
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
    
    think: function() {
        if (this.attractors.length > 0) {
          this.queueFeatureAddition({
              func: this.processAttractor,
              scope: this,
              data: this.attractors
          });
        }
        
        if (this.detterants.length > 0) {
          this.queueFeatureAddition({
              func: this.processDeterrents,
              scope: this,
              data: this.detterants
          });
        }
    },

    /** Add attractor point */
    addAttractor: function(evt) {
        var line = evt.feature;
        
        this.attractors.push(line);
        
        if (this.registered == false) {
            this.registerThinkCallback({ 
                  func: this.think, 
                  scope: this
            });
            
            this.registered = true;
        }
    },
    
    processAttractor: function(polys, attractors) {
        return this.wpsClient.getProcess(
            'local', 'gpigf:addAttractor'
        ).configure({
            inputs: {
                polygon: polys,
                points: attractors,
                buffer: 10
            }
        }).output();
    },

    /** Handler function for splitting geometries */
    addDeterrant: function(evt) {
        var line = evt.feature;
        
        this.detterants.push(line);
        
        if (this.registered == false) {
            this.registerThinkCallback({ 
                  func: this.think, 
                  scope: this
            });
            
            this.registered = true;
        }
    },

    processDeterrents: function(polys, detterants) {
        return this.wpsClient.getProcess(
            'local', 'gpigf:addDeterrant'
        ).configure({
            inputs: {
                polygon: polys,
                points: detterants,
                buffer: this.getGrowthDistance()/2,
                minLength: 500,
            }
        }).output();
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
});

Ext.preg(WPSDemo.prototype.ptype, WPSDemo);
