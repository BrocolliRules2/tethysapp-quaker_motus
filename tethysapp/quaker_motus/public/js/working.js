var app;
var featureSet;
var maxID;
var maxLength;
var dist;
var PHA;
var first_result;
var Magnitude;
var R;
var PHA_Eighty;
var PHA_Fifty;


require(["esri/Map","esri/layers/GraphicsLayer","esri/Graphic","esri/geometry/Point","esri/tasks/Geoprocessor","esri/tasks/support/LinearUnit","esri/tasks/support/FeatureSet","esri/views/MapView",  "dojo/domReady!", "esri/symbols/SimpleLineSymbol"
], function(Map, GraphicsLayer, Graphic, Point, Geoprocessor, LinearUnit, FeatureSet, MapView, LineStyle){

    var loading= document.getElementById("Loading");

	//a map with basemap
	var map = new Map({
    basemap: "streets"
	});

    //a graphics layer to show input point and output polygon
    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    var view = new MapView({
    container: "viewDiv",
    map: map,
	center: [-111.1, 39.1],
	zoom: 6
    });

	// symbol for input point
	var markerSymbol = {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          color: [25, 045, 10],
          outline: { // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 2
          }
        };

	// symbol for buffered polygon
    var fillSymbol = {
          type: "simple-fill", // autocasts as new SimpleFillSymbol()
          color: [226, 19, 4, 0.75],
          outline: { // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 1
          }
        };
      var lineStyle = {
        type: "simple-line", // autocasts as new SimpleFillSymbol()
        color: [124, 10, 2, 1],
        width: 3
      };



	// Geoprocessing service url
	var gpUrl = "http://geoserver2.byu.edu/arcgis/rest/services/Motus/FaultFinder/GPServer/Model";

    // create a new Geoprocessor
	var gp = new Geoprocessor(gpUrl);
	// define output spatial reference
    gp.outSpatialReference = { // autocasts as new SpatialReference()
          wkid: 102100 //EPSG3857
        };
	//add map click function

	view.on("click",startLoad);
    view.on("click",faultFinder);

	//main function
	// var point;

    function faultFinder(event) {

document.getElementById("PHA").innerHTML='';
    featureSet=null;
    maxID=null;
    maxLength=null;
    dist=null;
    PHA=0.00;
    first_result=null;
    Magnitude=null;
    R=0.00;
    PHA_Eighty=null;
    PHA_Fifty=null;
          graphicsLayer.removeAll();
            var point = new Point({
            longitude: event.mapPoint.longitude,
            latitude: event.mapPoint.latitude
          });
          var inputGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol
          });
          graphicsLayer.add(inputGraphic);
          var inputGraphicContainer = [];
          inputGraphicContainer.push(inputGraphic);
          featureSet = new FeatureSet();
          featureSet.features = inputGraphicContainer;


		  // input parameters
          var params = {
            "Input_Features": featureSet,

          };
          gp.submitJob(params).then(completeCallback, errBack, statusCallback);
    }

	function completeCallback(result){

        gp.getResultData(result.jobId, "Qfaults_2018_shapefile__2_").then(drawResult, drawResultErrBack);

	}

// need to define some variables outside of functions so it can be called in multiple

	function drawResult(data){

        maxLength = 0;

        for (i = 0; i < data.value.features.length; i++) {
            var faultLength = data.value.features[i].attributes.Shape_Leng;
            if (faultLength > maxLength) {
            maxLength = faultLength;
            maxID = data.value.features[i].attributes.FID;
            }


        }
        var polyline_feature = data.value.features[maxID];
        polyline_feature.symbol = lineStyle;
        graphicsLayer.add(polyline_feature);
        document.getElementById("PHA").innerHTML='Now click the "Calculate PHA" button!';
        endLoad();
        document.getElementById('button').disabled=false;

	}


	// Geoprocessing service url
	var gpUrl2 = "http://geoserver2.byu.edu/arcgis/rest/services/Motus/DistanceFinder/GPServer/Model";

    // create a new Geoprocessor
	var gp2 = new Geoprocessor(gpUrl2);
	// define output spatial reference

    function distanceFinder(event) {
    startLoad();
        var GPString = '"FID" = ' + maxID;

        //alert(GPString);

		  // input parameters
          var params = {
            "Expression": GPString,
            "Point__2_": featureSet

          };
          	if (maxID==null){
		    document.getElementById("PHA").innerHTML = "No faults were found within 60 kilometers.";
		    endLoad();
return;
	}
          gp2.submitJob(params).then(completeCallback2, errBack, statusCallback);
    }


    function completeCallback2(result){

        gp2.getResultData(result.jobId, "Point_result").then(drawResult2, drawResultErrBack);

	}

//	function magnitudeCalc () {
//    // this is where we calculate the magnitude
//    // we assume the "All" case for the fault slip type
//        var a = 5.08;
//        var b = 1.16;
//        Magnitude = a + b * Math.log(maxLength);
//	}

	function drawResult2(data) {
	// this is where we calculate the PHA
	// we assume the larger magnitude associated variables and that each fault is site Class C
        var a = 5.08;
        var b = 1.16;
        Magnitude = a + b * Math.log(maxLength);

	    var b1 = -0.038;
	    var b2 = 0.216;
	    var b3 = 0.0;
	    var b4 = 0.0;
	    var b5 = -0.777;
	    var b6 = 0.158;
	    var b7 = 0.254;
	    var h = 5.48;
	    var d = (data.value.features[0].attributes.NEAR_DIST)/1000;
	    var Gb = 0.0;
	    var Gc = 0.0;
	    R =  Math.sqrt(d*d+ h*h)/1000;
	    PHA=PHA.toPrecision(3);

	    PHA = (b1 + b2*(Magnitude - 6)+ b5*Math.log(R) + b3*(Magnitude - 6)^2 + b4*R  + b6*Gb + b7*Gc).toPrecision(3);
	    //x=PHA.toPrecision(3);

	    PHA_Eighty = PHA * .8;
	    PHA_Fifty = PHA* .5;

	    document.getElementById("PHA").innerHTML = "PHA: "+ PHA+" m/s^2<br>80% PHA: "+PHA_Eighty+" m/s^2<br>50% PHA: "+PHA_Fifty+" m/s^2";
	    endLoad();
	    document.getElementById('button').disabled=true;
//	    document.getElementById("PHA_Eighty").innerHTML = "PHA: "+ PHA_Eighty+ " m/s" + sup("2");
//	    document.getElementById("PHA_Fifty").innerHTML = "PHA: "+ PHA_Fifty + " m/s" + sup("2");


	}




//	function drawResult(data){
//	    polygon_feature = data
//<!--	     polygon_feature = data.value.features[0];-->
//		polygon_feature.symbol = fillSymbol;
//		graphicsLayer.add(polygon_feature);
//		endLoad(data); /////////////////end loading animation
//	}

	function drawResultErrBack(err) {
        console.log("draw result error: ", err);
    }

	function statusCallback(data) {
        console.log(data.jobStatus);

    }
    function errBack(err) {
        console.log("gp error: ", err);
    }

    function startLoad(graphic){
    loading.innerHTML= "<img id='loadingAnimation' src='../../../static/quaker_motus/images/loading.gif'>";
    }
    function endLoad(graphic){
    loading.innerText="";
    }

    // add public functions to variable app
    app = {distanceFinder: distanceFinder};


});