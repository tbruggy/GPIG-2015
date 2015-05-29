/**
 * @require plugins/Tool.js
 * @require GeoExt/widgets/Action.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/WPSClient.js
 */

/**
 * This file is slightly different from the others as it does not, 
 * and should never, inherit from gpigf.plugins.Tool.
 *
 * A plugin that uses functionality from gpigf.plugins.Tool, such as getPluginByID
 * will implicitly become dependant on that plugin. This plugin defined in this file
 * cannot be dependant on any other plugin, it is the 'root'.
 *
 * This plugin uses a 'think' pattern. Every set amount of milliseconds it will run
 * a 'think' function. This function is responsible for updating all the polygons on
 * the layer. This includes updating the polygons with new features such as agent
 * exploration, or growth of area, etc. This pattern ensures there are no race
 * conditions from different plugins attempting to modify the same polgyon.
 *
 * Each new feature is processed one at a time. The first feature to be processed is 
 * the growth of the target polygons, then each other feature in the order they were
 * added to the queue in.
 */
 
var targetpos = Ext.extend(gxp.plugins.Tool, {

  ptype: 'app_core_target_pos',
  
  /** Initialization of the plugin */
  init: function(target) {
    targetpos.superclass.init.apply(this, arguments);

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
      
      
      this.startBtn = new OpenLayers.Control.Button({
        trigger: OpenLayers.Function.bind(this.startThinking, this)
      });
      
      this.stopBtn = new OpenLayers.Control.Button({
        trigger: OpenLayers.Function.bind(this.stopThinking, this)
      });
      
      this.stopBtn.deactivate();
      
      // Some defaults
      var actionDefaults = {
        map: target.mapPanel.map,
        enableToggle: true,
        toggleGroup: this.ptype,
        allowDepress: true
      };
      this.addActions([
        // Action for drawing the possible target position area
        new GeoExt.Action(Ext.apply({
          text: 'Draw Possible Target Area',
          control: new OpenLayers.Control.DrawFeature(
            this.layer, OpenLayers.Handler.Polygon, {
            eventListeners: {
              featureadded: this.polygonAdded,
              scope: this
            }
          })
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Start',
          control: this.startBtn
        }, actionDefaults)),
        new GeoExt.Action(Ext.apply({
          text: 'Stop',
          control: this.stopBtn
        }, actionDefaults))
      ]);
    }, this);
  },
  
  startThinking: function() {
    this.simulate = true;
    this.stopBtn.activate();
  },
  
  stopThinking: function() {
    this.simulate = false;
    this.startBtn.activate();
  },
  
  simulate: false,
  
  /** Polygons of the target area */
  targetPositions: [],
  /** 
   * After the first polygon is created, all subsequent polygons that are created
   * added to this queue, and will then be added at the end of the next 'think' (see below)   
   */
  queuedTargetPositions: [],
  /** Distance to grow the polygon by each interval */
  growthDistance: 10,
  /** Time (ms) between each growth interval */
  growthSpeed: 200,
  /** Number of quadrants to use when rounding corners, low number means no smoothing */
  growthSegments: 0,
  /** Interval containing method to execute at each growth */
  growthInterval: null,
  /** Used to prevent another service request from being sent before the previous has finished */
  processingServiceRequest: false,
  
  /**
   * The grow polygons service.
   * Function grows a polygon by a set amount over the course of time.
   *
   * @param polys   A set of polygons to grow
   * @param unused  Not used, null value
   * @return        New set of polygons with increased size
   */
  growPolygons: function(polys, unused) {
    var self = this;
    
    return this.wpsClient.getProcess(
      'local', 'gpigf:growTargetPositions'
    ).configure({
      inputs: {
        target_areas: polys,
        growth_distance: this.growthDistance, 
        growth_segments: this.growthSegments 
      }
    }).output();
  },
  
  /** Called when a polygon is added to the layer by the user */
  polygonAdded: function(evt) {
    /**
     * This suffices as a 'first time being executed' check as there 
     * is currently no way to remove from targetPositions
     */
    if (this.targetPositions.length == 0) {
      // Add the new feature to the array of features
      this.targetPositions.push(evt.feature);
    
      // Start a new start, the function in 'run' will be executed every 'interval' milliseconds
      Ext.TaskMgr.start({
        run: this.think,
        interval: this.growthSpeed,
        scope: this
      }); 
    } else {
      this.queuedTargetPositions.push(evt.feature);
    }
  },
  
  /**
   * The 'think' function. This will start thinking once the first polygon is drawn
   * It will never stop as currently there is no way to remove polygons, and as long
   * as there is at least one polygon it is always necessary to think
   *
   * @noreturn
   */
  think: function() {
    if (!this.simulate)
      return;
    /**
     * Sometimes service requests can take a while to process
     * So we do not want to 'think' again before the previous request has finished
     * This does mean that growing will be delayed, but for the sake of simplicity I
     * think thats ok
     */
    if (this.processingServiceRequest)
      return;
    this.processingServiceRequest = true;
    
    /**
     * Process new polygons based upon features in the queue.
     * Before the queue is process, the grow feature is added to the front of the queue
     */
    this.growAndProcessFeatureQueue();
  },
  
  /**
   * Processes the queue of features to be added to the target area polygons.
   * But before beginning processing it adds the grow feature to the start of the queue
   *
   * @noreturn
   */
  growAndProcessFeatureQueue: function() {
    for (i = 0; i < this.thinkCallbacks.length; i++) {
      var cb = this.thinkCallbacks[i];
      
      var func = (cb.scope) ?
                  OpenLayers.Function.bind(cb.func, cb.scope) :
                  cb.func;
      
      func();
    }
    
    // Add self to the top of the queue
    this.queueFeatureAddition({
      func: this.growPolygons, 
      scope: this,
      data: null
    });
    
    this.chainFeaturesFromQueue();
  },
  
  /** 
   * Processes each feature in the queue in turn, one by one.
   * i.e. 1. [newPolygons] <---- [grow] <---- [currentPolygons]
   *      2. [newerPolygons] <-- [feature] <- [newPolygons]
   *      3. and so on...
   * Once a feature is processed, it is removed from the queue
   *
   * Every feature is processed using 2 service requests: One is the gpigf:processTargetPositions, 
   * the other is the service that generates the feature. gpigf:processTargetPositions does nothing, 
   * it is just necessary for this modular logic.
   *
   * WPS can chain processes together, the result of one being used immediately in the input
   * to the next. That is what is used here. Ideally it would be one really long chain, with 
   * gpigf:processTargetPositions at the end, and gpigf:growTargetPositions at the start
   * (as growth is always processed first). In the middle of this long chain would be all the
   * extra features to process. However there is a bug in OpenLayers that prevents chains from
   * being longer than a size of 2 (at least I assume its a bug). So instead multiple service
   * requests are sent in pairs, as mention in the previous paragraph.
   *
   * Note that this function isn't recursive. It is called again when this.addResult finishes.
   * This ensures that the previous feature is executed and fed into the next, preventing one
   * feature from overwriting the other (race conditions and so on). this.wpsClient.execute
   * is asynchronous.
   *
   * @return        True if there are more features in the queue to process. False otherwise
   */
  chainFeaturesFromQueue: function() {
    if (this.featureQueue.length > 0) {
      var featureservice = this.featureQueue.pop();
      
      var func = (featureservice.scope) ?
                  OpenLayers.Function.bind(featureservice.func, featureservice.scope) :
                  featureservice.func;
      
      this.wpsClient.execute({
        server: 'local',
        process: 'gpigf:processTargetPositions',
        inputs: { 
            target_areas: func(this.targetPositions, featureservice.data)
        },
        success: this.addResult,
        scope: this
      });
      
      return true;
    }
    
    return false;
  },
  
  /** An array of feature services to executed. Modified through queueFeatureAddition and chainFeaturesFromQueue */
  featureQueue: [],
  
  thinkCallbacks: [],
  
  addThinkCallback: function(f) {
    this.thinkCallbacks.push(f);
  },
  
  /**
   * Adds a feature service to the queue, to be processed on next think
   *
   * @param f   A feature service to add, see definition of queueFeatureAddition in Tool.js
   * @noreturn
   */
  queueFeatureAddition: function(f) {
    this.featureQueue.push(f);
  },
  
  /**
   * Called by the gpigf:processTargetPositions on success. Adds the new features to the layer
   */
  addResult: function(outputs) {
    if (outputs.result == undefined || outputs.result[0] == undefined) {
      /**
       * SANITY CHECK
       * Chances are, if you reach here it is because one of the services hasn't returned a valid result.
       * This may be due to bad arguments types, check that the services are accepting and returning GeometryColletions.
       * Trying to debug the java code as this stage doesn't work, it doesn't seem to get executed - I dont
       * really understand the architecture behind this.
       *
       * To get an idea of what is going wrong, break on XML.js (in OpenLayers/Format) OpenLayers.Format.XML::write
       * Place the break on the last line 'return data'. Then you can read 'data' in your browsers debugger which will
       * be XML text. Copy and paste this text into geoservers WPS request builder and run it. The modal window will give
       * you (poorly formatted) error data.
       *
       * Something to note: You cannot chain processes more than once due to - what I assume is - a bug in OpenLayers.
       * This class already chains once, so your plugins cannot have their own chains, sorry!
       *
       * It could also mean that your OpenGeo suite installation has broken. It will require a full reinstall to fix this
       * (remember to delete the Program Data folder when you uninstall)
       */
      throw "Bad result from service(s)";
    }
    
    // Remove the current polygons
    this.layer.removeFeatures(this.targetPositions);
    
    /**
     * Update the list of polygons to include those in the queue
     * outputs.result is an array of polygons that have been effected by features (agent exploration, growth, etc)
     * this.queuedTargetPositions is an array of newly created polygons, created by the user drawing them on the map
     * these polygons have not been affected by any features yet.
     */
    this.targetPositions = outputs.result;
    this.targetPositions.push.apply(this.targetPositions, this.queuedTargetPositions);
    this.queuedTargetPositions = [];
    
    // Add the new collection of polygons to the layer.
    this.layer.addFeatures(this.targetPositions);
    
    if (!this.chainFeaturesFromQueue()) {
      // Queue is empty, set to false to allow the next think to execute
      this.processingServiceRequest = false;
    }
  },
    
  getGrowthSpeed: function() {
      return this.growthSpeed;
  },
    
  getGrowthDistance: function() {
      return this.growthDistance;
  }
    
});

Ext.preg(targetpos.prototype.ptype, targetpos);