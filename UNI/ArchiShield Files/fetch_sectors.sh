#!/bin/bash

# Directory for data
mkdir -p js/data

# Function to fetch and wrap data
fetch_sector() {
    NAME=$1
    BBOX=$2
    VAR_NAME=$3
    FILE="js/data/vienna_sector_${NAME}.js"

    echo "Fetching Sector: $NAME ($BBOX) -> $VAR_NAME..."
    
    # Overpass QL query (increased timeout)
    QUERY="[out:json][timeout:300];(way[\"building\"]($BBOX);relation[\"building\"]($BBOX););out body;>;out skel qt;"
    
    # Fetch data
    curl -g -o "temp_${NAME}.json" --data-urlencode "data=$QUERY" "https://overpass-api.de/api/interpreter"

    if [ -s "temp_${NAME}.json" ]; then
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
        echo "FAILED to download $NAME (File empty or failed)"
    fi
}

# Vienna Center Split (approximate) - Overlapping slightly to ensure coverage

# North West
fetch_sector "nw" "48.215,16.18,48.32,16.38" "VIENNA_SECTOR_NW"

# North East
fetch_sector "ne" "48.215,16.38,48.32,16.58" "VIENNA_SECTOR_NE"

# South West
fetch_sector "sw" "48.11,16.18,48.215,16.38" "VIENNA_SECTOR_SW"

# South East
fetch_sector "se" "48.11,16.38,48.215,16.58" "VIENNA_SECTOR_SE"

echo "All sectors fetched."
