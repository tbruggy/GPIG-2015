/**
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Renderer/Canvas.js
 * @require OpenLayers/Renderer/VML.js
 * @require GeoExt/widgets/ZoomSlider.js
 * @require widgets/Viewer.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 */
 
// Change/Remove the below block to include or exclude whatever demo you want, all demos ptype should be 'app_demo'
/**
 * @require AreaGrowthDemo.js
 */

var app = new gxp.Viewer({
    // Our custom plugin that provides drawing and processing actions
    tools: [{ ptype: "app_demo" }],
    sources: {
        osm: { ptype: "gxp_osmsource" },
        ol: { ptype: "gxp_olsource" }
    },
    map: {
        projection: "EPSG:3857",
        center: [-10764594.758211, 4523072.3184791],
        zoom: 3,
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