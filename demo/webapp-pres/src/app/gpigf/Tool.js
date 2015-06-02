/**
 * @require plugins/Tool.js
 * @require core/PossibleTargetPositions.js
 */
 
/**
 * This file defines a new class, gpigf.plugins.Tool, that
 * our plugins can make use of. It exposes a few common features
 * that are needed by every class in our plugin.
 */
 
Ext.namespace("gpigf.plugins");

var tablenames = [{
  label: "Agents: Team 1",
  table: "agentsave",
}, {
  label: "Agents: Team 2",
  table: "agentsave2",
}, {
  label: "Agents: Team 3",
  table: "agentsave3",
}];
var tablenames_i = 0;

gpigf.plugins.Tool = Ext.extend(gxp.plugins.Tool, {
  
  target_pos: "possible-target-positions",
  
  /**
   * This function finds a plugin by its id. The id is defined in app.js when
   * each plugin inserts itself into the tools.
   *
   * @return A pointer to the plugin object
   */
  getPluginByID: function(id) {
    var plugin;
    if (id) {
      plugin = this.target.tools[id];
      if (!plugin) {
        throw new Error("Unable to locate target positions feature with id: " + id);
      }
    }
    return plugin;
  },

  /**
   * @return A pointer to the target position plugin
   */
  getTargetPositionsFeature: function() {
    return this.getPluginByID(this.target_pos);
  },
  
  /**
   * Adds a feature to the feature queue. A feature is a change to the heatmap, such as
   * removing an area explored by an agent. All features must go into a queue which will
   * be processed by PossibleTargetPositions on its next update.
   *
   * The queue is necessary to ensure that features don't overwrite each other.
   *
   * @param     f   An object with 'func', 'scope', and 'data' attributes. See AgentTracker.js for an example
   * @noreturn
   */
  queueFeatureAddition: function(f) {
    this.getTargetPositionsFeature().queueFeatureAddition(f);
  },
  
  registerThinkCallback: function(f) {
    this.getTargetPositionsFeature().addThinkCallback(f);
  },
    
  getGrowthSpeed: function() {
    return this.getTargetPositionsFeature().getGrowthSpeed();
  },
    
  getGrowthDistance: function() {
    return this.getTargetPositionsFeature().getGrowthSpeed();
  }
});