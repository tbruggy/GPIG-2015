/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Control/DragFeature.js
 * @require OpenLayers/Control/SelectFeature.js
 * @require OpenLayers/Popup/FramedCloud.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/WPSClient.js
 *
 * @require gpigf/Tool.js
 * @require core/PossibleTargetPositions.js
 */

var agenttracker = Ext.extend(gpigf.plugins.Tool, {

  ptype: 'app_core_agenttracker',
  
  pushAgentsBtn: null,
  registered: false,
  throttle: 0,
  
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
          text: 'Start Agents',
          control: new OpenLayers.Control.Button({
            trigger: OpenLayers.Function.bind(this.startAgents, this)
          })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Get Agent Info',
          control: new OpenLayers.Control.SelectFeature(
            this.agentLayer, {
              hover: true,
              onSelect: OpenLayers.Function.bind(this.selectAgent, this), 
              onUnselect: OpenLayers.Function.bind(this.unselectAgent, this)
          })
        }, actionDefaults))
      ]);
    }, this);
  },
  
  startAgents: function() { 
    if (!this.registered) {
      // Get the first row from agents DB first
      this.positionNumber = 1;
      
      this.getAgentsPending = false;
      this.digPending = false;
      
      this.wpsClient.execute({
        server: 'local',
        process: 'gpigf:popPosition',
        inputs: {
          posNum: this.positionNumber
        },
        success: this.initFirstAgents,
        scope: this
      });
    }
    
    this.registered = true;
  },
  
  agentInfo: [],
  
  getAgentInfo: function(id, key) {
    return this.agentInfo[id][key];
  },
  
  selectAgent: function(feature) {
    popup = new OpenLayers.Popup.FramedCloud("chicken", 
                             feature.geometry.getBounds().getCenterLonLat(),
                             null,
                             "<div style='font-size:.8em'><b>Name</b>: " + this.getAgentInfo(feature.id, "name") +
                                                   "<br /><b>Vehicle</b>: " + this.getAgentInfo(feature.id, "v") +
                                                   "<br /><b>Visibilty Range</b>:" + this.getAgentInfo(feature.id, "vis_range") + 
                                                   "<br /><b>Status</b>: " + this.getAgentInfo(feature.id, "status") + "</div>",
                             null, true, null);
    feature.popup = popup;
    this.layer.map.addPopup(popup);
  },
  
  unselectAgent: function(feature) {
    this.layer.map.removePopup(feature.popup);
    feature.popup.destroy();
    feature.popup = null;
  },
  
  /* this should only be called once */
  initFirstAgents: function(outputs) {
    if (outputs.result == undefined) {
      throw "Unexpected outputs result";
    }
    
    this.agentsArray = outputs.result;
    
    this.agentInfo[this.agentsArray[0].id] = { name: "Bob Marley", v: "Tank", vis_range: "100", status: "Jammin" }
    this.agentInfo[this.agentsArray[1].id] = { name: "Mr T", v: "Smartcar", vis_range: "100", status: "Pityin fools" }
    this.agentInfo[this.agentsArray[2].id] = { name: "Iron Man", v: "Suit", vis_range: "100", status: "Philanthropistic" }
    this.agentInfo[this.agentsArray[3].id] = { name: "Team F", v: "Limo", vis_range: "100", status: "Getting firsts in our degrees" }
    
    this.agentLayer.removeAllFeatures();
    this.agentLayer.addFeatures(this.agentsArray);
    
    this.registerThinkCallback({ 
      func: this.think, 
      scope: this
    });
    
    Ext.TaskMgr.start({
      run: this.updateAgents,
      interval: 1000,
      scope: this
    }); 
  },
  
  think: function() {
    if (this.agentsArray.length > 0) {
      this.queueFeatureAddition({
        func: this.dig,
        scope: this
      });
    }
  },
  
  updateAgents: function() {
    if (this.getAgentsPending) {
      return;
    }
    
    if (this.digPending) {
      return;
    }
    
    this.getAgentsPending = true;
    
    this.wpsClient.execute({
      server: 'local',
      process: 'gpigf:popPosition',
      inputs: {
        posNum: this.positionNumber
      },
      success: this.poppedResult,
      scope: this
    });
    
    this.positionNumber ++;
  },
  
  // Current agent positions
  agentsArray : [],
  // Index used in the adding of agents to the array, before they are pushed
  agentsArrayIndex : 0,
  // Position number used to iterate through positions in the database
  positionNumber : 1,
  // The agent positions 1 timestep before the current ones
  lastArray: [],
  digPending: false,
  getAgentsPending: false,
  
  dig: function(polys, data) {
    if (!this.digPending) {
      // Dirty hack to keep the area around an agent clear
      // note that previous_positions == new_positions
      return this.wpsClient.getProcess(
        'local', 'gpigf:agentDigArea'
      ).configure({
        inputs: {
          target_areas: polys,
          previous_positions: this.agentsArray,
          new_positions: this.agentsArray,
          agent_vision: 100
        }
      }).output();
    }
    
    this.digPending = false;
    
    this.agentLayer.removeAllFeatures();
    this.agentLayer.addFeatures(this.agentsArray);
    
    return this.wpsClient.getProcess(
      'local', 'gpigf:agentDigArea'
    ).configure({
      inputs: {
        target_areas: polys,
        previous_positions: this.lastArray,
        new_positions: this.agentsArray,
        agent_vision: 100
      }
    }).output();
  },
  
  poppedResult: function(outputs) {
    if (outputs.result == undefined) {
      // No more rows from the database, stop
      return;
    }
    
    this.lastArray = this.agentsArray;
    this.agentsArray = outputs.result;
    
    this.getAgentsPending = false;
    this.digPending = true;
  },
  
  // TODO other plugins (e.g. communication plugins) may need this plugin to expose 
  // a list of current agents along with their details (name, position, etc)
});

Ext.preg(agenttracker.prototype.ptype, agenttracker);