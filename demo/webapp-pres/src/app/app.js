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
 * @require additional/Attractors.js
 * @require additional/DB_PushPop.js
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
        ptype: "app_opt_attactors",
        id: "attactors",
        target_pos: "possible-target-positions",
      }, 
      { 
        ptype: "app_db_pushpop",
        id: "db_pushpop",
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
        center: [-8237625.42317963, 4974570.25854274],
        zoom: 14,
        layers: [{
            source: "osm",
            name: "mapnik",
            group: "background"
        }, {
            // A vector layer to display our geometries and processing results
            source: "ol",
            name: "sketch",
            type: "OpenLayers.Layer.Vector"
        }],
        items: [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }]
    }
});