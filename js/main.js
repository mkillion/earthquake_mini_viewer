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
    "esri/widgets/Locate",
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
    Locate,
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
    var identifyTask, identifyParams;
    // var findTask = new FindTask(wwc5GeneralServiceURL);
    // var findParams = new FindParameters();
	// findParams.returnGeometry = true;

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
		// createTOC();

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

	var locateBtn = new Locate( {
        view: view
	}, "LocateButton" );
	view.ui.add(locateBtn, {
    	position: "top-left",
        index: 2
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

	// urlParams = location.search.substr(1);
    // urlZoom(urlParams);

    // Miscellaneous click handlers:
    // $(".find-header").click(function() {
    //     $("[id^=find]").fadeOut("fast");
    //     $(".find-header").removeClass("esri-icon-down-arrow");
    //     $(this).addClass("esri-icon-down-arrow");
    //     var findBody = $(this).attr("id");
    //     $("#find-"+findBody).fadeIn("fast");
    // } );

    // $(".esri-icon-erase").click(function() {
	// 	graphicsLayer.removeAll();
    // } );

	// $("#buff-tool").click(function() {
    //     $("#buff-dia").dialog("open");
    // } );

	// $("#buff-opts-btn").click(function() {
	// 	$("#buff-opts").toggleClass("show");
	// } );


    // function popCountyDropdown() {
    //     var cntyArr = new Array("Allen", "Anderson", "Atchison", "Barber", "Barton", "Bourbon", "Brown", "Butler", "Chase", "Chautauqua", "Cherokee", "Cheyenne", "Clark", "Clay", "Cloud", "Coffey", "Comanche", "Cowley", "Crawford", "Decatur", "Dickinson", "Doniphan", "Douglas", "Edwards", "Elk", "Ellis", "Ellsworth", "Finney", "Ford", "Franklin", "Geary", "Gove", "Graham", "Grant", "Gray", "Greeley", "Greenwood", "Hamilton", "Harper", "Harvey", "Haskell", "Hodgeman", "Jackson", "Jefferson", "Jewell", "Johnson", "Kearny", "Kingman", "Kiowa", "Labette", "Lane", "Leavenworth", "Lincoln", "Linn", "Logan", "Lyon", "McPherson", "Marion", "Marshall", "Meade", "Miami", "Mitchell", "Montgomery", "Morris", "Morton", "Nemaha", "Neosho", "Ness", "Norton", "Osage", "Osborne", "Ottawa", "Pawnee", "Phillips", "Pottawatomie", "Pratt", "Rawlins", "Reno", "Republic", "Rice", "Riley", "Rooks", "Rush", "Russell", "Saline", "Scott", "Sedgwick", "Seward", "Shawnee", "Sheridan", "Sherman", "Smith", "Stafford", "Stanton", "Stevens", "Sumner", "Thomas", "Trego", "Wabaunsee", "Wallace", "Washington", "Wichita", "Wilson", "Woodson", "Wyandotte");
	//
    //     for(var i=0; i<cntyArr.length; i++) {
    //         theCnty = cntyArr[i];
    //         $('#lstCounty').append('<option value="' + theCnty + '">' + theCnty + '</option>');
    //     }
    // }



	clearQuakeFilter = function() {
        graphicsLayer.removeAll();
        $("#from-date, #to-date, #mag").val("");
        quakesLayer.findSublayerById(0).definitionExpression = "";
        idDef[0] = "";
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


    // function urlZoom(urlParams) {
    //     var items = urlParams.split("&");
    //     if (items.length > 1) {
    //         var extType = items[0].substring(11);
    //         var extValue = items[1].substring(12);
	//
    //         findParams.contains = false;
	//
    //         switch (extType) {
    //             case "well":
    //                 findParams.layerIds = [0];
    //                 findParams.searchFields = ["kid"];
    //                 break;
    //             case "field":
    //                 findParams.layerIds = [1];
    //                 findParams.searchFields = ["field_kid"];
	// 				fieldsLayer.visible = true;
	//                 $("#Oil-and-Gas-Fields input").prop("checked", true);
    //                 break;
    //         }
	//
    //         findParams.searchText = extValue;
    //         findTask.execute(findParams)
    //         .then(function(response) {
	// 			return addPopupTemplate(response.results);
    //         } )
    //         .then(function(feature) {
	// 			if (feature.length > 0) {
	// 				openPopup(feature);
	//                 zoomToFeature(feature);
	// 			}
    //         } );
    //     }
    // }


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


    // jumpFocus = function(nextField,chars,currField) {
    //     if (dom.byId(currField).value.length == chars) {
    //         dom.byId(nextField).focus();
    //     }
    // }


    // findIt = function(what) {
	// 	searchWidget.clear();
	// 	graphicsLayer.removeAll();
	//
    //     switch (what) {
    //         case "plss":
    //             var plssText;
	//
    //             if (dom.byId('rngdir-e').checked == true) {
    //                 var dir = 'E';
    //             }
    //             else {
    //                 var dir = 'W';
    //             }
	//
    //             if (dom.byId('sec').value !== "") {
    //                 plssText = 'S' + dom.byId('sec').value + '-T' + dom.byId('twn').value + 'S-R' + dom.byId('rng').value + dir;
    //                 findParams.layerIds = [3];
    //                 findParams.searchFields = ["s_r_t"];
    //             }
    //             else {
    //                 plssText = 'T' + dom.byId('twn').value + 'S-R' + dom.byId('rng').value + dir;
    //                 findParams.layerIds = [4];
    //                 findParams.searchFields = ["t_r"];
    //             }
    //             findParams.searchText = plssText;
    //             break;
    //         case "api":
    //             var apiText = dom.byId('api_state').value + "-" + dom.byId('api_county').value + "-" + dom.byId('api_number').value;
	//
    //             if (dom.byId('api_extension').value != "") {
    //                 apiText = apiText + "-" + dom.byId('api_extension').value;
    //             }
    //             findParams.layerIds = [0];
    //             findParams.searchFields = ["api_number"];
    //             findParams.searchText = apiText;
	// 			findParams.contains = false;
    //             break;
    //         case "county":
    //             findParams.layerIds = [2];
    //             findParams.searchFields = ["county"];
    //             findParams.searchText = dom.byId("lstCounty").value;
    //             break;
    //         case "field":
    //             findParams.layerIds = [1];
    //             findParams.searchFields = ["field_name"];
    //             findParams.contains = false;
    //             findParams.searchText = dom.byId("field-select").value;
    //             fieldsLayer.visible = true;
    //             $("#Oil-and-Gas-Fields input").prop("checked", true);
	// 		case "kgsnum":
	// 			findParams.layerIds = [8];
	// 			findParams.searchFields = ["input_seq_number"];
	// 			findParams.searchText = dom.byId("kgs-id-num").value;
	// 			break;
    //     }
    //     findTask.execute(findParams).then(function(response) {
    //         zoomToFeature(response.results[0].feature);
	//
	// 		var query = new Query();
	// 		query.returnGeometry = true;
	// 		var selectWellType = $("input:radio[name=welltype]:checked").val();
	//
	// 		if (what === "plss") {
	// 			if (selectWellType !== "none") {
	// 				if (selectWellType === "Oil and Gas") {
	// 					var lyrID = "/0";
	// 					// Attributes to be included in download file:
	// 					query.outFields = ["KID","API_NUMBER","LEASE_NAME","WELL_NAME","STATE_CODE","COUNTY","FIELD_NAME","FIELD_KID","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","SUBDIVISION_1_LARGEST","SUBDIVISION_2","SUBDIVISION_3","SUBDIVISION_4_SMALLEST","SPOT","FEET_NORTH_FROM_REFERENCE","FEET_EAST_FROM_REFERENCE","REFERENCE_CORNER","ROTARY_TOTAL_DEPTH","ELEVATION_KB","ELEVATION_GL","ELEVATION_DF","PRODUCING_FORMATION","NAD27_LATITUDE","NAD27_LONGITUDE","OPERATOR_NAME","CURR_OPERATOR","PERMIT_DATE_TXT","SPUD_DATE_TXT","COMPLETION_DATE_TXT","PLUG_DATE_TXT","STATUS_TXT"];
	// 					wellsLayer.visible = true;
	//                     $("#Oil-and-Gas-Wells input").prop("checked", true);
	// 				} else {
	// 					// water.
	// 					var lyrID = "/8";
	// 					query.outFields = ["INPUT_SEQ_NUMBER","OWNER_NAME","USE_DESC","DWR_APPROPRIATION_NUMBER","MONITORING_NUMBER","COUNTY","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","QUARTER_CALL_1_LARGEST","QUARTER_CALL_2","QUARTER_CALL_3","NAD27_LATITUDE","NAD27_LONGITUDE","DEPTH_TXT","ELEV_TXT","STATIC_LEVEL_TXT","YIELD_TXT","STATUS","COMP_DATE_TXT","CONTRACTOR"];
	// 					wwc5Layer.visible = true;
	//                     $("#WWC5-Water-Wells input").prop("checked", true);
	// 				}
	//
	// 				query.where = "township="+dom.byId('twn').value+" and township_direction='S' and range="+dom.byId('rng').value+" and range_direction='"+dir+"'";
	// 				if (dom.byId('sec').value !== "") {
	// 					query.where += " and section=" + dom.byId('sec').value;
	// 				}
	// 			} else {
	// 				$("#wells-tbl").html("");
	// 			}
	// 		} else if (what === "field") {
	// 			if ( $("#field-list-wells").prop("checked") ) {
	// 				query.where = "FIELD_KID = " + response.results[0].feature.attributes.FIELD_KID;
	// 				query.outFields = ["KID","API_NUMBER","LEASE_NAME","WELL_NAME","STATE_CODE","COUNTY","FIELD_NAME","FIELD_KID","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","SUBDIVISION_1_LARGEST","SUBDIVISION_2","SUBDIVISION_3","SUBDIVISION_4_SMALLEST","SPOT","FEET_NORTH_FROM_REFERENCE","FEET_EAST_FROM_REFERENCE","REFERENCE_CORNER","ROTARY_TOTAL_DEPTH","ELEVATION_KB","ELEVATION_GL","ELEVATION_DF","PRODUCING_FORMATION","NAD27_LATITUDE","NAD27_LONGITUDE","OPERATOR_NAME","CURR_OPERATOR","PERMIT_DATE_TXT","SPUD_DATE_TXT","COMPLETION_DATE_TXT","PLUG_DATE_TXT","STATUS_TXT"];
	// 				var lyrID = "/0";
	// 				selectWellType = "Oil and Gas";
	// 			}
	// 		}
	//
	// 		var queryTask = new QueryTask( {
	// 			url: wwc5GeneralServiceURL + lyrID
	// 		} );
	//
	// 		queryTask.executeForCount(query).then(function(count) {
	// 			listCount = count;
	// 		} );
	//
	// 		queryTask.execute(query).then(function(results) {
	// 			createWellsList(results, selectWellType, dom.byId('twn').value, dom.byId('rng').value, dir, dom.byId('sec').value, listCount, what);
	// 		} );
	//
	// 		return addPopupTemplate(response.results);
    //     } ).then(function(feature) {
	// 		if (what === "api" || what === "field") {
	// 			openPopup(feature);
	// 		}
	// 	} );
    // }


	// function sortList(a, b) {
	// 	var att =  (a.attributes.API_NUMBER) ? "API_NUMBER" : "OWNER_NAME";
    //     var numA = a.attributes[att];
    //     var numB = b.attributes[att];
    //     if (numA < numB) { return -1 }
    //     if (numA > numB) { return 1 }
    //     return 0;
    // }


	// function createWellsList(fSet, wellType, twn, rng, dir, sec, count, what) {
	// 	if (sec) {
	// 		var locationString = "S" + sec + " - T" + twn + "S - R" + rng + dir;
	// 	} else if (twn) {
	// 		var locationString = "T" + twn + "S - R" + rng + dir;
	// 	} else {
	// 		var locationString = "buffer";
	// 	}
	//
	// 	if (what === "field") {
	// 		var wellsLst = "<div class='panel-sub-txt' id='list-txt'>List</div><div class='download-link'></div><div class='toc-note' id='sect-desc'>Oil and Gas Wells assigned to " + fSet.features[0].attributes.FIELD_NAME + "</div>";
	// 	} else {
	// 		var wellsLst = "<div class='panel-sub-txt' id='list-txt'>List</div><div class='download-link'></div><div class='toc-note' id='sect-desc'>" + wellType + " Wells in " + locationString + "</div>";
	// 	}
	//
	// 	$("#wells-tbl").html(wellsLst);
	// 	if (count > 2000) {
	// 		$("#wells-tbl").append("&nbsp;&nbsp;&nbsp;(listing 2000 of " + count + " records)");
	// 	}
	//
	// 	var apiNums = [];
	// 	var seqNums = [];
	// 	var apis,seqs;
	//
	// 	if (fSet.features.length > 0) {
	// 		fSet.features.sort(sortList);
	//
	// 		var downloadIcon = "<img id='loader' class='hide' src='images/ajax-loader.gif'><a class='esri-icon-download' title='Download List to Text File'></a>";
	// 		$("#list-txt").append(downloadIcon);
	// 		if (wellType === "Oil and Gas") {
	// 			var wellsTbl = "<table class='striped-tbl well-list-tbl' id='og-tbl'><tr><th>Name</th><th>API</th></tr>";
	// 			for (var i=0; i<fSet.features.length; i++) {
	// 				wellsTbl += "<tr><td style='width:48%'>" + fSet.features[i].attributes.LEASE_NAME + " " + fSet.features[i].attributes.WELL_NAME + "</td><td style='width:52%'>" + fSet.features[i].attributes.API_NUMBER + "</td><td class='hide'>" + fSet.features[i].attributes.KID + "</td></tr>";
	// 				apiNums.push(fSet.features[i].attributes.API_NUMBER);
	// 			}
	// 		} else {
	// 			var wellsTbl = "<table class='striped-tbl well-list-tbl' id='wwc5-tbl'><tr><th>Owner</th><th>Use</th></tr>";
	// 			for (var i=0; i<fSet.features.length; i++) {
	// 				wellsTbl += "<tr><td>" + fSet.features[i].attributes.OWNER_NAME + "</td><td>" + fSet.features[i].attributes.USE_DESC + "</td><td class='hide'>" + fSet.features[i].attributes.INPUT_SEQ_NUMBER + "</td></tr>";
	// 				seqNums.push(fSet.features[i].attributes.INPUT_SEQ_NUMBER);
	// 			}
	// 			wwc5Layer.visible = true;
	// 			$("#WWC5-Water-Wells input").prop("checked", true);
	// 		}
	// 		wellsTbl += "</table>";
	// 	} else {
	// 		if (view.zoom <= 13) {
	// 			var wellsTbl = "<div class='toc-note'>Zoom in and re-run buffer to list wells</div>";
	// 		} else {
	// 			var wellsTbl = "<div class='toc-note'>No wells found</div>";
	// 		}
	// 	}
	//
	// 	$("#wells-tbl").append(wellsTbl);
	//
	// 	if (apiNums.length > 0) {
	// 		apis = apiNums.join(",");
	// 	}
	// 	if (seqNums.length > 0) {
	// 		seqs = seqNums.join(",");
	// 	}
	//
	// 	var cfParams = { "twn": twn, "rng": rng, "dir": dir, "sec": sec, "type": wellType, "apis": apis, "seqs": seqs };
	// 	$(".esri-icon-download").click( {cf:cfParams}, downloadList);
	//
	// 	// Open tools drawer-menu:
	// 	$(".item").removeClass("item-selected");
	// 	$(".panel").removeClass("panel-selected");
	// 	$(".icon-wrench").closest(".item").addClass("item-selected");
	// 	$("#tools-panel").closest(".panel").addClass("panel-selected");
	//
	// 	// Select a well by clicking on table row:
	// 	$('.striped-tbl').find('tr').click(function() {
	// 		$(this).closest("tr").siblings().removeClass("highlighted");
    // 		$(this).toggleClass("highlighted");
	//
	// 		// Get id for that well from the table cell (KGS id numbers are in a hidden third column referenced by index = 2):
	// 		var kgsID =  $(this).find('td:eq(2)').text();
	//
	// 		if (wellType === "Oil and Gas" || what === "field") {
	// 			findParams.layerIds = [0];
	// 			findParams.searchFields = ["KID"];
	// 	        findParams.searchText = kgsID;
	// 		} else {
	// 			findParams.layerIds = [8];
	// 			findParams.searchFields = ["INPUT_SEQ_NUMBER"];
	// 	        findParams.searchText = kgsID;
	// 		}
	//
	// 		findTask.execute(findParams).then(function(response) {
	// 			return addPopupTemplate(response.results);
	//         } ).then(function(feature) {
	// 			if (feature.length > 0) {
	// 				view.goTo( {
	// 					target: feature[0].geometry,
	// 					zoom: 16
	// 				}, {duration: 750} ).then(function() {
	// 					highlightFeature(feature[0]);
	// 		            openPopup(feature);
	// 				} );
	// 			}
	//         } );
	// 	} );
	// }


	// downloadList = function(evt) {
	// 	$("#loader").show();
	//
	// 	var plssStr = "";
	// 	var data = {};
	//
	// 	if (evt.data.cf.sec) {
	// 		plssStr += "twn=" + evt.data.cf.twn + "&rng=" + evt.data.cf.rng + "&dir=" + evt.data.cf.dir + "&sec=" + evt.data.cf.sec + "&type=" + evt.data.cf.type;
	// 	} else if (evt.data.cf.twn) {
	// 		plssStr += "twn=" + evt.data.cf.twn + "&rng=" + evt.data.cf.rng + "&dir=" + evt.data.cf.dir + "&type=" + evt.data.cf.type;
	// 	} else {
	// 		// Download from buffer.
	// 		data = {"type": evt.data.cf.type, "apis": evt.data.cf.apis, "seqs": evt.data.cf.seqs};
	// 	}
	//
	// 	$.post( "downloadPointsInPoly.cfm?" + plssStr, data, function(response) {
	// 		$(".download-link").html(response);
	// 		$("#loader").hide();
	// 	} );
	// }


    // zoomToLatLong = function() {
	// 	graphicsLayer.removeAll();
	//
    //     var lat = dom.byId("lat").value;
    //     var lon = dom.byId("lon").value;
    //     var datum = dom.byId("datum").value;
	//
    //     var gsvc = new GeometryService("http://services.kgs.ku.edu/arcgis8/rest/services/Utilities/Geometry/GeometryServer");
    //     var params = new ProjectParameters();
    //     var wgs84Sr = new SpatialReference( { wkid: 4326 } );
	//
    //     if (lon > 0) {
    //         lon = 0 - lon;
    //     }
	//
	// 	switch (datum) {
	// 		case "nad27":
	// 			var srId = 4267;
	// 			break;
	// 		case "nad83":
	// 			var srId = 4269;
	// 			break;
	// 		case "wgs84":
	// 			var srId = 4326;
	// 			break;
	// 	}
	//
    //     var p = new Point(lon, lat, new SpatialReference( { wkid: srId } ) );
    //     params.geometries = [p];
    //     params.outSR = wgs84Sr;
	//
    //     gsvc.project(params).then( function(features) {
    //         var pt84 = new Point(features[0].x, features[0].y, wgs84Sr);
    //         var wmPt = webMercatorUtils.geographicToWebMercator(pt84);
	//
    //         var ptSymbol = new SimpleMarkerSymbol( {
    //             style: "x",
    //             size: 22,
    //             outline: new SimpleLineSymbol( {
    //               color: [255, 0, 0],
    //               width: 4
    //             } )
    //         } );
	//
    //         var pointGraphic = new Graphic( {
    //             geometry: wmPt,
    //             symbol: ptSymbol
    //         } );
	//
	// 		view.goTo( {
	// 			target: wmPt,
	// 			zoom: 16
	// 		}, {duration: 750} ).then(function() {
	//             graphicsLayer.add(pointGraphic);
	// 		} );
    //     } );
    // }


	// resetFinds = function() {
	// 	searchWidget.clear();
	// 	$("#twn, #rng, #sec, #datum, #lstCounty").prop("selectedIndex", 0);
	// 	$("#rngdir-w").prop("checked", "checked");
	// 	$("[name=welltype]").filter("[value='none']").prop("checked",true);
	// 	$("#api_state, #api_county, #api_number, #api_extension, #lat, #lon, #field-select, #kgs-id-num").val("");
	// }


	// originalLocation = function() {
	// 	urlZoom(urlParams);
	// }


	// addBookmark = function() {
	// 	console.log("add bookmark");
	// }


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
		content += '<tr><td>From Date:</td><td><input class="txtinput" type="text" size="14" id="from-date" placeholder="mm/dd/yyyy"></td></tr>';
		content += '<tr><td>To Date:</td><td><input class="txtinput" type="text" size="14" id="to-date" placeholder="mm/dd/yyyy"></td></tr>';
		content += '<tr><td>Magnitude:</td>';
		content += '<td><select class="txtinput" name="mag" id="mag">';
		content += '<option value="all" selected>All</option><option value="2">2.0 to 2.9</option><option value="3">3.0 to 3.9</option><option value="4">4.0 and greater</option>';
		content += '</select></td></tr>';
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


	// function createTOC() {
    //     var lyrs = map.layers;
    //     var chkd, tocContent = "";
	// 	var aerialTocContent = "";
	// 	// var ungroupedTocContent = "";
	// 	var aerialGroup = ["2015-Aerials","2014-1ft-Aerials","2002-Aerials","1991-Aerials"];
	// 	// var ungroupedLayers = ["Section-Township-Range","WWC5-Water-Wells","Topo"];
    //     var transparentLayers = ["Topo","2015 Aerials","2014 1ft Aerials","2002 Aerials","1991 Aerials"];
	//
    //     for (var j=lyrs.length - 1; j>-1; j--) {
    //         var layerID = lyrs._items[j].id;
    //         chkd = map.findLayerById(layerID).visible ? "checked" : "";
	// 		var htmlID = layerID.replace(/ /g, "-");
	//
	// 		if (layerID.indexOf("-layer-") === -1 && aerialGroup.indexOf(htmlID) === -1 && layerID.indexOf("Base Map") === -1) {
    //             // ^ Excludes default graphics layer from the TOC and separates grouped and ungrouped layers.
    //             tocContent += "<div class='toc-item' id='" + htmlID + "'><label><input type='checkbox' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label>";
	//
    //             if ($.inArray(layerID, transparentLayers) !== -1) {
    //                 // Add transparency control buttons to specified layers.
    //                 tocContent += "</span><span class='esri-icon-forward toc-icon' title='Make Layer Opaque' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;up&quot;);'></span><span class='esri-icon-reverse toc-icon' title='Make Layer Transparent' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;down&quot;);'>";
    //             }
	//
    //             tocContent += "</div>";
    //         }
	//
	// 		if (aerialGroup.indexOf(htmlID) > -1) {
	// 			aerialTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='checkbox' class='filterable' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label><span class='esri-icon-forward toc-icon' title='Make Layer Opaque' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;up&quot;);'></span><span class='esri-icon-reverse toc-icon' title='Make Layer Transparent' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;down&quot;);'></span></div>";
	// 		}
	//
	// 		if (layerID.indexOf("Base Map") > -1) {
    //         	var basemapTocContent = "<div class='toc-item' id='" + htmlID + "'><label><input type='checkbox' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label>";
	// 		}
	//
    //     }
	// 	tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="aerial-group"><span class="find-hdr-txt"> Aerials</div>';
	// 	tocContent += '<div class="find-body hide" id="aerial-group-body"></div>';
	// 	tocContent += basemapTocContent + "</div>";
	//
    //     tocContent += "<span class='toc-note'>* Some layers only visible when zoomed in</span>";
    //     $("#lyrs-toc").html(tocContent);
	// 	$("#aerial-group-body").html(aerialTocContent);
	//
	// 	// Click handlers for TOC groups:
	// 	$(".group-hdr").click(function() {
	// 		var group = $(this).attr("id");
	// 		if ( $(this).hasClass("esri-icon-down-arrow") ) {
	// 			$("#" + group + "-body").fadeOut("fast");
	// 		} else {
	// 			$("#" + group + "-body").fadeIn("fast");
	// 		}
	// 		$(this).toggleClass("esri-icon-down-arrow esri-icon-right-triangle-arrow no-border");
	// 	} );
	//
	// 	// Click handler for TOC checkboxes:
	// 	// $("[id^='tcb-']").change(function() {
	// 	// 	saveTocPrefs(this.id);
	// 	// } );
    //     //
	// 	// // Click handler for TOC basemap radios:
	// 	// $("[name='bm']").change(function() {
	// 	// 	saveRadioPrefs("bas-" + this.value);
	// 	// } );
    // }


    // changeOpacity = function(id, dir) {
    //     var lyr = map.findLayerById(id);
    //     var incr = (dir === "down") ? -0.2 : 0.2;
    //     lyr.opacity = lyr.opacity + incr;
    // }


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


    // function wwc5Content(feature) {
    //     var content = "<table id='popup-tbl'><tr><td>County:</td><td>{COUNTY}</td></tr>";
    //     content += "<tr><td>Section:</td><td>T{TOWNSHIP}S&nbsp;&nbsp;R{RANGE}{RANGE_DIRECTION}&nbsp;&nbsp;Sec {SECTION}</td></tr>";
    //     content += "<tr><td>Quarter Section:</td><td>{QUARTER_CALL_3}&nbsp;&nbsp;{QUARTER_CALL_2}&nbsp;&nbsp;{QUARTER_CALL_1_LARGEST}</td></tr>";
	// 	content += "<tr><td>Latitude, Longitude (NAD27):</td><td>{NAD27_LATITUDE},&nbsp;&nbsp;{NAD27_LONGITUDE}</td></tr>";
	// 	content += "<tr><td>Owner:</td><td>{OWNER_NAME}</td></tr>";
    //     content += "<tr><td>Status:</td><td>{STATUS}</td></tr>";
    //     content += "<tr><td>Depth (ft):</td><td>{DEPTH_TXT}</td></tr>";
    //     content += "<tr><td>Static Water Level (ft):</td><td>{STATIC_LEVEL_TXT}</td></tr>";
    //     content += "<tr><td>Estimated Yield (gpm):</td><td>{YIELD_TXT}</td></tr>";
    //     content += "<tr><td>Elevation (ft):</td><td>{ELEV_TXT}</td></tr>";
    //     content += "<tr><td>Use:</td><td style='white-space:normal'>{USE_DESC}</td></tr>";
    //     content += "<tr><td>Completion Date:</td><td>{COMP_DATE_TXT}</td></tr>";
    //     content += "<tr><td>Driller:</td><td style='white-space:normal'>{CONTRACTOR}</td></tr>";
    //     content += "<tr><td>DWR Application Number:</td><td>{DWR_APPROPRIATION_NUMBER}</td></tr>";
    //     content += "<tr><td>Other ID:</td><td>{MONITORING_NUMBER}</td></tr>";
    //     content += "<tr><td>KGS Record Number:</td><td id='seq-num'>{INPUT_SEQ_NUMBER}</td></tr></table>";
	//
    //     return content;
    // }


    // function fieldContent(feature) {
    //     var f = feature.attributes;
    //     var po = f.PROD_OIL !== "Null" ? f.PROD_OIL : "";
    //     var co = f.CUMM_OIL !== "Null" ? f.CUMM_OIL.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
    //     var pg = f.PROD_GAS !== "Null" ? f.PROD_GAS : "";
    //     var cg = f.CUMM_GAS !== "Null" ? f.CUMM_GAS.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
    //     var ac = f.APPROXACRE !== "Null" ? f.APPROXACRE.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
    //     var frm = f.FORMATIONS.split(",");
    //     var pf = "";
    //     for (var i=0; i<frm.length; i++) {
    //         pf += frm[i] + "<br>";
    //     }
	//
    //     var content = "<table id='popup-tbl'><tr><td>Type of Field:</td><td>{FIELD_TYPE}</td></tr>";
    //     content += "<tr><td>Status:</td><td>{STATUS}</td></tr>";
    //     content += "<tr><td>Produces Oil:</td><td>" + po + "</td></tr>";
    //     content += "<tr><td>Cumulative Oil (bbls):</td><td>" + co + "</td></tr>";
    //     content += "<tr><td>Produces Gas:</td><td>" + pg + "</td></tr>";
    //     content += "<tr><td>Cumulative Gas (mcf):</td><td>" + cg + "</td></tr>";
    //     content += "<tr><td>Approximate Acres:</td><td>" + ac + "</td></tr>";
    //     content += "<tr><td>Producing Formations:</td><td>" + pf + "</td></tr>";
    //     content += "<span id='field-kid' class='hide'>{FIELD_KID}</span></table>";
	//
    //     return content;
    // }


    // function wellContent(feature) {
    //     var f = feature.attributes;
	//
    //     var dpth = f.ROTARY_TOTAL_DEPTH !== "Null" ? f.ROTARY_TOTAL_DEPTH.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
    //     var elev = f.ELEVATION_KB !== "Null" ? f.ELEVATION_KB.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
	//
    //     var content = "<table id='popup-tbl'><tr><td>API:</td><td>{API_NUMBER}</td></tr>";
	// 	content += "<tr><td>Original Operator:</td><td>{OPERATOR_NAME}</td></tr>";
    //     content += "<tr><td>Current Operator:</td><td>{CURR_OPERATOR}</td></tr>";
    //     content += "<tr><td>Well Type:</td><td>{STATUS_TXT}</td></tr>";
    //     content += "<tr><td>Status:</td><td>{WELL_CLASS}</td></tr>";
    //     content += "<tr><td>Lease:</td><td>{LEASE_NAME}</td></tr>";
    //     content += "<tr><td>Well:</td><td>{WELL_NAME}</td></tr>";
    //     content += "<tr><td>Field:</td><td>{FIELD_NAME}</td></tr>";
    //     content += "<tr><td>Location:</td><td>T{TOWNSHIP}S&nbsp;&nbsp;R{RANGE}{RANGE_DIRECTION}&nbsp;&nbsp;Sec {SECTION}<br>{SPOT}&nbsp;{SUBDIVISION_4_SMALLEST}&nbsp;{SUBDIVISION_3}&nbsp;{SUBDIVISION_2}&nbsp;{SUBDIVISION_1_LARGEST}</td></tr>";
    //     content += "<tr><td>Latitude, Longitude (NAD27):</td><td>{NAD27_LATITUDE},&nbsp;&nbsp;{NAD27_LONGITUDE}</td></tr>";
    //     content += "<tr><td>County:</td><td>{COUNTY}</td></tr>";
    //     content += "<tr><td>Permit Date:</td><td>{PERMIT_DATE_TXT}</td></tr>";
    //     content += "<tr><td>Spud Date:</td><td>{SPUD_DATE_TXT}</td></tr>";
    //     content += "<tr><td>Completion Date:</td><td>{COMPLETION_DATE_TXT}</td></tr>";
    //     content += "<tr><td>Plug Date:</td><td>{PLUG_DATE_TXT}</td></tr>";
    //     content += "<tr><td>Total Depth (ft):</td><td>" + dpth + "</td></tr>";
    //     content += "<tr><td>Elevation (KB, ft):</td><td>" + elev + "</td></tr>";
    //     content += "<tr><td>Producing Formation:</td><td>{PRODUCING_FORMATION}</td></tr>";
    //     content += "<span id='well-kid' class='hide'>{KID}</span></table>";
	//
    //     return content;
    // }


    // toggleLayer = function(j) {
    //     var l = map.findLayerById(map.layers._items[j].id);
    //     l.visible = $("#tcb-" + j).is(":checked") ? true : false;
    // }

} );
