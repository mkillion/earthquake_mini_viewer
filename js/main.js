require([
	"dojo/_base/lang",
	"dojo/on",
	"dojo/dom",
    "dojo/window",
    "dojo/_base/array",
    "dojo/store/Memory",
    "dojo/dom-construct",
    "dijit/form/ComboBox",
	"application/Drawer",
    "application/DrawerMenu",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    "esri/widgets/Search",
    "esri/widgets/Home",
    "esri/PopupTemplate",
    "esri/widgets/Popup",
    "esri/tasks/IdentifyTask",
    "esri/tasks/support/IdentifyParameters",
    "esri/tasks/FindTask",
    "esri/tasks/support/FindParameters",
    "esri/geometry/Point",
    "esri/geometry/SpatialReference",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/Graphic",
    "esri/tasks/GeometryService",
    "esri/tasks/support/ProjectParameters",
    "esri/geometry/support/webMercatorUtils",
    "esri/layers/ImageryLayer",
	"esri/geometry/geometryEngine",
	"esri/symbols/SimpleFillSymbol",
	"esri/geometry/Polygon",
	"esri/tasks/QueryTask",
	"esri/tasks/support/Query",
	"esri/widgets/ScaleBar",
	"esri/widgets/Legend",
	"esri/renderers/ClassBreaksRenderer",
    "dojo/domReady!"
],
function(
	lang,
	on,
	dom,
    win,
    arrayUtils,
    Memory,
    domConstruct,
    ComboBox,
	Drawer,
	DrawerMenu,
    Map,
    MapView,
    TileLayer,
    MapImageLayer,
    Search,
    Home,
    PopupTemplate,
    Popup,
    IdentifyTask,
    IdentifyParameters,
    FindTask,
    FindParameters,
    Point,
    SpatialReference,
    SimpleMarkerSymbol,
    GraphicsLayer,
    SimpleLineSymbol,
    Graphic,
    GeometryService,
    ProjectParameters,
    webMercatorUtils,
    ImageryLayer,
	geometryEngine,
	SimpleFillSymbol,
	Polygon,
	QueryTask,
	Query,
	ScaleBar,
	Legend,
	ClassBreaksRenderer
) {
    var isMobile = WURFL.is_mobile;
	var idDef = [];
	var wmSR = new SpatialReference(3857);
	var urlParams, listCount, hilite, bufferGraphic;

    // Set up basic frame:
    window.document.title = "KGS Earthquakes";
    $("#title").html("KGS Network Earthquakes<a id='kgs-brand' href='http://www.kgs.ku.edu'>Kansas Geological Survey</a>");

    var showDrawerSize = 850;

	var drawer = new Drawer( {
        showDrawerSize: showDrawerSize,
        borderContainer: 'bc_outer',
        contentPaneCenter: 'cp_outer_center',
        contentPaneSide: 'cp_outer_left',
        toggleButton: 'hamburger_button'
    } );
    drawer.startup();

    // Broke the template drawer open/close behavior when paring down the code, so...
    $("#hamburger_button").click(function(e) {
        e.preventDefault();
        if ($("#cp_outer_left").css("width") === "293px") {
            $("#cp_outer_left").css("width", "0px");
        } else {
            $("#cp_outer_left").css("width", "293px");
        }
    } );

    createMenus();

    // End framework.

    // Create map and map widgets:
    var basemapLayer = new TileLayer( {url:"//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Base Map"} );
    var quakesURL = "http://services.kgs.ku.edu/arcgis2/rest/services/tremor/quakes_public/MapServer";
	var graphicsLayer = new GraphicsLayer();

	var identifyTask, identifyParams;
	var findTask = new FindTask(quakesURL);
    var findParams = new FindParameters();
	findParams.returnGeometry = true;
	findParams.contains = false;

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
    		color: [255, 255, 230, 0.85]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 1,
  		maxValue: 1.99,
		label: "1 to 1.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 11,
    		color: [255, 246, 191, 0.85]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 2,
  		maxValue: 2.99,
		label: "2 to 2.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 13,
    		color: [253, 226, 150, 0.85]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 3,
  		maxValue: 3.99,
		label: "3 to 3.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 20,
    		color: [253, 195, 90, 0.85]
		} )
	} );
	quakesRenderer.addClassBreakInfo( {
  		minValue: 4,
  		maxValue: 4.99,
		label: "4.0 to 4.9",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 26,
    		color: [252, 152, 57, 0.85]
		} )
	} );
    quakesRenderer.addClassBreakInfo( {
  		minValue: 5,
  		maxValue: 10,
		label: "5.0 and greater",
  		symbol: new SimpleMarkerSymbol( {
    		style: "circle",
    		size: 26,
    		color: [234, 112, 39, 0.85]
		} )
	} );
    // quakesRenderer.legendOptions = {
  	// 	title: "Magnitude"
	// };

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
        container: "mapDiv",
        center: [-98, 38],
        zoom: 7,
        ui: { components: ["zoom"] },
		constraints: { rotationEnabled: false }
    } );

    view.when(function() {
		if (!isMobile) {
	        $("#from-date").datepicker();
	        $("#to-date").datepicker();
	    }

        on(view, "click", executeIdTask);

        identifyTask = new IdentifyTask(quakesURL);
        identifyParams = new IdentifyParameters();
		identifyParams.returnGeometry = true;
        identifyParams.tolerance = (isMobile) ? 9 : 3;
        identifyParams.layerIds = [0];
        identifyParams.layerOption = "visible";
        identifyParams.width = view.width;
        identifyParams.height = view.height;

		// Remove zoom-to action that gets added by default:
		view.popup.actions.splice(0, 1);

		// Default initial load to display quakes in the last 7 days:
        var today = new Date();
        var daysAgo = new Date();
        var startDate = new Date( daysAgo.setDate(today.getDate() - 7) );
        var year = startDate.getFullYear();
        var month = addZero( startDate.getMonth() + 1 );
        var day = addZero( startDate.getDate() );
        var dateTxt = month + "/" + day + "/" + year;

		urlParams = location.search.substr(1);
	    urlZoom(urlParams);

        $("#from-date").val(dateTxt);
        filterQuakes();
    } );

	var searchWidget = new Search({
		view: view,
		popupEnabled: false
	}, "srch" );

	 var scaleBar = new ScaleBar( {
        view: view,
        unit: "dual"
      } );
      view.ui.add(scaleBar, {
        position: "bottom-left"
      } );

	//  var legend = new Legend( {
 	//  	view: view,
 	//   	layerInfos: [
 	// 	{
 	// 		layer: quakesLayer,
 	// 		title: "KGS Network Earthquakes"
 	// 	}
 	// 	]
 	// }, "legend-content" );

    // End map and map widgets.

	clearQuakeFilter = function() {
        graphicsLayer.removeAll();
        $("#from-date, #to-date, #mag").val("");
		$("#filter-msg").html("");
        quakesLayer.findSublayerById(0).definitionExpression = "";
        idDef[0] = "";
		view.popup.visible = false;
    }


    function openPopup(feature) {
		dom.byId("mapDiv").style.cursor = "auto";
		view.popup.features = feature;
		view.popup.dockEnabled = true;
		view.popup.dockOptions = {
			buttonEnabled: false,
			position: "bottom-right"
		};
		view.popup.visible = true;
    }


    function zoomToFeature(features) {
        var f = features[0] ? features[0] : features;
		if (f.geometry.type === "point") {
            view.center = new Point(f.geometry.x, f.geometry.y, wmSR);;
            view.scale = 24000;
		} else {
			view.extent = f.geometry.extent;
		}
		highlightFeature(f);
    }


    function highlightFeature(features) {
		///graphicsLayer.removeAll();
		graphicsLayer.remove(hilite);
        var f = features[0] ? features[0] : features;
        switch (f.geometry.type) {
            case "point":
                var marker = new SimpleMarkerSymbol( {
                    color: [255, 255, 0, 0],
                    size: 20,
                    outline: new SimpleLineSymbol( {
                        color: "yellow",
                        width: 7
                    } )
                } );
				var sym = marker;
                break;
            case "polygon":
				var fill = new SimpleFillSymbol( {
					style: "none",
					outline: new SimpleLineSymbol( {
                        color: "yellow",
                        width: 5
                    } )
				} );
				var sym = fill;
                break;
        }
		hilite = new Graphic( {
			geometry: f.geometry,
			symbol: sym
		} );
		graphicsLayer.add(hilite);
    }


	function addZero(x) {
        return (x < 10 ? '0' : '') + x;
    }


    function createMenus() {
    	var drawerMenus = [];
        var content, menuObj;

        // Tools panel:
        content = '';
        content += '<div class="panel-container" id="tools-panel">';
        content += '<div class="panel-header">Filter </div>';
        content += '<div class="panel-padding">';
		content += "<div class='ctrl'>";
		content += "<table>";
		content += '<tr><td>From Date<span class="note"> (local)</span>:</td><td><input class="txtinput" type="text" size="14" id="from-date" placeholder="mm/dd/yyyy"></td></tr>';
		content += '<tr><td>To Date<span class="note"> (local)</span>:</td><td><input class="txtinput" type="text" size="14" id="to-date" placeholder="mm/dd/yyyy"></td></tr>';
		content += '<tr><td>Magnitude:</td>';
		content += '<td><select class="txtinput" name="mag" id="mag">';
		content += '<option value="all" selected>2.0 +</option><option value="2">2.0 to 2.9</option><option value="3">3.0 to 3.9</option><option value="4">4.0 and greater</option>';
		content += '</select></td></tr>';
		content += "<tr><td colspan='2'><span id='filter-msg'></span></td></tr>";
		content += '<tr><td colspan="2"><input class="txtinput" type="button" onclick="filterQuakes();" value="Apply Filter" />&nbsp;&nbsp;<input class="txtinput" type="button" onclick="clearQuakeFilter();" value="Clear Filter" /></td></tr></table>';
		content += "</div>";
		content += '</div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-wrench"></div><div class="icon-text">Tools</div>',
            content: content
        };
        drawerMenus.push(menuObj);

		// Legend/links panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Legend </div>';
        content += '<div class="panel-padding">';
        // content += '<div id="legend-content"></div>';
		content += '<div id="legend-content">KGS Earthquakes<br>Magnitude<br><img src="legend.png"></div>';
        content += '</div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-list"></div><div class="icon-text">Legend</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        var drawerMenu = new DrawerMenu({
            menus: drawerMenus
        }, dom.byId("drawer_menus"));
        drawerMenu.startup();
    }


	filterQuakes = function() {
        graphicsLayer.removeAll();
        var fromDate = dom.byId("from-date").value;
        var toDate = dom.byId("to-date").value;
        var fromDateIsValid = true;
        var toDateIsValid = true;
        var mag = dom.byId("mag").value;
        var timeWhere = "";
		var magWhere = "";
        var theWhere = "";

        // Check validity of dates:
        if (fromDate !== "") {
            var fromDateParts = fromDate.split("/");
            fromMonth = parseInt(fromDateParts[0]);
            var fromDay = parseInt(fromDateParts[1]);
            fromYear = parseInt(fromDateParts[2]);
            fromDateIsValid = validateDate( fromDay, fromMonth, fromYear );
        } else {
            fromMonth = "";
            fromYear = "";
        }
        if (toDate !== "") {
            var toDateParts = toDate.split("/");
            toMonth = parseInt(toDateParts[0]);
            var toDay = parseInt(toDateParts[1]);
            toYear = parseInt(toDateParts[2]);
            toDateIsValid = validateDate( toDay, toMonth, toYear );
        } else {
            toMonth = "";
            toYear = "";
        }
        if (!fromDateIsValid || !toDateIsValid) {
            alert("An invalid date was entered.");
            return;
        }
        var d1 = new Date();
        var d2 = new Date(fromDate);
        if (d2 > d1) {
            alert("From Date cannot be in the future.");
            return;
        }
        var d3 = new Date(toDate);
        if (d2 > d3) {
            alert("From Date cannot be later than To Date");
            return;
        }

        // Create time where clause:
        if (fromDate && toDate) {
            timeWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy') and trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
        } else if (fromDate && !toDate) {
            timeWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy')";
        } else if (!fromDate && toDate) {
            timeWhere = "trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
        }

        // Create magnitude where clause:
        if (mag !== "all") {
            switch (mag) {
                case "2":
                    magWhere = "magnitude >= 2 and magnitude < 3";
                    break;
                case "3":
                    magWhere = "magnitude >= 3 and magnitude < 4";
                    break;
                case "4":
                    magWhere = "magnitude >= 4";
                    break;
            }
        }

        // Create final where clause:
        if (timeWhere !== "") {
			theWhere += timeWhere + " and ";
		}
		if (magWhere !== "") {
			theWhere += magWhere + " and ";
		}
		// Strip off final "and":
		if (theWhere.substr(theWhere.length - 5) === " and ") {
			theWhere = theWhere.slice(0,theWhere.length - 5);
		}

        quakesLayer.findSublayerById(0).definitionExpression = theWhere;
        idDef[0] = theWhere;
    }


	function validateDate( intDay, intMonth, intYear ) {
	    return intMonth >= 1 && intMonth <= 12 && intDay > 0 && intDay <= daysInMonth( intMonth, intYear );
	}


	function daysInMonth( intMonth, intYear ) {
	    switch ( intMonth )
	    {
	        case 2:
	            return (intYear % 4 == 0 && intYear % 100) || intYear % 400 == 0 ? 29 : 28;
	        case 4:
	        case 6:
	        case 9:
	        case 11:
	            return 30;
	        default :
	            return 31
	    }
	}


    function executeIdTask(event) {
        identifyParams.geometry = event.mapPoint;
        identifyParams.mapExtent = view.extent;
		identifyParams.layerDefinitions = idDef;
        dom.byId("mapDiv").style.cursor = "wait";

        identifyTask.execute(identifyParams).then(function(response) {
			return addPopupTemplate(response.results);
        } ).then(function(feature) {
			if (feature.length > 0) {
            	openPopup(feature);
            	highlightFeature(feature);
			} else {
				dom.byId("mapDiv").style.cursor = "auto";
			}
        } );
    }


	function addPopupTemplate(response) {
		return arrayUtils.map(response, function(result) {
			var feature = result.feature;
			var layerName = result.layerName;

			if (layerName === "QUAKES_PUBLIC") {
                var quakeTemplate = new PopupTemplate( {
                    title: "KGS Network Earthquake",
                    content: quakeContent(feature)
                } );
                feature.popupTemplate = quakeTemplate;
            }

			return feature;
		} );
	}


	function quakeContent(feature) {
        var f = feature.attributes;
        // var ag = f.AGENCY !== "Null" ? f.AGENCY : "";
        // var ote = f.ORIGIN_TIME_ERR !== "Null" ? f.ORIGIN_TIME_ERR + " seconds" : "";
        var lat = f.LATITUDE !== "Null" ? f.LATITUDE : "";
        // var latErr = f.LATITUDE_ERR !== "Null" ? f.LATITUDE_ERR : "";
        var lon = f.LONGITUDE !== "Null" ? f.LONGITUDE : "";
        // var lonErr = f.LONGITUDE_ERR !== "Null" ? f.LONGITUDE_ERR : "";
        // var dep = f.DEPTH !== "Null" ? f.DEPTH : "";
        // var de = f.DEPTH_ERR !== "Null" ? f.DEPTH_ERR : "";
        var m = f.MAGNITUDE !== "Null" ? f.MAGNITUDE : "";
        var mt = f.MAGNITUDE_TYPE !== "Null" ? f.MAGNITUDE_TYPE : "";
        // var sas = f.SAS !== "Null" ? f.SAS : "";
        var co = f.COUNTY_NAME !== "Null" ? f.COUNTY_NAME : "";

        // if (f.LAYER === 'USGS') {
        //     var m = f.ML !== "Null" ? parseFloat(f.ML).toFixed(1) + " ml" : "";
        // }

        // if (dep) { dep = parseFloat(dep).toFixed(1) + " km"; }
        // if (de) {
        //     if (de === "0") {
        //         de = "0 (fixed)";
        //     } else {
        //         de = parseFloat(de).toFixed(1) + " km";
        //     }
        // }
        // var hu = "";
        // if (latErr && lonErr) {
        //     var horizontalUncertainty = Math.sqrt( Math.pow(latErr,2) + Math.pow(lonErr,2) );
        //     hu = horizontalUncertainty.toFixed(1) + " km";
        // }

        var content = "<table id='popup-tbl'>";
        content += "<tr><td>Magnitude (" + mt + "): </td><td>" + m + "</td></tr>";
        content += "<tr><td>Local Origin Time: </td><td>{LOCAL_TIME}</td></tr>";
        content += "<tr><td>UTC Origin Time: </td><td>{ORIGIN_TIME}</td><tr>";
        // content += "<tr><td>Origin Time Error: </td><td>" + ote + "</td></tr>";
        // content += "<tr><td>Seismic Action Score: </td><td>" + sas + "</td></tr>";
        content += "<tr><td>County: </td><td>" + co + "</td></tr>";
        // content += "<tr><td>Reporting Agency: </td><td>" + ag + "</td></tr>";
        content += "<tr><td>Latitude: </td><td>" + lat + "&deg;</td></tr>";
        content += "<tr><td>Longitude: </td><td>" + lon + "&deg;</td></tr>";
        content += "<tr><td>Quake ID: </td><td>{QUAKE_ID}</td></tr>";
        // content += "<tr><td>Horizontal Uncertainty: </td><td>" + hu + "</td></tr>";
        // content += "<tr><td>Depth: </td><td>" + dep + "</td></tr>";
        // content += "<tr><td>Vertical Uncertainty: </td><td>" + de + "</td></tr>";
        content += "</table>";

        return content;
    }


	function urlZoom(urlParams) {
        var items = urlParams.split("&");
        if (items.length > 1) {
            var extType = items[0].substring(5);
            var extValue = items[1].substring(3);

            switch (extType) {
				case "quake":
                    findParams.layerIds = [0];
                    findParams.searchFields = ["QUAKE_ID"];
                    break;
            }

            findParams.searchText = extValue;
            findTask.execute(findParams)
            .then(function(response) {
				var feature = response.results[0].feature;

				// Zoom to feature:
				var pt84 = new Point(feature.geometry.x, feature.geometry.y, new SpatialReference( { wkid: 4326} ) );
	            var wmPt = webMercatorUtils.geographicToWebMercator(pt84);
				view.center = wmPt;
		        view.scale = 60000;

				// Open popup:
                var quakeTemplate = new PopupTemplate( {
                    title: "KGS Network Earthquake",
                    content: quakeContent(feature)
                } );
                feature.popupTemplate = quakeTemplate;

				arrFeature =[feature];
				openPopup(arrFeature);
				// highlightFeature(feature);

				// Set from-date and magnitude and filter, displaying only this event:
				// var localDate = feature.attributes.LOCAL_TIME.substring(0, 10);
				// $("#from-date, #to-date").val(localDate);
				//
				// var m = feature.attributes.MAGNITUDE;
				// if (m >= 4) {
				// 	var mag = 4;
				// } else if (m >= 3 && m < 4) {
				// 	var mag = 3;
				// } else if (m >= 2 && m < 3) {
				// 	var mag = 2;
				// }
				// $("#mag").val(mag);
				$("#from-date, #to-date, #mag").val("");

				$("#filter-msg").html("Showing only quake ID " + feature.attributes.QUAKE_ID);

				var whereClause = "QUAKE_ID = " + feature.attributes.QUAKE_ID;
				quakesLayer.findSublayerById(0).definitionExpression = whereClause;
		        idDef[0] = whereClause;
            } );
        }
    }

} );
