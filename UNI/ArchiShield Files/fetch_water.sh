#!/bin/bash

# Directory for data
mkdir -p js/data

NAME="water"
BBOX="48.11,16.18,48.32,16.58" # Full Vienna BBox
VAR_NAME="VIENNA_WATER"
FILE="js/data/vienna_water.js"

echo "Fetching Water Bodies for Vienna..."

# Query: Specific Danube relations (Lighter)
# We look for Donau and Donaukanl specifically
QUERY="[out:json][timeout:300];(relation[\"name\"~\"Donau\"][\"waterway\"]($BBOX);way[\"name\"~\"Donau\"][\"waterway\"]($BBOX););out body;>;out skel qt;"

# Retry loop
for i in {1..3}; do
    echo "Attempt $i..."
    curl -g -o "temp_water.json" --data-urlencode "data=$QUERY" "https://overpass-api.de/api/interpreter"
    
    if [ -s "temp_water.json" ]; then
         if grep -q "Error" "temp_water.json"; then
             echo "API Busy. Sleeping 10s..."
             sleep 10
             continue
         fi
         
         SIZE=$(du -k "temp_water.json" | cut -f1)
         echo "Downloaded Water Data: ${SIZE}KB"
         
         # Wrap in JS Variable
         echo "const ${VAR_NAME} = " > "$FILE"
         cat "temp_water.json" >> "$FILE"
         echo ";" >> "$FILE"
         
         rm "temp_water.json"
         echo "Created $FILE"
         exit 0
    else
         echo "Empty response. Sleeping 5s..."
         sleep 5
    fi
done

echo "FAILED to download water data after 3 attempts."
exit 1
