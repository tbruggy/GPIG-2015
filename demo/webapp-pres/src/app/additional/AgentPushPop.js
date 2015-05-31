/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 *
 * @require gpigf/Tool.js
 * @require core/PossibleTargetPositions.js
 */

var tablename = "agentsave"; 
 
var agentpushpop = Ext.extend(gpigf.plugins.Tool, {

  ptype: 'app_core_agentpushpop',
  
  pushAgentsBtn: null,
  registered: false,
  
  /** Initialization of the plugin */
  init: function(target) {
    agenttracker.superclass.init.apply(this, arguments);

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
			this.agentLayer.style = {
        strokeColor : '#FF0000',
        strokeWidth: 10,
        pointRadius: 15
      };
      
      this.pushAgentsBtn = new OpenLayers.Control.Button({
        trigger: OpenLayers.Function.bind(this.pushAgents, this)
      });
      
      // Some defaults
      var actionDefaults = {
        map: target.mapPanel.map,
        enableToggle: true,
        toggleGroup: this.ptype,
        allowDepress: true
      };
      this.addActions([
        new GeoExt.Action(Ext.apply({
          text: 'Add Agent',
          control: new OpenLayers.Control.DrawFeature(
            this.agentLayer, OpenLayers.Handler.Point, {
              eventListeners: {
                featureadded: this.addToArray,
                scope: this
              }
            })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Drag Agent',
          control: new OpenLayers.Control.DragFeature(
            this.agentLayer, { 
              onComplete: OpenLayers.Function.bind(function(a, b) { this.pushAgentsBtn.activate() }, this)
          })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Push Agents Positions to DB',
          control: this.pushAgentsBtn
        }, actionDefaults))
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
		this.agentsArrayIndex ++;
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
  
  // Push agents added using 'Add Agent' to the database
  pushAgents: function(evt) {
    this.wpsClient.execute({
      server: 'local',
      process: 'gpigf:pushAgents',
      inputs: {
        agents: this.agentsArray,
        tablename: tablename,
      },
    });
    
    this.pushAgentsBtn.activate();
  },
	
	// Load the first position in the database
	resetPosition: function(evt) {
		this.removeAgents();
		this.positionNumber = 1;
		this.wpsClient.execute({
      server: 'local',
      process: 'gpigf:popPosition',
      inputs: {
        posNum: this.positionNumber,
        tablename: tablename,
      },
      success: this.poppedResult,
      scope: this
    });
	},
	
	nextPosition: function() {
		this.removeAgents();
		this.positionNumber ++;
		this.wpsClient.execute({
      server: 'local',
      process: 'gpigf:popPosition',
      inputs: {
        posNum: this.positionNumber,
        tablename: tablename,
      },
      success: this.poppedResult,
      scope: this
    });
	},
  
  poppedResult: function(outputs) {
		if (outputs.result == undefined) {
			// No more rows from the database, stop
			return;
		}
    
		this.lastArray = this.agentsArray;
		this.agentsArray = outputs.result;
    
		this.dig(this.layer);
    
		this.agentLayer.addFeatures(this.agentsArray);
	},

  // Remove a line from the area, using the positions in lastArray and agentsArray
  dig: function(area) {
    area = this.targetArea;
    this.layer.removeAllFeatures();
    
    this.wpsClient.execute({
      server: 'local',
      process: 'gpigf:agentDigArea',
      inputs: {
        target_areas: area,
        previous_positions: this.lastArray,
        new_positions: this.agentsArray,
        agent_vision: 100
      },
      success: this.addResult,
      scope: this
    });
  },

  addResult: function(outputs) {
		if (outputs.result == null) {
			this.layer.addFeatures(this.targetArea);
		} else {
			this.layer.addFeatures(outputs.result);
			this.targetArea = outputs.result;
		}
  },
	
	// Variable to save the target area
	targetArea: null,
	
	// Saves the target area - used to prevent it from being removed
	saveTargetArea: function(evt){
		this.targetArea = evt.feature;
	}
});

Ext.preg(agentpushpop.prototype.ptype, agentpushpop);