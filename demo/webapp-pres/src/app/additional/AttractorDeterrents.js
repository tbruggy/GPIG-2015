/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 */

var deterrantsLayerStyle = OpenLayers.Util.applyDefaults(deterrantsLayerStyle, OpenLayers.Feature.Vector.style['default']);
deterrantsLayerStyle.fillColor = "#ff6166";
deterrantsLayerStyle.strokeColor = '#ff2e35';
deterrantsLayerStyle.strokeWidth = 1;

var attractorsLayerStyle = OpenLayers.Util.applyDefaults(attractorsLayerStyle, OpenLayers.Feature.Vector.style['default']);
attractorsLayerStyle.fillColor = "#77dd88";
attractorsLayerStyle.strokeColor = '#4ed364';
attractorsLayerStyle.strokeWidth = 1;

var attractorsDeterrants = Ext.extend(gpigf.plugins.Tool, {

    ptype: 'app_attractor_deterrants',
    registered: false,
    attractors : [],
    deterrants : [],
    
    /** Initialization of the plugin */
    init: function(target) {
        attractorsDeterrants.superclass.init.apply(this, arguments);

        this.wpsClient = new OpenLayers.WPSClient({
            servers: {
                local: '/geoserver/wps'
            }
        });
    
        target.on('ready', function() {
            this.layer = target.getLayerRecordFromMap({
                name: 'sketch',
                source: 'ol'
            }).getLayer();
        
            this.attractorsLayer = target.getLayerRecordFromMap({
                name: 'attractorsLayer',
                source: 'ol'
            }).getLayer();
            
            this.deterrantsLayer = target.getLayerRecordFromMap({
                name: 'deterrantsLayer',
                source: 'ol'
            }).getLayer();
            
            this.attractorsLayer.style = attractorsLayerStyle;
            this.deterrantsLayer.style = deterrantsLayerStyle;
            
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
                        this.attractorsLayer, OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.placeAttractor,
                            scope: this
                        }
                    })
                }, actionDefaults)),
                new GeoExt.Action(Ext.apply({
                    text: 'Place Deterrant',
                    control: new OpenLayers.Control.DrawFeature(
                        this.deterrantsLayer, OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.placeDeterrant,
                            scope: this
                        }
                    })
                }, actionDefaults))
            ]);
        }, this);
    },
    
    placeAttractor: function(evt) {
        var point = evt.feature;
        this.attractors.push(point);
        
        if (this.registered == false) {
            this.registerThinkCallback({ 
                  func: this.think, 
                  scope: this
            });
            
            this.registered = true;
        }
    },
    
    placeDeterrant: function(evt) {
        var point = evt.feature;
        this.deterrants.push(point);
        
        if (this.registered == false) {
            this.registerThinkCallback({ 
                  func: this.think, 
                  scope: this
            });
            
            this.registered = true;
        }
    },

    think: function() {
        if (this.attractors.length > 0) {
          this.queueFeatureAddition({
              func: this.processAttractors,
                data: this.attractors,
               scope: this
              
          });
        }
        
        if (this.detterants.length > 0) {
          this.queueFeatureAddition({
              func: this.processDeterrents,
              data: this.deterrants,
              scope: this
          });
        }
    },

    processAttractors: function(polys, attractors) {
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
    
    processDeterrents: function(polys, detterants) {
        return this.wpsClient.getProcess(
            'local', 'gpigf:addDeterrant'
        ).configure({
            inputs: {
                polygon: polys,
                points: detterants,
                buffer: this.getGrowthDistance() / 2,
                minLength: 500,
            }
        }).output();
    }
    
});

Ext.preg(attractorsDeterrants.prototype.ptype, attractorsDeterrants);
