require(["esri/map", "esri/dijit/Scalebar", "dojo/domReady!"], function(Map,Scalebar) {
    var map = new Map("map-div", {
        center: [-98.5, 38.25],
        zoom: 7,
        basemap: "national-geographic",
        logo: false
    });

    var scalebar = new Scalebar({
        map: map,
        scalebarUnit: "dual"
    });

    earthquakeLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://services.kgs.ku.edu/arcgis/rest/services/CO2/seismic/MapServer");
    earthquakeLayer.setVisibleLayers([8]);
    map.addLayers([earthquakeLayer]);
});

function filterQuakes(year, mag) {
    var nextYear = parseInt(year) + 1;
    var def = [];

    if (year !== "all") {
        if (mag !== "all") {
            def[8] = "the_date >= to_date('" + year + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and the_date < to_date('" + nextYear + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and mag >=" + mag;
        } else {
            def[8] = "the_date >= to_date('" + year + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and the_date < to_date('" + nextYear + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS')";
        }
    } else {
        if (mag !== "all") {
            def[8] = " mag >=" + mag;
        } else {
            def[8] = "";
        }
    }

    earthquakeLayer.setLayerDefinitions(def);
}

function filterQuakesRecent() {
    var def = [];
    def[8] = "state = 'KS' and lower(net) <> 'ismpkansas' and the_date = (select max(the_date) from earthquakes where state = 'KS' and lower(net) <> 'ismpkansas'";
    earthquakeLayer.setLayerDefinitions(def);
}

function filterQuakesDays(days) {
    var def = [];

    if (days !== "all") {
        def[8] = "sysdate - the_date <= " + days;
    } else {
        def[8] = "";
    }
    earthquakeLayer.setLayerDefinitions(def);
}

function clearQuakeFilter() {
    var def = [];
    def = "";
    earthquakeLayer.setLayerDefinitions(def);
    days.options[0].selected="selected";
    mag.options[0].selected="selected";
    year.options[0].selected="selected";
}