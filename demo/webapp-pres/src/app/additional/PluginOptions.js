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

var pluginOptions = Ext.extend(gpigf.plugins.Tool, {
    
    ptype: 'app_plugin_options',
      
    /** Initialization of the plugin */
    init: function(target) {
        pluginOptions.superclass.init.apply(this, arguments);

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
            
            this.addActions([
                new GeoExt.Action(Ext.apply({
                    map: target.mapPanel.map,
                    enableToggle: false,
                    allowDepress: false,
                    text: 'Plugin Options',
                    control: new OpenLayers.Control.Button({
                        trigger: OpenLayers.Function.bind(function() {
                            top.document.getElementById('optionsForm').className = "customModal";
                        }, this)
                    })
                }, {})),
                new GeoExt.Action(Ext.apply({
                    map: target.mapPanel.map,
                    enableToggle: false,
                    allowDepress: false,
                    text: 'Show Legend',
                    control: new OpenLayers.Control.Button({
                        trigger: OpenLayers.Function.bind(function() {
                            top.document.getElementById('legend').className = "customModal";
                        }, this)
                    })
                }, {}))
            ]);
            
        }, this);
    }
    
});

Ext.preg(pluginOptions.prototype.ptype, pluginOptions);