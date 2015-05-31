/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 */

var attractorGrowth = 4;
var deterrantRange = 400;

var deterrantsLayerStyle = OpenLayers.Util.applyDefaults(deterrantsLayerStyle, OpenLayers.Feature.Vector.style['default']);
deterrantsLayerStyle.fillColor = "#ff6166";
deterrantsLayerStyle.strokeColor = '#ff2e35';
deterrantsLayerStyle.strokeWidth = 3;
deterrantsLayerStyle.pointRadius = 20;

var attractorsLayerStyle = OpenLayers.Util.applyDefaults(attractorsLayerStyle, OpenLayers.Feature.Vector.style['default']);
attractorsLayerStyle.fillColor = "#77dd88";
attractorsLayerStyle.strokeColor = '#3ec354';
attractorsLayerStyle.strokeWidth = 3;
attractorsLayerStyle.pointRadius = 20;

var attractorsDeterrants = Ext.extend(gpigf.plugins.Tool, {

    ptype: 'app_attractor_deterrants',
    registered: false,
    attractor_throttle: 0,
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
                allowDepress: true
            };
            
            this.addActions([
                new GeoExt.Action(Ext.apply({
                    text: 'Place Attractor',
                    toggleGroup: 'app-toolbar',
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
                    toggleGroup: 'app-toolbar',
                    control: new OpenLayers.Control.DrawFeature(
                        this.deterrantsLayer, OpenLayers.Handler.Point, {
                        eventListeners: {
                            featureadded: this.placeDeterrant,
                            scope: this
                        }
                    })
                }, actionDefaults))
            ]);
            
            document.getElementById("optionsSaveBtn").addEventListener("click", function() {
                attractorGrowth = document.getElementById("optionsAttrGrowth").value;
                deterrantRange = document.getElementById("optionsDeterRange").value;
            });
            
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
          if (this.attractor_throttle++ % 2 == 0) {
            this.queueFeatureAddition({
                server: 'local', 
                process: 'gpigf:addAttractor',
                func: this.processAttractors,
                data: this.attractors,
                scope: this
            });
          }
        }
         
        if (this.deterrants.length > 0) {
          this.queueFeatureAddition({
              server: 'local', 
              process: 'gpigf:addDeterrant',
              func: this.processDeterrents,
              data: this.deterrants,
              scope: this,
              priority: -1
          });
        }
    },

    processAttractors: function(wps, wps_chain, attractors) {
        wps.configure({
            inputs: {
                polygon: wps_chain.output(),
                points: attractors,
                buffer: attractorGrowth
            }
        });
        
        return wps;
    },
    
    processDeterrents: function(wps, wps_chain, detterants) {
        wps.configure({
            inputs: {
                polygon: wps_chain.output(),
                points: detterants,
                buffer: this.getGrowthDistance() / 2,
                minLength: deterrantRange
            }
        });
        
        return wps;
    }
    
});

Ext.preg(attractorsDeterrants.prototype.ptype, attractorsDeterrants);
