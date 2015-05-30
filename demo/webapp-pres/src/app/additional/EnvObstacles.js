/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 * @require gpigf/Tool.js
 */

var roadGrowth = 4;

var obstacleLayerStyle = OpenLayers.Util.applyDefaults(obstacleLayerStyle, OpenLayers.Feature.Vector.style['default']);
obstacleLayerStyle.fillColor = "#8eafbc";
obstacleLayerStyle.strokeColor = '#5e8d9f';
obstacleLayerStyle.strokeWidth = 1;

var envObstacles = Ext.extend(gpigf.plugins.Tool, {
    
    ptype: 'app_env_obstacles',
    registered: false,
    drawAlongRoads: false,
    environmentalObstacles: [],
    drawControl: null,
      
    /** Initialization of the plugin */
    init: function(target) {
        envObstacles.superclass.init.apply(this, arguments);

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
            
            this.envObstaclesLayer = target.getLayerRecordFromMap({
                name: 'envObstaclesLayer',
                source: 'ol'
            }).getLayer();
            
            this.envObstaclesLayer.style = obstacleLayerStyle;
            
            var actionDefaults = {
                map: target.mapPanel.map,
            };
            
            this.drawControl = new OpenLayers.Control.DrawFeature(
                this.envObstaclesLayer, OpenLayers.Handler.Polygon, {
                eventListeners: {
                    featureadded: this.addEnvironmentalObstacles,
                    scope: this
                }
            });
            
            this.addActions([
                new GeoExt.Action(Ext.apply({
                    text: 'Grow along Roads',
                    enableToggle: true,
                    toggleGroup: this.ptype,
                    allowDepress: true,
                    control: new OpenLayers.Control.Button({
                        trigger: OpenLayers.Function.bind(this.toggleRoads, this)
                    })
                }, actionDefaults)),
                new GeoExt.Action(Ext.apply({
                    text: 'Draw Environmetal Obstacle',
                    enableToggle: true,
                    toggleGroup: this.ptype,
                    allowDepress: true,
                    control: this.drawControl,
                }, actionDefaults))
            ]);
            
            document.getElementById("optionsSaveBtn").addEventListener("click", function() {
                roadGrowth = document.getElementById("optionsRoadGrowth").value;
            });
            
        }, this);
        
        this.registerThinkCallback({ 
            func: this.think, 
            scope: this
        });
    },
    
    toggleRoads: function() {
        this.drawAlongRoads = !this.drawAlongRoads;
    },
    
    addEnvironmentalObstacles: function(evt) {
        var polygon = evt.feature;
        this.environmentalObstacles.push(polygon);
        
        this.drawControl.deactivate();
    },
    
    think: function() {
        if (this.drawAlongRoads) {
            this.queueFeatureAddition({
                server: 'local', 
                process: 'gpigf:processRoads',
                func: this.processRoads,
                scope: this
            });
        }
        
        if (this.environmentalObstacles.length > 0) {
            this.queueFeatureAddition({
              server: 'local', 
              process: 'gpigf:processEnvObstacles',
              func: this.processEnvironmentalObstacles,
              data: this.environmentalObstacles,
              scope: this,
              priority: -1
            });
        }
    },
    
    processRoads: function(wps, wps_chain, data) {
        wps.configure({
            inputs: {
                target_areas: wps_chain.output(),
                road_growth: roadGrowth,
                ext_target_area: roadGrowth * 2
            }
        });
        
        return wps;
    },
    
    processEnvironmentalObstacles: function(wps, wps_chain, obstacles) {
        wps.configure({
            inputs: {
                target_areas: wps_chain.output(),
                env_obstacles: obstacles
            }
        });
        
        return wps;
    }
    
});

Ext.preg(envObstacles.prototype.ptype, envObstacles);