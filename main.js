
require([
    "esri/Map",
    "esri/widgets/ScaleBar",
    "esri/views/MapView",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    "esri/renderers/ClassBreaksRenderer",
	"esri/symbols/SimpleMarkerSymbol",
    "dojo/dom",
    "dojo/domReady!"
],
function(
    Map,
    ScaleBar,
    MapView,
    TileLayer,
    MapImageLayer,
    ClassBreaksRenderer,
    SimpleMarkerSymbol,
    dom
) {
    var basemapLayer = new TileLayer( {url:"//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Base Map"} );

    var quakesRenderer = new ClassBreaksRenderer( {
		field: "magnitude"
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 0,
  		maxValue: 1,
		label: "Less than 1.0",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 10,
    		color: [0, 77, 168, 0.80]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 1,
  		maxValue: 2,
		label: "1 to 1.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 14,
    		color: [0, 77, 168, 0.80]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 2,
  		maxValue: 3,
		label: "2 to 2.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 18,
    		color: [0, 77, 168, 0.80]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 3,
  		maxValue: 4,
		label: "3 to 3.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 22,
    		color: [0, 77, 168, 0.80]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 4,
  		maxValue: 9,
		label: "4.0 and greater",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 26,
    		color: [0, 77, 168, 0.80]
		} )
	} );
	var quakesLayer = new MapImageLayer( {
		url: "http://services.kgs.ku.edu/arcgis8/rest/services/tremor/quakes_public/MapServer",
		sublayers:[ {
			id: 0,
			renderer: quakesRenderer
		} ],
		id:"KGS Events",
		visible: true
	} );

    var map = new Map( {
		layers: [basemapLayer, quakesLayer]
    } );

    var view = new MapView( {
        map: map,
        container: "map-div",
        center: [-98, 39.1],
        zoom: 7,
        ui: { components: ["zoom"] },
		constraints: { rotationEnabled: false }
    } );

    var scaleBar = new ScaleBar( {
    	view: view,
    	unit: "dual"
  	} );
  	view.ui.add(scaleBar, {
    	position: "bottom-left"
  	} );
} );

function filterQuakes(year, mag) {
    var nextYear = parseInt(year) + 1;
    var def = [];

    if (year !== "all") {
        if (mag !== "all") {
            def[8] = "the_date >= to_date('" + year + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and the_date < to_date('" + nextYear + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and net in ('us', ' ', 'US') and mag >=" + mag;
        } else {
            def[8] = "the_date >= to_date('" + year + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and the_date < to_date('" + nextYear + "-01-01 00:00:00','YYYY-MM-DD HH24:MI:SS') and mag >= 2 and net in ('us', ' ', 'US')";
        }
    } else {
        if (mag !== "all") {
            def[8] = " mag >=" + mag;
        } else {
            def[8] = "";
        }
    }
    earthquakesLayer.setLayerDefinitions(def);
}

function filterQuakesRecent() {
    var def = [];
    def[8] = "state = 'KS' and mag >= 2 and net in ('us', ' ', 'US') and the_date = (select max(the_date) from earthquakes where state = 'KS' and mag >= 2 and net in ('us', ' ', 'US'))";
    earthquakesLayer.setLayerDefinitions(def);
}

function filterQuakesDays(days) {
    var def = [];

    if (days !== "all") {
        def[8] = "sysdate - the_date <= " + days + " and mag >= 2 and net in ('us', ' ', 'US')";
    } else {
        def[8] = "";
    }
    earthquakesLayer.setLayerDefinitions(def);
}

function clearQuakeFilter() {
    var def = [];
    def = "";
    earthquakesLayer.setLayerDefinitions(def);
    days.options[0].selected="selected";
    mag.options[0].selected="selected";
    year.options[0].selected="selected";
}
