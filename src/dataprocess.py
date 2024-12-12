import csv
import os
import json
fileName="data_test.txt"
data_path='/Users/dorapruteanu/Downloads'
dataPath = os.path.join(data_path, fileName)
study_data = open(dataPath, "r").read()
#study_data ="{"+study_data[1:-2]+"}"
#print(study_data)
transcription_map = {}
wavPath="s_eh_010tw_1.wav"
result="Hello"
if wavPath not in transcription_map:
    transcription_map[wavPath] = {"transcription": result}
else:
    transcription_map[wavPath]["transcription"] = result
json_object = json.loads(study_data)
subject_id= json_object[0]["subject_id"]
for x in range(0,len(json_object)):
    if "fileName" in json_object[x]:
        key=json_object[x]["fileName"].replace('.txt', '.wav')
        if json_object[x]["type"] == "clarity":
            clarity = json_object[x]["response"]
            print("Clarity")
            print(clarity)
            transcription_map[wavPath]["clarity"] = clarity
        if json_object[x]["type"] == "confidence":
            confidence = json_object[x]["response"]
            transcription_map[wavPath]["confidence"] = confidence
    #print(json_object[x])

print(transcription_map)
with open(f"{subject_id}.csv", 'w', newline='') as file:
    writer = csv.writer(file)
    field = ["audio", "transcription", "confidence","clarity"]
    writer.writerow(field)
    for key, values in transcription_map.items():
        writer.writerow([
            key, 
            values.get("transcription", ""), 
            values.get("confidence", ""), 
            values.get("clarity", "")
        ])

#  csv file pro person
# index, proband, target_word,  
