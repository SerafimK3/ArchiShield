/**
 * Filter Vienna Buildings - Extract Districts 1, 2, 7
 * 
 * Converts Overpass JSON to GeoJSON with building heights
 * Run with: node scripts/filter_buildings.js
 */

const fs = require('fs');
const path = require('path');

// Vienna District Bounding Boxes (approximate)
const DISTRICTS = {
  // District 1 - Innere Stadt (Historic City Center)
  1: {
    name: 'Innere Stadt',
    minLat: 48.197, maxLat: 48.220,
    minLng: 16.355, maxLng: 16.385
  },
  // District 2 - Leopoldstadt (Modern, Prater)
  2: {
    name: 'Leopoldstadt', 
    minLat: 48.205, maxLat: 48.240,
    minLng: 16.385, maxLng: 16.430
  },
  // District 7 - Neubau (MuseumsQuartier, trendy)
  7: {
    name: 'Neubau',
    minLat: 48.195, maxLat: 48.210,
    minLng: 16.335, maxLng: 16.360
  }
};

// Source sector files (absolute paths)
const SECTOR_FILES = [
  '/Users/serafimkrastev/Desktop/Learnings/webDev/UNI/ArchiShield Files/js/data/vienna_sector_sw.js',
  '/Users/serafimkrastev/Desktop/Learnings/webDev/UNI/ArchiShield Files/js/data/vienna_sector_nw.js',
  '/Users/serafimkrastev/Desktop/Learnings/webDev/UNI/ArchiShield Files/js/data/vienna_sector_se.js',
  '/Users/serafimkrastev/Desktop/Learnings/webDev/UNI/ArchiShield Files/js/data/vienna_sector_ne.js'
];

// Parse Overpass JSON element into building info
function parseBuilding(way, nodes) {
  if (!way.nodes || way.nodes.length < 3) return null;
  
  // Get coordinates for the building polygon
  const coords = [];
  for (const nodeId of way.nodes) {
    const node = nodes.get(nodeId);
    if (node) {
      coords.push([node.lon, node.lat]);
    }
  }
  
  if (coords.length < 3) return null;
  
  // Close the polygon if not closed
  if (coords[0][0] !== coords[coords.length-1][0] || 
      coords[0][1] !== coords[coords.length-1][1]) {
    coords.push([...coords[0]]);
  }
  
  // Calculate centroid
  const centroid = coords.reduce((acc, c) => {
    acc[0] += c[0]; acc[1] += c[1];
    return acc;
  }, [0, 0]).map(v => v / coords.length);
  
  // Extract height (estimate from levels if not provided)
  const tags = way.tags || {};
  let height = parseFloat(tags.height) || 
               parseFloat(tags['building:height']) ||
               (parseFloat(tags['building:levels'] || tags.levels || 3) * 3.2);
  
  return {
    type: 'Feature',
    properties: {
      id: way.id,
      height: Math.min(height, 150), // Cap at 150m
      type: tags.building || 'yes',
      name: tags.name || null,
      levels: parseInt(tags['building:levels'] || tags.levels) || Math.round(height / 3.2)
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    },
    centroid
  };
}

// Check if building centroid is in any target district
function isInDistricts(centroid) {
  const [lng, lat] = centroid;
  for (const [num, bounds] of Object.entries(DISTRICTS)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat &&
        lng >= bounds.minLng && lng <= bounds.maxLng) {
      return parseInt(num);
    }
  }
  return null;
}

// Process a sector file
function processSector(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const absolutePath = path.resolve(__dirname, filePath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`  ⚠️ File not found: ${absolutePath}`);
    return [];
  }
  
  // Read and parse the JS file (extract the JSON part)
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Remove the variable declaration wrapper (handles both const and window.)
  content = content.replace(/^(?:const|window\.)\s*\w+\s*=\s*/, '').replace(/;?\s*$/, '');
  
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.log(`  ⚠️ Parse error: ${e.message}`);
    return [];
  }
  
  if (!data.elements) {
    console.log('  ⚠️ No elements found');
    return [];
  }
  
  // Index nodes by ID
  const nodes = new Map();
  for (const el of data.elements) {
    if (el.type === 'node') {
      nodes.set(el.id, el);
    }
  }
  
  // Process buildings (ways with building tag)
  const buildings = [];
  for (const el of data.elements) {
    if (el.type === 'way' && el.tags && el.tags.building) {
      const building = parseBuilding(el, nodes);
      if (building) {
        const district = isInDistricts(building.centroid);
        if (district) {
          building.properties.district = district;
          delete building.centroid; // Remove helper property
          buildings.push(building);
        }
      }
    }
  }
  
  console.log(`  ✓ Found ${buildings.length} buildings in target districts`);
  return buildings;
}

// Main execution
function main() {
  console.log('🏗️  Vienna Buildings Filter');
  console.log('   Extracting Districts 1, 2, 7\n');
  
  const allBuildings = [];
  
  for (const sectorFile of SECTOR_FILES) {
    const buildings = processSector(sectorFile);
    allBuildings.push(...buildings);
  }
  
  console.log(`\n📊 Total buildings: ${allBuildings.length}`);
  
  // Create GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    properties: {
      name: 'Vienna Buildings - Districts 1, 2, 7',
      generated: new Date().toISOString(),
      districts: Object.entries(DISTRICTS).map(([num, d]) => ({
        number: parseInt(num),
        name: d.name
      }))
    },
    features: allBuildings
  };
  
  // Write output
  const outputPath = path.resolve(__dirname, '../src/data/vienna_buildings.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(geojson));
  
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Saved to: src/data/vienna_buildings.json (${sizeMB} MB)`);
}

main();
