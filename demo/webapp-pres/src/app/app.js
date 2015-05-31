/**
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Renderer/Canvas.js
 * @require OpenLayers/Renderer/VML.js
 * @require GeoExt/widgets/ZoomSlider.js
 * @require widgets/Viewer.js
 * @require plugins/OLSource.js
 * @require plugins/GoogleSource.js
 * @require plugins/OSMSource.js
 *
 * @require core/AgentTracker.js
 * @require core/PossibleTargetPositions.js
 * @require additional/EnvObstacles.js
 * @require additional/AttractorDeterrents.js
 * @require additional/PluginOptions.js
 * require additional/AgentPushPop.js
 */

var app = new gxp.Viewer({
  portalConfig: {
    layout: "border",
    region: "center",
    cls: "gpigf",
    items: [{
      id: "centerpanel",
      xtype: "panel",
      layout: "fit",
      region: "center",
      border: false,
      items: ["mymap"]
    }],
  },
  
  tools: [{ 
    ptype: "app_core_target_pos",
    id: "possible-target-positions",
    actionTarget: "mymap.tbar",
  }, { 
    ptype: "app_core_agenttracker",
    id: "agent-tracker",
    actionTarget: "mymap.tbar",
  }, { 
    ptype: "app_env_obstacles",
    id: "env_obstacles",
    actionTarget: "mymap.tbar",
  }, { 
    ptype: "app_attractor_deterrants",
    id: "attractor_deterrants",
    actionTarget: "mymap.tbar",
  }, { 
    ptype: "app_plugin_options",
    id: "plugin_options",
    actionTarget: "mymap.bbar",
  }/*, { 
    ptype: "app_core_agentpushpop",
    id: "core_agentpushpop",
  }*/],
  
  sources: {
    osm: { ptype: "gxp_osmsource" },
    google: { ptype: "gxp_googlesource" },
    ol: { ptype: "gxp_olsource" }
  },
  
  map: {
    id: "mymap",
    projection: "EPSG:3857",
    center: [-8236325, 4974370],
    zoom: 17,
    layers: [{
      source: "google",
      //name: "mapnik",
      name: "ROADMAP",
      group: "background"
    }, {
      // A vector layer to display our geometries and processing results
      source: "ol",
      name: "sketch",
      type: "OpenLayers.Layer.Vector"
    }, {
      // A vector layer to display attractors
      source: "ol",
      name: "attractorsLayer",
      type: "OpenLayers.Layer.Vector"
    }, {
      // A vector layer to display deterrants
      source: "ol",
      name: "deterrantsLayer",
      type: "OpenLayers.Layer.Vector"
    }, {
      // A vector layer to display environmental obstacles
      source: "ol",
      name: "envObstaclesLayer",
      type: "OpenLayers.Layer.Vector"
    }, {
      // A vector layer to display agents
      source: "ol",
      name: "agents",
      type: "OpenLayers.Layer.Vector"
    }],
    items: [{
      xtype: "gx_zoomslider",
      vertical: true,
      height: 100
    }],
    bbar: ['->']
  }
});