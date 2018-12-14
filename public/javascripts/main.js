//If you changed the csv files' names, attributes' names, you should change 'csvFileTitle' to new values.
//You shouldn't change other code except this object.
//But I recommend you to change your csv files' format and name, letting them exactly the same as ones in './dataexample', instead of changing code here.
var csvFileTitle = {
    csvFileUrl:"./data/Origin_Dest_Zones_by_Trip_Purpose_3776.csv",
    centroid_csvFileUrl:"./data/centroid_edmonton.csv",
    origin_zone:"OriginZoneTAZ1669EETP",
    origin_district:"OriginZoneDistrictTAZ1669EETP",
    origin_x:"Origin_XCoord",
    origin_y:"Origin_YCoord",
    dest_zone:"DestZoneTAZ1669EETP",
    dest_district:"DestZoneDistrictTAZ1669EETP",
    dest_x:"Dest_XCoord",
    dest_y:"Dest_YCoord",
    weight:"Total"
};
//the ID attribute's name of travel zone layer
var travelZoneLayerIDTitle = 'TAZ_New';
var travelMatrix ={};//store travel value
var centroidMatrix = {}; //store centroids of zones
var map; //store map object
var selectZone='101'; //default selected zone
var selectedZoneHighlightLayer; //highlight the selected zone
var check = false; //'O to D' or 'D to O'
var selectType = 'W';
//default value of the slider is 3
//if you want to change this value, you also need to change the corresponding HTML code
var circleScale = $('#circleScaleRange').val(); //It can be changed to some other value. Change it and adjust it if you want.
//three sample circles show relation between circle size and travel volume
var legendBaseSize = {
    'Small':20,
    'Medium':40,
    'Large':60
};
require(["esri/renderers/SimpleRenderer","esri/SpatialReference","esri/geometry/Point",
    "esri/geometry/webMercatorUtils","dojo/dom","esri/layers/GraphicsLayer",
    "esri/geometry/Polyline","esri/geometry/Extent","dojo/dom-construct",
    "esri/tasks/query", "esri/graphic", "dojo/_base/array",
    "esri/dijit/Popup", "esri/dijit/PopupTemplate", "dojo/dom-class",
    "esri/dijit/BasemapToggle", "esri/dijit/Legend", "esri/map",
    "esri/layers/FeatureLayer", "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol","esri/symbols/SimpleMarkerSymbol", "esri/renderers/ClassBreaksRenderer",
    "esri/Color", "dojo/dom-style", "dojo/domReady!"
], function(SimpleRenderer,SpatialReference,Point,
            webMercatorUtils,dom,GraphicsLayer,
            Polyline,Extent,domConstruct,
            Query,Graphic,arrayUtils,
            Popup, PopupTemplate,domClass,
            BasemapToggle,Legend,Map,
            FeatureLayer, InfoTemplate, SimpleFillSymbol,
            SimpleLineSymbol,SimpleMarkerSymbol, ClassBreaksRenderer,
            Color, domStyle
) {
    //show the legend on the map
    renewLegend();
    var q = d3.queue();
    //read csv files
    //after the reading process, it will call brushmap function
    q.defer(d3.csv,csvFileTitle.csvFileUrl)
        .defer(d3.csv,csvFileTitle.centroid_csvFileUrl)
        .await(brushMap);
    //main function
    function brushMap(error,data,centroidData){
        //get a list storing different travel types
        var uniqueTravelType = data.map(data => data.Purpose_Category)
            .filter((value, index, self) => self.indexOf(value) === index);
        //read csv data into specific format
        travelMatrix = splitDataIntoTravelMatrix(uniqueTravelType,data);
        centroidMatrix = convertCentroidToDict(centroidData);
        //dynamic fill the flowTable based on unique travel type
        uniqueTravelType.forEach(function(key){

            if(key === selectType){
                $("#flowTable").append('<tr class="clickableRow2 selected"><td>'+key+'</td></tr>');
            }
            else{
                $("#flowTable").append('<tr class="clickableRow2"><td>'+key+'</td></tr>');

            }
        });
        //since there is not a travel type called 'All', I have to add it manually
        $("#flowTable").append('<tr class="clickableRow2"><td>All</td></tr>');
        //add clicking event to the rows in the table
        $(".clickableRow2").on("click", function() {
            //highlight selected row
            $("#flowTable tr").removeClass("selected");
            var rowItem = $(this).children('td').map(function () {
                return this.innerHTML;
            }).toArray();
            $(this).addClass("selected");
            selectType=rowItem[0];//read the selected type
            //redraw circles on the map
            redrawCircles(selectZone);

        });
        map = new Map("map", {
            center: [-113.4947, 53.5437],
            zoom: 10,
            basemap: "gray",
            minZoom: 3,
            slider:false
        });
        //basemap toggle
        var toggle = new BasemapToggle({
            map: map,
            basemap: "streets"
        }, "viewDiv");
        toggle.startup();
        map.setInfoWindowOnClick(true);
        //travelZonelayer
        var travelZoneLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],

        });
        //hydro layer
        var HydroLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/ArcGIS/rest/services/edmontonHydro/FeatureServer/0", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],

        });
        //LRT layer
        var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });
        //Circle Layer
        var circleLayer=new GraphicsLayer({ id: "selectedZoneCircleLayer" });
        //plot the travel zone layer with some color
        var symbol = new SimpleFillSymbol();
        var renderer = new ClassBreaksRenderer(symbol, function(feature){
            return 1
        });
        renderer.addBreak(0, 2, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.3]),1)).setColor(new Color([255, 255, 255,0.30])));
        travelZoneLayer.setRenderer(renderer);
        map.on('load', function () {
            map.addLayer(travelZoneLayer);
            map.addLayer(lrtFeatureLayer);
            map.addLayer(HydroLayer);
        });
        //symbol for highlighting the selected zone
        var highlightSymbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([0,225,225]), 2
            ),
            new Color([0,225,225,0.5])
        );

        //add clicking event on travelZoneLayer
        travelZoneLayer.on('click', function (evt) {
            if(typeof(selectedZoneHighlightLayer)!=='undefined'){
                map.removeLayer(selectedZoneHighlightLayer);
            }
            //reinitialize
            selectedZoneHighlightLayer = new GraphicsLayer({ id: "selectedZoneHighlightLayer" });
            //read current clicked zone
            selectZone = evt.graphic.attributes[travelZoneLayerIDTitle];
            console.log(selectZone);
            var query = new Query();
            query.geometry = pointToExtent(map, event.mapPoint, 10);
            var deferred = travelZoneLayer.selectFeatures(query,
                travelZoneLayer.SELECTION_NEW);

            var graphic = new Graphic(evt.graphic.geometry, highlightSymbol);
            selectedZoneHighlightLayer.add(graphic);
            map.addLayer(selectedZoneHighlightLayer);

            //redraw the circles
            redrawCircles(selectZone);
        });
        //read user's mouse location
        function pointToExtent(map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleranceInMapCoords = toleranceInPixel * pixelWidth;
            return new Extent(point.x - toleranceInMapCoords,
                point.y - toleranceInMapCoords,
                point.x + toleranceInMapCoords,
                point.y + toleranceInMapCoords,
                map.spatialReference);
        }
        //the slider to switch between 'trips to the zone' and 'trips from the zone'
        $("#interact").click(function(e, parameters) {
            if($("#interact").is(':checked')){
                $('#interactLabel').html('Trips&nbspFrom&nbspSelected&nbspZone');
                check= true;
                redrawCircles(selectZone)
            }
            else{
                $('#interactLabel').html('Trips&nbspTo&nbspSelected&nbspZone');
                check= false;
                redrawCircles(selectZone)
            }
        });
        //handle redrawing request
        function redrawCircles(selectZone){
            map.removeLayer(circleLayer);
            circleLayer = new GraphicsLayer({ id: "selectedZoneCircleLayer" });
            // map.infoWindow.setFeatures([deferred]);
            map.addLayer(circleLayer);
            //check === true. yellow color
            //Trips from the selected zone
            if(check === false){
                for(var dest in travelMatrix[selectType][selectZone]){

                    var destSymbol = new SimpleMarkerSymbol({
                        "color":[255,200,0,200],
                        "size":travelMatrix[selectType][selectZone][dest]/circleScale, // See! the size is different for each circle
                        "angle":0,
                        "xoffset":0,
                        "yoffset":0,
                        "type":"esriSMS",
                        "style":"esriSMSCircle",
                        "outline":{
                            "color":[255,200,0,200],
                            "width":1,
                            "type":"esriSLS",
                            "style":"esriSLSSolid"
                        }
                    });
                    //clicked to some zone without any data
                    if(typeof(centroidMatrix[dest])==='undefined'){
                        continue;
                    }
                    var p = new Point(centroidMatrix[dest][0],centroidMatrix[dest][1]);
                    var attr = {"Value": Math.round(travelMatrix[selectType][selectZone][dest])};
                    var infoTemplate = new InfoTemplate("Trips Number","Value: ${Value} <br/>");
                    var circle = new Graphic(p,destSymbol,attr,infoTemplate);
                    circleLayer.add(circle);
                }

            }
            //check==false. blue circles
            //Trips to the selected zone
            else{
                for(var origin in travelMatrix[selectType]){
                    if(typeof(travelMatrix[selectType][origin][selectZone])!=='undefined'){

                        var orginSymbol = new SimpleMarkerSymbol({
                            "color":[0,200,255,200],
                            "size":travelMatrix[selectType][origin][selectZone]/circleScale,
                            "angle":0,
                            "xoffset":0,
                            "yoffset":0,
                            "type":"esriSMS",
                            "style":"esriSMSCircle",
                            "outline":{
                                "color":[0,200,255,200],
                                "width":1,
                                "type":"esriSLS",
                                "style":"esriSLSSolid"
                            }
                        });
                        if(typeof(centroidMatrix[origin])==='undefined'){
                            continue;
                        }

                        var p = new Point(centroidMatrix[origin][0],centroidMatrix[origin][1]);
                        var attr = {"Value":Math.round(travelMatrix[selectType][origin][selectZone])};
                        var infoTemplate = new InfoTemplate("Trips Number","Value: ${Value} <br/>");

                        var circle = new Graphic(p,orginSymbol,attr,infoTemplate);
                        circleLayer.add(circle);

                    }
                }
            }
            circleLayer.redraw();
        }
        //trigger the slider event to adjust the circle size
        $('#circleScaleRange').change(function(e) {
            circleScale=this.value;//read current slider value
            renewLegend();
            redrawCircles(selectZone)
        });
    }
});
//renew that three samle circles' sizes
function renewLegend(){
    $('#circleLegendSmallLabel').html(legendBaseSize['Small']*circleScale);
    $('#circleLegendMediumLabel').html(legendBaseSize['Medium']*circleScale);
    $('#circleLegendLargeLabel').html(legendBaseSize['Large']*circleScale);
}
//read csv file into desired json format
//Also, calculate an aggregation result for 'All' type and store into json object
function splitDataIntoTravelMatrix(uniqueTravelType,data){
    var dataMatrix = {};
    var travelM = {};
    for(var i=0;i<uniqueTravelType.length;i++){
        var thisTravelType = uniqueTravelType[i];
        var dataOfThisTravelType = [];
        for(var j in data){
            if(data[j].Purpose_Category === thisTravelType){
                var thisDataArray = [Number(data[j][csvFileTitle.origin_x]),Number(data[j][csvFileTitle.origin_y]),Number(data[j][csvFileTitle.dest_x]),Number(data[j][csvFileTitle.dest_y]),Number(data[j][csvFileTitle.weight]),data[j][csvFileTitle.origin_zone],data[j][csvFileTitle.dest_zone],data[j][csvFileTitle.origin_district],data[j][csvFileTitle.dest_district]];
                dataOfThisTravelType.push(thisDataArray);
            }
        }
        travelM[thisTravelType] = dataOfThisTravelType;
    }
    var minZoneNum = Infinity;
    var maxZoneNum = -Infinity;
    for(var type in travelM){
        dataMatrix[type] = {};
        for(var k in travelM[type]){
            if(typeof(dataMatrix[type][travelM[type][k][5]])==='undefined'){
                var zoneNum = Number(travelM[type][k][5]);
                if(zoneNum>maxZoneNum){
                   maxZoneNum = zoneNum;
                }
                if(zoneNum<minZoneNum){
                    minZoneNum=zoneNum;
                }
                dataMatrix[type][zoneNum]={};
            }
            dataMatrix[type][travelM[type][k][5]][travelM[type][k][6]] = travelM[type][k][4];
        }
    }
    dataMatrix['All'] = {};
    for(var i = minZoneNum;i<maxZoneNum;i++){
        dataMatrix['All'][i]={};

        for(var j=minZoneNum;j<maxZoneNum;j++){

            var tmp = 0;
            for(var t in dataMatrix){
                if(t!=='All'){
                    if(typeof(dataMatrix[t][i])!=='undefined'){
                        if(typeof(dataMatrix[t][i][j])!=='undefined'){
                            tmp +=dataMatrix[t][i][j]
                        }
                    }
                }

            }
            dataMatrix['All'][i][j] = tmp
        }
    }
    return dataMatrix;
}
//read csv into some format
function convertCentroidToDict(centroidData){
     var centroidDict = {};
     for(var index in centroidData){
         centroidDict[centroidData[index][travelZoneLayerIDTitle]] = [centroidData[index].x,centroidData[index].y]
     }
    return centroidDict;
}
