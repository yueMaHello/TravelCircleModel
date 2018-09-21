var csvFileTitle = {
    csvFileUrl:"./data/Origin_Dest_Zones_by_Trip_Purpose_3776.csv",
    centroid_csvFileUrl:"./data/Centroids_for_Edmonton_RTM_TAZ20180305_0.csv",
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
var travelMatrix ={};
var centroidMatrix = {};
var map;
var selectZone='101';
var hoverZone;
var selectedZoneHighlightLayer;
var check = false; //O to D or D to O
var selectType = 'Work';
var circleScale = 3;
require(["esri/renderers/SimpleRenderer","esri/SpatialReference","esri/geometry/Point",
    "esri/geometry/webMercatorUtils","dojo/dom",
    "esri/layers/GraphicsLayer",
    "esri/geometry/Polyline",
    "esri/geometry/Extent",
    "dojo/dom-construct",
    "esri/tasks/query",
    "esri/graphic",
    "dojo/_base/array",
    "esri/dijit/Popup",
    "esri/dijit/PopupTemplate",
    "dojo/dom-class",
    "esri/dijit/BasemapToggle",
    "esri/dijit/Legend",
    "esri/map", "esri/layers/FeatureLayer",
    "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol","esri/symbols/SimpleMarkerSymbol",
    "esri/renderers/ClassBreaksRenderer",
    "esri/Color", "dojo/dom-style", "dojo/domReady!"
], function(SimpleRenderer,SpatialReference,Point,webMercatorUtils,dom,GraphicsLayer,Polyline,
            Extent,domConstruct,
            Query,Graphic,arrayUtils,Popup, PopupTemplate,domClass,BasemapToggle,Legend,Map, FeatureLayer,
            InfoTemplate, SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,
            ClassBreaksRenderer,
            Color, domStyle
) {

    var q = d3.queue();
    q.defer(d3.csv,csvFileTitle.csvFileUrl)
        .defer(d3.csv,csvFileTitle.centroid_csvFileUrl)
        .await(brushMap);

    function brushMap(error,data,centroidData){
        //get a list storing different travel types
        var uniqueTravelType = data.map(data => data.Purpose_Category)
            .filter((value, index, self) => self.indexOf(value) === index);

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
        $("#flowTable").append('<tr class="clickableRow2"><td>All</td></tr>');

        $(".clickableRow2").on("click", function() {
            //highlight selected row
            $("#flowTable tr").removeClass("selected");
            var rowItem = $(this).children('td').map(function () {
                return this.innerHTML;
            }).toArray();
            $(this).addClass("selected");
            selectType=rowItem[0];
            console.log(selectType)
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
        //LRT layer
        var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });
        var circleLayer=new GraphicsLayer({ id: "selectedZoneCircleLayer" });

        var symbol = new SimpleFillSymbol();

        var renderer = new ClassBreaksRenderer(symbol, function(feature){
            return 1
        });

        renderer.addBreak(0, 2, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.3]),1)).setColor(new Color([255, 255, 255,0.30])));
        travelZoneLayer.setRenderer(renderer);


        map.on('load', function () {
            map.addLayer(travelZoneLayer);
            map.addLayer(lrtFeatureLayer);
            /*travelZoneLayer.redraw();*/
        });
        travelZoneLayer.on('click', function (evt) {
            // console.log(graphic)s

            if(typeof(selectedZoneHighlightLayer)!=='undefined'){
                map.removeLayer(selectedZoneHighlightLayer);
            }
            selectedZoneHighlightLayer = new GraphicsLayer({ id: "selectedZoneHighlightLayer" });

            selectZone = evt.graphic.attributes.TAZ_New;
            var query = new Query();
            query.geometry = pointToExtent(map, event.mapPoint, 10);
            var deferred = travelZoneLayer.selectFeatures(query,
                travelZoneLayer.SELECTION_NEW);
            var highlightSymbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0,225,225]), 2
                ),
                new Color([0,225,225,0.5])
            );
            var graphic = new Graphic(evt.graphic.geometry, highlightSymbol);
            selectedZoneHighlightLayer.add(graphic);
            map.addLayer(selectedZoneHighlightLayer);
            redrawCircles(selectZone);
        });

        // var largestIndividualArray = findRangeForIndividualCalcultion();
        // sort = Object.values(largestIndividualArray).sort((prev, next) => prev - next); //from smallest to largest
        // sort = sort.map(x => x.toFixed(2)); //make legend to 2 decimal numbers.

        //mouse over event
        travelZoneLayer.on('mouse-over', function (evt) {

            var graphic = evt.graphic;
            hoverZone = graphic.attributes.TAZ_New;
            //generate info window when mousing over the zone
            var access;
            if (check === false) {
                    try{
                        access = travelMatrix[selectType][selectZone][hoverZone]||0;
                    }
                    catch (e) {
                        access = 0
                    }
            }
            else {
                    try{
                        access = travelMatrix[selectType][hoverZone][selectZone]||0;
                    }
                    catch (e) {
                        access = 0
                    }
            }
            map.infoWindow.setTitle("<b>Zone Number: </b>" + hoverZone);
            if (typeof(access) !== 'undefined') {
                map.infoWindow.setContent("<b><font size=\"3\"> Value:</font> </b>" + "<font size=\"4\">" + access.toFixed(2) + "</font>");
            }
            else {
                map.infoWindow.setContent("<b><font size=\"3\"> Value:</font> </b>" + "<font size=\"4\">" + 'undefined' + "</font>");
            }
            map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
        });
        function pointToExtent(map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleranceInMapCoords = toleranceInPixel * pixelWidth;
            return new Extent(point.x - toleranceInMapCoords,
                point.y - toleranceInMapCoords,
                point.x + toleranceInMapCoords,
                point.y + toleranceInMapCoords,
                map.spatialReference);
        }
        $("#interact").click(function(e, parameters) {
            if($("#interact").is(':checked')){
                $('#interactLabel').html('Origin&nbspCircles')
                check= true;
                redrawCircles(selectZone)
            }
            else{
                $('#interactLabel').html('Destination&nbspCircles')

                check= false;
                redrawCircles(selectZone)
            }
        });
        function redrawCircles(selectZone){
            map.removeLayer(circleLayer);
            circleLayer = new GraphicsLayer({ id: "selectedZoneCircleLayer" });


            // map.infoWindow.setFeatures([deferred]);

            map.addLayer(circleLayer);
            //check === true
            if(check === false){
                for(var dest in travelMatrix[selectType][selectZone]){
                    // console.log(travelMatrix[selectType][selectZone][dest]);

                    var destSymbol = new SimpleMarkerSymbol({
                        "color":[255,200,0,200],
                        "size":travelMatrix[selectType][selectZone][dest]/circleScale,
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

                    if(typeof(centroidMatrix[dest])==='undefined'){
                        continue;
                    }
                    var p = new Point(centroidMatrix[dest][0],centroidMatrix[dest][1]);
                    var circle = new Graphic(p,destSymbol,{},null);
                    circleLayer.add(circle);

                }


            }
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
                        var circle = new Graphic(p,orginSymbol,{},null);
                        circleLayer.add(circle);

                    }


                }
            }

            circleLayer.redraw();
        }


        $('#circleScaleRange').change(function(e) {

            circleScale=this.value
            redrawCircles(selectZone)
        });
    }






});
function splitDataIntoTravelMatrix(uniqueTravelType,data){
    var dataMatrix = {};
    var travelM = {}
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
                var zoneNum = Number(travelM[type][k][5])
                if(zoneNum>maxZoneNum){
                   maxZoneNum = zoneNum
                }
                if(zoneNum<minZoneNum){
                    minZoneNum=zoneNum
                }

                dataMatrix[type][zoneNum]={}

            }
            dataMatrix[type][travelM[type][k][5]][travelM[type][k][6]] = travelM[type][k][4];
        }
    }
    dataMatrix['All'] = {}
    for(var i = minZoneNum;i<maxZoneNum;i++){
        dataMatrix['All'][i]={}

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
    console.log(dataMatrix)
    return dataMatrix;
}
function convertCentroidToDict(centroidData){
     var centroidDict = {};
     for(var index in centroidData){
         centroidDict[centroidData[index].TAZ_New] = [centroidData[index].x,centroidData[index].y]
     }
    return centroidDict;
}