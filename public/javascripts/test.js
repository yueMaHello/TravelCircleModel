var csvFileTitle = {
    csvFileUrl:"./data/Origin_Dest_Zones_by_Trip_Purpose_3776.csv",
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
var map;
var selectZone='101';
var hoverZone;
var renderer;
var check = false; //O to D or D to O
var selectType = 'Work';
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
    d3.csv(csvFileTitle.csvFileUrl, function(data) {
        //get a list storing different travel types
        var uniqueTravelType = data.map(data => data.Purpose_Category)
            .filter((value, index, self) => self.indexOf(value) === index);

        travelMatrix = splitDataIntoTravelMatrix(uniqueTravelType,data);
        //dynamic fill the flowTable based on unique travel type
        uniqueTravelType.forEach(function(key){
            $("#flowTable").append('<tr class="clickableRow2"><td>'+key+'</td></tr>');

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
            travelZoneLayer.redraw();

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
        map.on('load', function () {
            map.addLayer(travelZoneLayer);
            map.addLayer(lrtFeatureLayer);
            /*travelZoneLayer.redraw();*/
        });
        travelZoneLayer.on('click', function (evt) {
            var graphic = evt.graphic;
            selectZone = graphic.attributes.TAZ_New;
            var query = new Query();
            query.geometry = pointToExtent(map, event.mapPoint, 10);
            var deferred = travelZoneLayer.selectFeatures(query,
                travelZoneLayer.SELECTION_NEW);
            map.infoWindow.setFeatures([deferred]);
            map.infoWindow.show(event.mapPoint);
            travelZoneLayer.redraw();

        })
        // var largestIndividualArray = findRangeForIndividualCalcultion();
        // sort = Object.values(largestIndividualArray).sort((prev, next) => prev - next); //from smallest to largest
        // sort = sort.map(x => x.toFixed(2)); //make legend to 2 decimal numbers.

        var symbol = new SimpleFillSymbol();
        //make class break renderer for this map. Add color on the map.


        renderer = new ClassBreaksRenderer(symbol, function (feature) {
            if (check === false) {
                if(selectType === 'All'){

                    var travelValue = 0;
                    for(var t in travelMatrix){
                        var tmp = 0;
                        try{
                            tmp = travelMatrix[t][selectZone][feature.attributes.TAZ_New]||0;
                        }
                        catch (e) {
                            tmp = 0;
                        }
                        travelValue+=tmp
                    }
                    return travelValue
                }

                else{

                    try{
                        return travelMatrix[selectType][selectZone][feature.attributes.TAZ_New]||0;
                    }
                    catch (e) {
                        return 0
                    }
                }
            }
            else {
                if(selectType === 'All'){

                    var travelValue = 0;
                    for(var t in travelMatrix){
                        var tmp = 0;
                        try{
                            tmp = travelMatrix[t][feature.attributes.TAZ_New][selectZone]||0;
                        }
                        catch (e) {
                            tmp = 0;
                        }
                        travelValue+=tmp
                    }
                    return travelValue
                }

                else{

                    try{
                        return travelMatrix[selectType][feature.attributes.TAZ_New][selectZone]||0;
                    }
                    catch (e) {
                        return 0
                    }
                }
            }
        });
        //renew the renderer
        renderer=changeRender(renderer);
        travelZoneLayer.setRenderer(renderer);
        travelZoneLayer.redraw();




        //mouse over event
        travelZoneLayer.on('mouse-over', function (evt) {
            var graphic = evt.graphic;
            hoverZone = graphic.attributes.TAZ_New;
            //generate info window when mousing over the zone
            var access;
            if (check === false) {
                if(selectType === 'All'){
                    access = 0;
                    for(var t in travelMatrix){
                      var tmp;
                      try{

                          tmp = travelMatrix[t][selectZone][hoverZone]||0;

                      }
                      catch (e) {
                          tmp = 0;

                      }
                      access+=tmp;

                    }

                }
                else{
                  try{
                    access = travelMatrix[selectType][selectZone][hoverZone]||0;

                  }
                  catch (e) {
                      access = 0
                  }


                }
            }
            else {
                if(selectType === 'All'){
                    access = 0;
                    for(var t in travelMatrix){
                        var tmp;
                        try{

                            tmp = travelMatrix[t][hoverZone][selectZone]||0;

                        }
                        catch (e) {
                            tmp = 0;

                        }
                        access+=tmp;

                    }

                }
                else{
                    try{
                        access = travelMatrix[selectType][hoverZone][selectZone]||0;

                    }
                    catch (e) {
                        access = 0
                    }


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
        function changeRender(renderer){
            var chunkZones = 1;
            var sort  = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240]
            renderer.addBreak(-Infinity, sort[chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
            renderer.addBreak(sort[chunkZones], sort[2*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	249, 238, 237,0.90])));
            renderer.addBreak(sort[2*chunkZones], sort[3*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([243, 224, 219,0.90])));
            renderer.addBreak(sort[3*chunkZones], sort[4*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([237, 214, 202,0.90])));
            renderer.addBreak(sort[4*chunkZones], sort[5*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([225, 200, 170,0.90])));
            renderer.addBreak(sort[5*chunkZones],  sort[6*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([213, 196, 141,0.90])));
            renderer.addBreak(sort[6*chunkZones],  sort[7*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([207, 197, 127,0.90])));
            renderer.addBreak(sort[7*chunkZones], sort[8*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([201, 199, 113,0.90])));
            renderer.addBreak(sort[8*chunkZones], sort[9*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([185, 195, 101,0.90])));
            renderer.addBreak(sort[9*chunkZones], sort[10*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([168, 189, 88,0.90])));
            renderer.addBreak(sort[10*chunkZones], sort[11*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([149, 183, 77,0.90])));
            renderer.addBreak(sort[11*chunkZones], sort[12*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([129, 177, 66,0.90])));
            renderer.addBreak(sort[12*chunkZones], sort[13*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([109, 171, 55,0.90])));
            renderer.addBreak(sort[13*chunkZones], sort[14*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([87, 165, 45,0.90])));
            renderer.addBreak(sort[14*chunkZones], sort[15*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	66, 159, 36,0.90])));
            renderer.addBreak(sort[15*chunkZones], sort[16*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([44, 153, 27,0.90])));
            renderer.addBreak(sort[16*chunkZones], sort[17*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	37, 121, 24,0.90])));
            renderer.addBreak(sort[17*chunkZones], sort[18*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([11, 106, 18,0.90])));
            renderer.addBreak(sort[18*chunkZones], Infinity, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([5, 80, 15,0.90])));
            return renderer;
        }



        $("#interact").click(function(e, parameters) {
            if($("#interact").is(':checked')){
                check= true;
                travelZoneLayer.redraw();
            }
            else{
                check= false;
                travelZoneLayer.redraw();

            }
        });

    });


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


    for(var type in travelM){
      dataMatrix[type] = {};
      for(var k in travelM[type]){
        if(typeof(dataMatrix[type][travelM[type][k][5]])==='undefined'){
            dataMatrix[type][travelM[type][k][5]]={}

        }
        dataMatrix[type][travelM[type][k][5]][travelM[type][k][6]] = travelM[type][k][4];
      }
    }



    console.log(dataMatrix)


    return dataMatrix;
}