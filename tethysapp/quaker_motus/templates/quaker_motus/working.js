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
          color: [255, 0, 0],
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
        color: [226, 19, 4, 0.75],
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
    view.on("click", GMACalculator);

	//main function
	var point;
    function GMACalculator(event) {

          graphicsLayer.removeAll();
          point = new Point({
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
          var featureSet = new FeatureSet();
          featureSet.features = inputGraphicContainer;


		  // input parameters
          var params = {
            "Input_Features": featureSet,

          };
          gp.submitJob(params).then(completeCallback, errBack, statusCallback);
    }

	function completeCallback(result){

        gp.getResultData(result.jobId, "Qfaults_2018_shapefile__2_").then(longestFault, drawResult, drawResultErrBack);

	}
<!--	need to define maxID outside of loop so it can be called later-->
	var maxID;
	function longestFault(data){
	    var i = 0
	    var maxLength = 0
	    maxID = 0;
	    var maxi = 0

      if (data.length >= 0) {
	    for (i = 0; i < data.length; i++) {
	        var faultLength = data.value.features[i].attributes.Shape_Length;
	        var faultID = data.value.features[i].attributes.fault_id;
	        if (faultLength > maxLength) {
	            maxLength = faultLength;
	            maxID = faultID;
	            maxi = i;
	        }
	    }
	    var polyline_feature = data.value.features[maxi];
	    polyline_feature.symbol = lineStyle;
	    graphicsLayer.add(polyline_feature);
	    }
	    endLoad(data);
	}

	function magnitudeCalc (maxID, point) {
//	this is where we calculate the magnitude



	}


	function drawResult(data){
	    polygon_feature = data
<!--	     polygon_feature = data.value.features[0];-->
		polygon_feature.symbol = fillSymbol;
		graphicsLayer.add(polygon_feature);
		endLoad(data); /////////////////end loading animation
	}

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



});