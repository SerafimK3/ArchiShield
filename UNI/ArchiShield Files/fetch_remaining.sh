#!/bin/bash

# Function to fetch and wrap data
fetch_sector() {
    NAME=$1
    BBOX=$2
    VAR_NAME=$3
    FILE="js/data/vienna_sector_${NAME}.js"

    # Skip if file exists and is large (>10KB)
    if [ -f "$FILE" ]; then
        SIZE=$(du -k "$FILE" | cut -f1)
        if [ "$SIZE" -gt 10 ]; then
            echo "Sector $NAME already exists ($SIZE KB). Skipping."
            return
        fi
    fi

    echo "Fetching Sector: $NAME ($BBOX) -> $VAR_NAME..."
    
    # Overpass QL query (increased timeout to 600s)
    QUERY="[out:json][timeout:600];(way[\"building\"]($BBOX);relation[\"building\"]($BBOX););out body;>;out skel qt;"
    
    # Fetch data
    curl -g -o "temp_${NAME}.json" --data-urlencode "data=$QUERY" "https://overpass-api.de/api/interpreter"

    if [ -s "temp_${NAME}.json" ]; then
        # Check if it's actually JSON and not an HTML error
        if grep -q "Error" "temp_${NAME}.json"; then
             echo "FAILED $NAME: API returned generic Error."
             cat "temp_${NAME}.json" | head -n 5
             rm "temp_${NAME}.json"
             return
        fi

        SIZE=$(du -k "temp_${NAME}.json" | cut -f1)
        echo "Downloaded $NAME: ${SIZE}KB"
        
        # Wrap in JS Variable
        echo "const ${VAR_NAME} = " > "$FILE"
        cat "temp_${NAME}.json" >> "$FILE"
        echo ";" >> "$FILE"
        
        # Cleanup
        rm "temp_${NAME}.json"
        echo "Created $FILE"
    else
        echo "FAILED to download $NAME (File empty)"
    fi
}

# Retry Strategy: One by one with sleep

# North West (Already done, but check function handles skip)
# fetch_sector "nw" "48.215,16.18,48.32,16.38" "VIENNA_SECTOR_NW"

# North East
fetch_sector "ne" "48.215,16.38,48.32,16.58" "VIENNA_SECTOR_NE"
echo "Sleeping 20s..."
sleep 20

# South West
fetch_sector "sw" "48.11,16.18,48.215,16.38" "VIENNA_SECTOR_SW"
echo "Sleeping 20s..."
sleep 20

# South East
fetch_sector "se" "48.11,16.38,48.215,16.58" "VIENNA_SECTOR_SE"

echo "Retry script complete."
