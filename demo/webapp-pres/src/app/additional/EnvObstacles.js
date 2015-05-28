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

var envObstacles = Ext.extend(gpigf.plugins.Tool, {
    
    ptype: 'app_env_obstacles',
    task: null,
      
    /** Initialization of the plugin */
    init: function(target) {
        envObstacles.superclass.init.apply(this, arguments);

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
                    text: 'Grow with Environmetal Obstacles',
                    control: new OpenLayers.Control.Button({
                        trigger: OpenLayers.Function.bind(this.toggleEnvObstacles, this)
                    })
                }, actionDefaults))
            ]);
        }, this);
    },
    
    toggleEnvObstacles: function() {
        if (this.task == null) {
            this.task = {
                run: this.think,
                interval: this.getGrowthSpeed() * 5,
                scope: this
            };
            
            Ext.TaskMgr.start(this.task);
        } else {
            Ext.TaskMgr.stop(this.task);
            this.task = null;
        }   
    },
    
    think: function() {
        this.queueFeatureAddition({
            func: this.processEnvObstacles,
            scope: this,
            data: null
        });
    },
    
    processEnvObstacles: function(polys, data) {
        return this.wpsClient.getProcess(
            'local', 'gpigf:processEnvObstacles'
        ).configure({
            inputs: {
                target_areas: polys,
                road_growth: 20,
                area_growth: 5,
                ext_target_area: 50,
                env_obstacle_growth: 1
            }
        }).output();
    },
    
    saveEnvObstacles: function(evt) {
        var polys = evt.feature;
  
        this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:saveEnvObstacles',
            inputs: {
                target_areas: polys
            },
            success: console.log('environmental obstacle saved'),
            scope: this
        });
      
        this.layer.removeFeatures(polys);
    }
          
});

Ext.preg(envObstacles.prototype.ptype, envObstacles);