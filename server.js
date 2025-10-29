const express = require('express');
const axios = require('axios');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// city coordinates
const cityCoordinates = {
  ulaanbaatar: { lat: 47.8864, lon: 106.9057 },
  beijing: { lat: 39.9042, lon: 116.4074 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  seoul: { lat: 37.5665, lon: 126.9780 },
  tokyo: { lat: 35.6895, lon: 139.6917 },
  hanoi: { lat: 21.0278, lon: 105.8342 },
  bangkok: { lat: 13.7563, lon: 100.5018 },
  jakarta: { lat: -6.2088, lon: 106.8456 },
  dhaka: { lat: 23.8103, lon: 90.4125 },
  tehran: { lat: 35.6892, lon: 51.3890 },
  kabul: { lat: 34.5553, lon: 69.2075 },
  kolkata: { lat: 22.5726, lon: 88.3639 }
};
app.use(express.urlencoded({ extended: true }));

// using the public file 
app.use(express.static(path.join(__dirname, 'public')));

// Connection to  database
const db = new sqlite3.Database('./mask_data.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log(' Connected to SQLite (mask_data.db)');
  }
});


// table
db.run(`DROP TABLE IF EXISTS recommendations`);
db.run(`CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT,
  priority TEXT,
  illness TEXT,
  aqi INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// connection to my API key
const apiKey = process.env.OPENWEATHER_KEY; 



// Function to get AQI from OpenWeather
async function getAQI(city) {
  const coords = cityCoordinates[city.toLowerCase()];
  if (!coords) return null;

  const { lat, lon } = coords;
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;

  try {
    const response = await axios.get(url);
    return response.data.list[0].main.aqi; 
  } catch (error) {
    console.error('Error fetching AQI:', error.message);
    return null;
  }
}

// get the data from the submission from the form
app.get('/recommend', async (req, res) => {
    
console.log("Query params:", req.query);
  const { city, priority, illness } = req.query;
 
  const aqi = await getAQI(city);
 
  if (aqi === null) {
  return res.status(500).json({ error: 'Failed to fetch AQI' });
}
  const conditionScore = getConditionScore(illness);
  const { totalScore } = getTotalScore(aqi, conditionScore);
  
  const recommendedMask = selectMask(totalScore, priority);
  

  db.run(

    `INSERT INTO recommendations (city, priority, illness, aqi) VALUES (?, ?, ?, ?)`,
    [city, priority, illness, aqi],
    function (error) {
      if (error) {
  console.error(' Insertion failed:', error.message);
  return res.status(500).json({ error: 'Failed to save recommendation.' });
}
      res.json({
        message: 'Recommendation saved!',
        recommendationId: this.lastID,
        city,
        priority,
        illness,
        aqi,
        totalScore,
        recommendedMask
      });
    }
  );
});
//table for masks
const masks = [
  {
    name: "Cloth Mask",
    protection: 1,
    comfort: 9,
    cost: 1,
    scoreRange: [0, 2]
  },
  {
    name: "Surgical Mask",
    protection: 5,
    comfort: 5,
    cost: 1,
    scoreRange: [3, 4]
  },
  {
    name: "Activated Carbon Mask",
    protection: 5,
    comfort: 5,
    cost: 4,
    scoreRange: [3, 4]
  },
  {
    name: "2-Layer Cotton Mask",
    protection: 2,
    comfort: 9,
    cost: 1,
    scoreRange: [0, 2]
  },
  {
    name: "Anti-Dust Mask (Non-medical)",
    protection: 2,
    comfort: 8,
    cost: 2,
    scoreRange: [0, 2]
  },
  {
    name: "PM2.5 Filter Mask",
    protection: 6,
    comfort: 6,
    cost: 2,
    scoreRange: [3, 4]
  },
  {
    name: "KN95 (Generic)",
    protection: 7,
    comfort: 5,
    cost: 4,
    scoreRange: [5, 8]
  },
  {
    name: "KF94",
    protection: 8,
    comfort: 8,
    cost: 4,
    scoreRange: [5, 8]
  },
  {
    name: "N95 (Certified)",
    protection: 9,
    comfort: 4,
    cost: 7,
    scoreRange: [5, 8]
  },
  { 
    name: "N95 with Valve",
    protection: 9,
    comfort: 6,
    cost: 7,
    scoreRange: [5, 8]
  },
  {
    name: "N99 / FFP3 Respirator",
    protection: 9,
    comfort: 3,
    cost: 8,
    scoreRange: [5, 8]
  },
  {
    name: "Half-Face Respirator",
    protection: 9,
    comfort: 2,
    cost: 8,
    scoreRange: [5, 8]
  },
  {
    name: "Full-Face Respirator",
    protection: 9,
    comfort: 2,
    cost: 8,
    scoreRange: [5, 8]
  },
  {
    name: "Fashion Mask (No Filter)",
    protection: 2,
    comfort: 7,
    cost: 5,
    scoreRange: [0, 2]
  },
  {
    name: "Fashion Mask (With Filter Pocket)",
    protection: 5,
    comfort: 7,
    cost: 5,
    scoreRange: [3, 4]
  },
  {
    name: "Transparent Mask with Filter",
    protection: 5,
    comfort: 5,
    cost: 7,
    scoreRange: [3, 4]
  },
  {
    name: "Disposable Dust Mask",
    protection: 3,
    comfort: 8,
    cost: 3,
    scoreRange: [0, 2]
  },
  {
    name: "Surgical Mask with Face Shield",
    protection: 5,
    comfort: 3,
    cost: 5,
    scoreRange: [3, 4]
  },
  {
    name: "Nanofiber Mask",
    protection: 8,
    comfort: 8,
    cost: 5,
    scoreRange: [5, 8]
  },
];

// my main logic 
function getConditionScore(healthCondition) {
  return {
    none: 0,
    sensitive: 3,
    highrisk: 5
  }[healthCondition.toLowerCase()];
}
function getTotalScore(aqi, conditionScore) {
  const adjustedAQI = aqi - 1;
  const score = adjustedAQI + conditionScore;

  return {
    totalScore: score
  };
}
function selectMask(score, priority) {
// filter by score range
const filteredMask = masks.filter(mask => {
  const [minscore, maxscore] = mask.scoreRange;
  return score >= minscore && score <= maxscore;
});
// filter by priority
 const sortedMasks = filteredMask.sort((a, b) => {
  if (priority === "comfort") {
    return b.comfort - a.comfort;  
  } else if (priority === "cost") {
    return a.cost - b.cost;       
  } else if (priority === "protection") {
    return b.protection - a.protection; 
  } 
});

 return sortedMasks[0];

}



// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
