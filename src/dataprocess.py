import csv
import os
import json
fileName="data_res.txt"
data_path='/Users/dorapruteanu/Downloads'
binPath = os.path.join(data_path, fileName)
study_data = open(binPath, "r").read()
#study_data ="{"+study_data[1:-2]+"}"
#print(study_data)
json_object = json.loads(study_data)
subject_id= json_object[0]["subject_id"]
for x in range(0,len(json_object)):
    if "fileName" in json_object[x]:
        print(json_object[x]["fileName"].replace('.txt', '.wav'))
    #print(json_object[x])
with open('{subject_id}.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    field = ["audio", "transcription", "confidence","clarity"]
    writer.writerow(field)
