import csv


result1 = []
result2 = []
result3 = []
result4 = []
result5 = []

csvWriter = csv.writer(open('Transit_Total_Time_AM.csv','w', newline=''))
title = []
with open('Transit_1wait_Time_AM_Cr_mf488.csv','r') as csv1:
    reader = csv.reader(csv1, delimiter = ',')
    for row in reader:
        csvWriter.writerow(row)
        break
    for row in reader:
        title.append([row[0]])
        result1.append([float(i) for i in row[1:]])



with open('Transit_IVT_Time_AM_Cr_mf492.csv','r') as csv2:
    reader = csv.reader(csv2,delimiter = ',')
    for row in reader:
        break
    for row in reader:

        result2.append([float(i) for i in row[1:]])

with open('Transit_RemWait_Time_AM_Cr_mf489.csv','r') as csv3:
    reader = csv.reader(csv3,delimiter = ',')
    for row in reader:
        break
    for row in reader:

        result3.append([float(i) for i in row[1:]])


with open('Transit_Transfer_Time_AM_Cr_mf490.csv','r') as csv4:
    reader = csv.reader(csv4,delimiter = ',')
    for row in reader:
        break
    for row in reader:

        result4.append([float(i) for i in row[1:]])


with open('Transit_Walk_Time_AM_Cr_mf491.csv','r') as csv5:
    reader = csv.reader(csv5,delimiter = ',')
    for row in reader:
        break
    for row in reader:

        result5.append([float(i) for i in row[1:]])


for i in range(len(result1)):

    result = [title[i][0]]
    medianResult = [x + y +z +m+n for x, y, z,m,n in zip(result1[i], result2[i],result3[i],result4[i],result5[i])]
    for i in medianResult:
        result.append(i)
    csvWriter.writerow(result)




