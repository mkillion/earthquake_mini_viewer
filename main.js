
require([
    "esri/Map",
    "esri/widgets/ScaleBar",
    "esri/views/MapView",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    "esri/renderers/ClassBreaksRenderer",
	"esri/symbols/SimpleMarkerSymbol",
    "esri/tasks/IdentifyTask",
    "esri/tasks/support/IdentifyParameters",
    "esri/PopupTemplate",
    "esri/widgets/Popup",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "dojo/_base/array",
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
    IdentifyTask,
    IdentifyParameters,
    PopupTemplate,
    Popup,
    GraphicsLayer,
    Graphic,
    arrayUtils,
    dom
) {
    var isMobile = WURFL.is_mobile;
    var idDef = [];
    var hilite;

    var basemapLayer = new TileLayer( {url:"//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Base Map"} );
    var quakesURL = "http://services.kgs.ku.edu/arcgis8/rest/services/tremor/quakes_public/MapServer";
    var graphicsLayer = new GraphicsLayer();

    var quakesRenderer = new ClassBreaksRenderer( {
		field: "magnitude"
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 0,
  		maxValue: 0.99,
		label: "Less than 1.0",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 10,
    		color: [0, 77, 168, 0.70]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 1,
  		maxValue: 1.99,
		label: "1 to 1.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 10,
    		color: [0, 77, 168, 0.70]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 2,
  		maxValue: 2.99,
		label: "2 to 2.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 13,
    		color: [0, 77, 168, 0.70]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 3,
  		maxValue: 3.99,
		label: "3 to 3.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 20,
    		color: [0, 77, 168, 0.70]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 4,
  		maxValue: 10,
		label: "4.0 and greater",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 26,
    		color: [0, 77, 168, 0.70]
		} )
	} );
	var quakesLayer = new MapImageLayer( {
		url: quakesURL,
		sublayers:[ {
			id: 0,
			renderer: quakesRenderer
		} ],
		id:"KGS Events",
		visible: true
	} );

    var map = new Map( {
		layers: [basemapLayer, quakesLayer, graphicsLayer]
    } );

    var view = new MapView( {
        map: map,
        container: "map-div",
        center: [-98, 38.5],
        zoom: 7,
        ui: { components: ["zoom"] },
		constraints: { rotationEnabled: false }
    } );

    view.when(function() {
        view.on("click", executeIdTask);

        view.popup.dockEnabled = true;
		view.popup.dockOptions = {
			buttonEnabled: false,
			position: "auto"
		};

        // Remove zoom-to action that gets added by default:
		view.popup.actions.splice(0, 1);
    } );

    var scaleBar = new ScaleBar( {
    	view: view,
    	unit: "dual"
  	} );
  	view.ui.add(scaleBar, {
    	position: "bottom-left"
  	} );

    function executeIdTask(event) {
        var identifyTask = new IdentifyTask(quakesURL);
        var identifyParams = new IdentifyParameters();

        identifyParams.returnGeometry = true;
        identifyParams.tolerance = (isMobile) ? 9 : 4;
        identifyParams.layerIds = [0];
        identifyParams.layerOption = "visible";
        identifyParams.width = view.width;
        identifyParams.height = view.height;
        identifyParams.geometry = event.mapPoint;
        identifyParams.mapExtent = view.extent;
        identifyParams.layerDefinitions = idDef;

        identifyTask.execute(identifyParams).then(function(response) {
            return addPopupTemplate(response.results);
        } ).then(function(feature) {
            if (feature.length > 0) {
                openPopup(feature);
                highlightFeature(feature);
            }
        } );
    }


    function addPopupTemplate(response) {
        return arrayUtils.map(response, function(result) {
            var feature = result.feature;
            var layerName = result.layerName;

            if (layerName === "QUAKES_PUBLIC") {
                var quakeTemplate = new PopupTemplate( {
                    title: "KGS Event",
                    content: quakeContent(feature)
                } );
                feature.popupTemplate = quakeTemplate;
            }

            return feature;
        } );
    }


    function openPopup(feature) {
        view.popup.features = feature;
        view.popup.visible = true;
    }


    function highlightFeature(features) {
        graphicsLayer.remove(hilite);
        var f = features[0] ? features[0] : features;

        switch (f.geometry.type) {
            case "point":
                var marker = {
                    type: "simple-marker",
                    color: [255, 255, 0, 0],
                    size: 20,
                    outline: {
                        type: "simple-line",
                        color: "yellow",
                        width: 7
                    }
                };
                var sym = marker;
                break;
            case "polygon":
                var fill = {
                    type: "simple-fill",
                    style: "none",
                    outline: {
                        type: "simple-line",
                        color: "yellow",
                        width: 5
                    }
                };
                var sym = fill;
                break;
        }
        hilite = new Graphic( {
            geometry: f.geometry,
            symbol: sym
        } );
        graphicsLayer.add(hilite);
    }


    function quakeContent(feature) {
        var f = feature.attributes;
        var ag = f.AGENCY !== "Null" ? f.AGENCY : "";
        var ote = f.ORIGIN_TIME_ERR !== "Null" ? f.ORIGIN_TIME_ERR + " seconds" : "";
        var lat = f.LATITUDE !== "Null" ? f.LATITUDE : "";
        var latErr = f.LATITUDE_ERR !== "Null" ? f.LATITUDE_ERR : "";
        var lon = f.LONGITUDE !== "Null" ? f.LONGITUDE : "";
        var lonErr = f.LONGITUDE_ERR !== "Null" ? f.LONGITUDE_ERR : "";
        var dep = f.DEPTH !== "Null" ? f.DEPTH : "";
        var de = f.DEPTH_ERR !== "Null" ? f.DEPTH_ERR : "";
        var m = f.MAGNITUDE !== "Null" ? f.MAGNITUDE : "";
        var mt = f.MAGNITUDE_TYPE !== "Null" ? f.MAGNITUDE_TYPE : "";
        var sas = f.SAS !== "Null" ? f.SAS : "";
        var co = f.COUNTY_NAME !== "Null" ? f.COUNTY_NAME : "";

        if (f.LAYER === 'USGS') {
            var m = f.ML !== "Null" ? parseFloat(f.ML).toFixed(1) + " ml" : "";
        }

        if (dep) { dep = parseFloat(dep).toFixed(1) + " km"; }
        if (de) {
            if (de === "0") {
                de = "0 (fixed)";
            } else {
                de = parseFloat(de).toFixed(1) + " km";
            }
        }
        var hu = "";
        if (latErr && lonErr) {
            var horizontalUncertainty = Math.sqrt( Math.pow(latErr,2) + Math.pow(lonErr,2) );
            hu = horizontalUncertainty.toFixed(1) + " km";
        }

        var content = "<table id='popup-tbl'>";
        content += "<tr><td>Magnitude (" + mt + "): </td><td>" + m + "</td></tr>";
        content += "<tr><td>Origin Time (local): </td><td>{LOCAL_TIME}</td></tr>";
        content += "<tr><td>Origin Time Error: </td><td>" + ote + "</td></tr>";
        content += "<tr><td>Seismic Action Score: </td><td>" + sas + "</td></tr>";
        content += "<tr><td>County: </td><td>" + co + "</td></tr>";
        content += "<tr><td>Quake ID: </td><td>{QUAKE_ID}</td></tr>";
        content += "<tr><td>Reporting Agency: </td><td>" + ag + "</td></tr>";
        content += "<tr><td>Latitude: </td><td>" + lat + "&deg;</td></tr>";
        content += "<tr><td>Longitude: </td><td>" + lon + "&deg;</td></tr>";
        content += "<tr><td>Horizontal Uncertainty: </td><td>" + hu + "</td></tr>";
        content += "<tr><td>Depth: </td><td>" + dep + "</td></tr>";
        content += "<tr><td>Vertical Uncertainty: </td><td>" + de + "</td></tr></table>";

        return content;
    }


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
} );    // End require.
