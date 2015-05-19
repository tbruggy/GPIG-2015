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
      }
    ],
    sources: {
        osm: { ptype: "gxp_osmsource" },
        ol: { ptype: "gxp_olsource" }
    },
    map: {
        projection: "EPSG:3857",
        center: [-12469704.211816, 4984938.2845139],
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