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

gpigf.plugins.Tool = Ext.extend(gxp.plugins.Tool, {
  
  target_pos: null,
  
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
});