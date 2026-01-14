#!/bin/bash
# Fetch SE only
NAME="se"
BBOX="48.11,16.38,48.215,16.58"
VAR_NAME="VIENNA_SECTOR_SE"
FILE="js/data/vienna_sector_se.js"

echo "Fetching Sector: $NAME ($BBOX) -> $VAR_NAME..."

# 900s timeout
QUERY="[out:json][timeout:900];(way[\"building\"]($BBOX);relation[\"building\"]($BBOX););out body;>;out skel qt;"

curl -g -o "temp_${NAME}.json" --data-urlencode "data=$QUERY" "https://overpass-api.de/api/interpreter"

if [ -s "temp_${NAME}.json" ]; then
    if grep -q "Error" "temp_${NAME}.json"; then
         echo "FAILED $NAME: API returned generic Error."
         cat "temp_${NAME}.json" | head -n 5
         rm "temp_${NAME}.json"
         exit 1
    fi

    SIZE=$(du -k "temp_${NAME}.json" | cut -f1)
    echo "Downloaded $NAME: ${SIZE}KB"
    
    echo "const ${VAR_NAME} = " > "$FILE"
    cat "temp_${NAME}.json" >> "$FILE"
    echo ";" >> "$FILE"
    
    rm "temp_${NAME}.json"
    echo "Created $FILE"
else
    echo "FAILED to download $NAME (File empty)"
    exit 1
fi
