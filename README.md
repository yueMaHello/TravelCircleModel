# Travel Circle Model
The purpose of this application is to show an overview of trips amount of each travel zone. The user can know which zone is busier and how the transportation should be optimized based on the trips amount. The App can show the travel amount from selected zone to any other zones based on different travel purpose, and it also can show the trips from other zones to the selected zone as well.
Since the variance of the dataset is quite large, it is not proper to use a single scale for all selections. So a range slider is designed so that the user can freely adjust the size of circles.  

## Set Up
#### From Github:
1. If you haven't downloaded Nodejs on your computer, you need to download it and add it into PATH.
2. Download this folder
3. Browse to the root of the folder
4. Open the terminal/cmd and go to the root of the App './circleTravelModel'. 
5. Type 'npm install'
6. Type 'npm intall express --save'
7. Type 'npm install http-errors --save'
8. Type 'npm install fs --save'
9. Put your csv data into './public/data' folder.

#### From Lab Computer I
1. Browse to the root of the folder
2. Open the terminal/cmd and go to the root of the App './circleTravelModel'. 
3. In the './public/data/' folder, all the data source is provided.

## Run
1. Use terminal/cmd to go to the root of the App './circleTravelModel'. 
2. Type 'npm start'
2. Browse 'http://localhost:3041' or http://162.106.202.155:3041/

## Use tips:
#### Data source:
 1.The data source:'Origin_Dest_Zones_by_Trips_Purpose_3776.csv' is provided by Juhong. It is exactly the same as the one using in 'Travel Cluster Tool App'. If you want to replace the file with a new one, you would be better to have the same format, including file name and column titles; otherwise you have to change code in main.js.
The coordinates in the file is coded by EPSG 3776, not 4326.  
 2. If your travel zone layer has already updated, you will need to change 'centroids_edmonton.csv' as well.
#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/test.js', you can find the current layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.
      
#### Woops, the App can't run after changing a new dataset:
1. You need to restart the server from terminal/cmd (Rerun 'npm start').

