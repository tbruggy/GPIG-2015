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

var selectedStyle = {
	strokeColor : '#FF0000',
	strokeWidth: 10,
	pointRadius: 15
};

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
            this.agentLayer = target.getLayerRecordFromMap({
                name: 'agents',
                source: 'ol'
            }).getLayer();
			this.agentLayer.style = selectedStyle;
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
                        this.agentLayer, OpenLayers.Handler.Point,
						{
							eventListeners: {
								featureadded: this.addToArray,
								scope: this
							}
						}
                    )
                }, actionDefaults)),
				
				// Action for drawing a polygon on the map
                new GeoExt.Action(Ext.apply({
                    text: 'Draw Area',
                    control: new OpenLayers.Control.DrawFeature(
                        this.layer, OpenLayers.Handler.Polygon,
						{
							eventListeners:
							{
								featureadded: this.saveTargetArea,
								scope: this
							}
						}
                    )
                }, actionDefaults)),
				
				// Action for dragging geometries
                new GeoExt.Action(Ext.apply({
                    text: 'Drag',
                    control: new OpenLayers.Control.DragFeature(
                        this.agentLayer
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
				
				// Action for removing from a target area using current and previous agent positions
				new GeoExt.Action(Ext.apply({
                    text: 'Dig',
                    control: new OpenLayers.Control.SelectFeature(
					this.layer,
					{
						  clickout: true, toggle: false,
						  multiple: false, hover: false,
						  toggleKey: "ctrlKey", // ctrl key removes from selection
						  multipleKey: "shiftKey", // shift key adds to selection
						  box: true,
						  eventListeners: {
							  featurehighlighted: this.dig,
							  scope: this
						  }
					}
				)
                }, actionDefaults)),
				
            ]);
        }, this);
    },
	
	// Current agent positions
	agentsArray : [],
	
	// Index used in the adding of agents to the array, before they are pushed
	agentsArrayIndex : 0,
	
	// Position number used to iterate through positions in the database
	positionNumber : 1,
	
	// The agent positions 1 timestep before the current ones
	lastArray: [],
	
	
	// Add a point to the agentsArray
	addToArray: function(evt) {
		this.agentsArray[this.agentsArrayIndex] = evt.feature;
		this.agentsArrayIndex++;
		
		//alert(this.agentsArray);
	},
	
	// Remove the agents (but add the area again)
	removeAgents: function(evt) {
		this.agentLayer.removeAllFeatures();
		//this.layer.addFeatures(targetArea);
	},
	
	// Save previous when a next position is loaded and displayed
	// This automatically overwrites the previous 'savePrevious'
	savePrevious: function(evt) {
		this.lastArray = this.agentsArray;
	},
	
	// Load the first position in the database
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
	
	nextPosition:function()
	{
		this.removeAgents();
		this.positionNumber++
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
	
	// Retrieve the positions given by the position number
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
	
	// Push agents added using 'Add Agent' to the database
	pushAgents: function(evt) {
		console.log(this.agentsArray);
        this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:pushAgents',
            inputs: {
                agents: this.agentsArray
            },
            success: this.pushedResult,
            scope: this
        });
    },
	
	// Test button function - not currently used
	doit: function(evt) {
		alert("hi");
		this.button.control.displayClass = "Demo";
	},

	// Display all positions stored in the database (not currently used)
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
	
	// Remove a line from the area, using the positions in lastArray and agentsArray
	dig: function(area) {
		area = targetArea;
		this.layer.removeAllFeatures();
		this.wpsClient.execute({
            server: 'local',
            process: 'gpigf:agentDigArea',
            inputs: {
				target_areas: area,
                previous_positions: this.lastArray,
				new_positions: this.agentsArray,
				agent_vision: 10000
            },
            success: this.addResult,
            scope: this
        });
	},
	
	// Called after a result is pushed - currently does nothing
	pushedResult: function(outputs) {
		alert("pushed");
	},
	
	// Called after a result is popped, updates lastArray and agentsArray and displays new positions
	poppedResult: function(outputs) {
		if (outputs.result == undefined) {
			alert("End");
			return;
		}
		//alert(outputs.result);
		this.lastArray = this.agentsArray;
		this.agentsArray = outputs.result;
		OpenLayers.Function.bind(this.dig(this.layer), this);
		this.agentLayer.addFeatures(this.agentsArray);
		var timer = setTimeout(OpenLayers.Function.bind(this.nextPosition, this),1000);
	},

    /** Helper function for adding process results to the vector layer */
    addResult: function(outputs) {
		if (outputs.result == null) {
			this.layer.addFeatures(targetArea);
		}
		else {
			this.layer.addFeatures(outputs.result);
			targetArea = outputs.result;
		}
    },
	
	// Variable to save the target area
	targetArea: null,
	
	// Saves the target area - used to prevent it from being removed
	saveTargetArea:function(evt){
		targetArea = evt.feature;
	}

});

Ext.preg(Demo.prototype.ptype, Demo);