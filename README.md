# Accessibility-Gravity Model
This is a Nodejs web application using Arcgis Javascript API. It can analyze the job or institution accessibilties with different travel methods. One interesting feature is that the user can choose to see a relative legend or absolute legend for different purposes.
## Set Up
#### From Github:
1. If you haven't downloaded Nodejs on your computer, you need to download it and add it into PATH.
2. Download this folder
3. Browse to the root of the folder
4. Open the terminal/cmd and go to the root of the App './Accessibility'. 
5. Type 'npm install'
6. Type 'npm intall express --save'
7. Type 'npm install http-errors --save'
8. Type 'npm install fs --save'
9. Put your csv data into './public/data' folder.

#### From Lab Computer I
1. Browse to the root of the folder
2. Open the terminal/cmd and go to the root of the App './Accessibility'. 
3. In the './public/data/' folder, all the data source is provided.

## Run
1. Use terminal/cmd to go to the root of the App './Accessibility'. 
2. Type 'npm start'
2. Browse 'http://localhost:3032' or http://162.106.202.155:3032/

## Use tips:

#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/test.js', you can find the current layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.
#### If you want to change the legend:
1. Open './public/javascripts/test.js' file, search 'readerer.addBreak' to show that part of code.
2. After looking into the dataset, you can figure out that different dataset has different data range. It is unrealistic to use a single set of breakpoints to render all the csv files. When the user views the summation of the accessibility (slider is off), findRangeForAccessibilityCalculation(jobType) is used to find a proper legend reference. When the user views single accessibility (slider is on), findRangeForIndividualCalcultion(jobType) is used.

#### If you want to change the legend color:
1. Open './public/javascripts/test.js' file, search 'readerer.addBreak' to show that part of code.
2. Change 'new Color([255, 255, 255,0.90])' to some other RGB color.
      
#### Woops, the App can't run after changing a new dataset:
1. You need to restart the server from terminal/cmd (Rerun 'npm start').
#### What is the use of './public/python/mergeCSV.py'
1. It is python script which can combine several csv files together into a new one. In './public/data' folder, you can see there are 'Transit_1wait_Time_AM_Cr_mf1.csv', 'Transit_IVT_Time_AM_Cr_mf492.csv', 'Transit_RemWait_Time_AM_Cr_mf489.csv', 'Transit_Transfer_Time_AM_Cr_mf491.csv', and 'Transit_Walk_Time_AM_Cr_mf491.csv'. You can combine these five csv files into a single one 'Transit_Total_Time_AM.csv'. 'Transit_Total_Time_AM.csv' is the one used in the App.

