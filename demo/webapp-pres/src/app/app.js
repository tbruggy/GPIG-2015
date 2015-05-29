/**
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Renderer/Canvas.js
 * @require OpenLayers/Renderer/VML.js
 * @require GeoExt/widgets/ZoomSlider.js
 * @require widgets/Viewer.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 *
 * @require core/AgentTracker.js
 * @require core/PossibleTargetPositions.js
 * @require additional/EnvObstacles.js
 * @require additional/AttractorDeterrents.js
 */

var app = new gxp.Viewer({
    // Our custom plugin that provides drawing and processing actions
    tools: [
      { 
        ptype: "app_core_target_pos",
        id: "possible-target-positions",
      }, 
      { 
        ptype: "app_core_agenttracker",
        id: "agent-tracker",
        target_pos: "possible-target-positions",
      }, 
      { 
        ptype: "app_env_obstacles",
        id: "env_obstacles",
        target_pos: "possible-target-positions",
      },
      { 
        ptype: "app_attractor_deterrants",
        id: "attractor_deterrants",
        target_pos: "possible-target-positions",
      }
    ],
    sources: {
        osm: { ptype: "gxp_osmsource" },
        ol: { ptype: "gxp_olsource" }
    },
    map: {
        projection: "EPSG:3857",
        center: [-8236325, 4974370],
        zoom: 17,
        layers: [{
            source: "osm",
            name: "mapnik",
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
        }]
    }
});