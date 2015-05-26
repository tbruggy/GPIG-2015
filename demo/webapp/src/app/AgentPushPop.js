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
 
var agentNum = 1;

var numPositions = -1;

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
			
				// Action for adding an agent to the map
                new GeoExt.Action(Ext.apply({
                    text: 'Add Agent',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Point,
						{
							eventListeners: {
								featureadded: this.addToArray,
								scope: this
							}
						}
                    )
                }, actionDefaults)),
				
				// Action for dragging geometries
                new GeoExt.Action(Ext.apply({
                    text: 'Drag',
                    control: new OpenLayers.Control.DragFeature(
                        this.layer
                    )
                }, actionDefaults)),
				
				// Store Current Agents
				new GeoExt.Action(Ext.apply({
                    text: 'Push Agents',
                    control: new OpenLayers.Control.Button({
						 displayClass: "Demo", trigger: OpenLayers.Function.bind(this.pushAgents, this)
					})
                }, actionDefaults)),

				// Action for resetting and displaying the agent positions
				new GeoExt.Action(Ext.apply({
                    text: 'Reset Positions',
                    control: new OpenLayers.Control.Button({
						displayClass: "Demo", trigger: OpenLayers.Function.bind(this.resetPosition, this)
					})
                }, actionDefaults)),
				
				// Action for displaying the next agent positions
				new GeoExt.Action(Ext.apply({
                    text: 'Next Positions',
                    control: new OpenLayers.Control.Button({
						displayClass: "Demo", trigger: OpenLayers.Function.bind(this.nextPosition, this)
					})
                }, actionDefaults)),
				
            ]);
        }, this);
    },
	
	
	agentsArray : [],
	agentsArrayIndex : 1,
	positionNumber : 1,
	
	addToArray: function(evt) {
		this.agentsArray[this.agentsArrayIndex] = evt.feature;
		this.agentsArrayIndex++;
		
		//alert(this.agentsArray);
	},
	
	/*
	getNumPositions: function(evt) {
		var id = agentNum;
		this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:getNumPositions',
            inputs: {
                agentID: id
            },
            success: this.setNumPosition,//this.addResult,
            scope: this
        });
	},*/
	
	/*
	pushAgents: function(evt) {
		var poly = evt.feature;
        this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:pushAgents',
            inputs: {
                agentsArray: this.agentsArray
            },
            //success: this.addResult,
            //scope: this
        });
        //this.layer.removeFeatures([poly]);  // Remove this line for psuedo-heatmap styling!
    },*/
	
	removeAgents: function(evt) {
		this.layer.removeAllFeatures();
	},
	
	
	
	resetPosition: function(evt) {
		this.removeAgents();
		this.positionNumber = 1;
		this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:popPosition',
            inputs: {
                posNum: this.positionNumber
            },
            success: this.poppedResult,
            scope: this
        });
	},
	
	nextPosition: function(evt) {
		this.removeAgents();
		this.positionNumber++;
		this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:popPosition',
            inputs: {
                posNum: this.positionNumber
            },
            success: this.poppedResult,
            scope: this
        });
		
	},
	
	popPosition: function(evt) {
		this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:popPosition',
            inputs: {
                posNum: this.positionNumber
            },
            success: this.poppedResult,
            scope: this
        });
	},
	
	pushAgents: function(evt) {
		//var poly = evt.feature;
		//var agentsCol = new OpenLayers.Geometry.Collection(this.agentsArray);
        this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:pushAgents',
            inputs: {
                agents: this.agentsArray//agentsCol
            },
            success: this.pushedResult,
            scope: this
        });
        //this.layer.removeFeatures([poly]);  // Remove this line for psuedo-heatmap styling!
    },
	
	doit: function(evt) {
		alert("hi");
		this.button.control.displayClass = "Demo";
	},

	
	popAgents: function(evt) {
		var poly = evt.feature;
        this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:popAgents',
            inputs: {
                agents: poly
            },
            success: this.poppedResult,
            scope: this
        });
        //this.layer.removeFeatures([poly]);  // Remove this line for psuedo-heatmap styling!
    },
	
	pushedResult: function(outputs) {
	},
	
	poppedResult: function(outputs) {
		if (outputs.result == undefined) {
			console.log("undefined from pop");
			return;
		}
		alert(outputs.result);
		this.layer.addFeatures(outputs.result);
	},

    /** Helper function for adding process results to the vector layer */
    addResult: function(outputs) {
        this.layer.addFeatures(outputs.result);
    },
	
	setNumPosition: function(outputs) {
		numPositions = outputs.result;
		window.alert(numPositions);
	}

});

Ext.preg(Demo.prototype.ptype, Demo);