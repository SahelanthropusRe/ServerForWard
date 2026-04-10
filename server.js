const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- State ---
let latestData = {
  temp:     0,
  hum:      0,
  distance: 999,
  rack:     'Winter',
  led:      false,
  autoMode: true,
  updatedAt: null
};

// Derived wardrobe logic: returns clothing suggestion based on temp + humidity
function getClothingSuggestion(temp, hum) {
  if (temp > 30) return { label: 'Very Hot',    icon: '☀️',  tip: 'Light breathable fabrics — linen, cotton shorts' };
  if (temp > 25) return { label: 'Warm',         icon: '🌤️',  tip: 'T-shirts, light trousers, sun hat' };
  if (temp > 18) return { label: 'Mild',         icon: '🌥️',  tip: 'Light jacket or long sleeves recommended' };
  if (temp > 10) return { label: 'Cool',         icon: '🍂',  tip: 'Sweater + jeans, closed shoes' };
  if (temp > 0)  return { label: 'Cold',         icon: '❄️',  tip: 'Heavy coat, scarf, warm layers' };
                 return { label: 'Freezing',     icon: '🥶',  tip: 'Full winter gear — thermal undergarments essential' };
}

function getHumidityAlert(hum) {
  if (hum > 80) return { level: 'danger',  msg: 'Very humid — risk of mold on fabrics. Air out your wardrobe!' };
  if (hum > 65) return { level: 'warning', msg: 'Moderate humidity — consider moisture absorbers.' };
  if (hum < 20) return { level: 'warning', msg: 'Very dry — static buildup may affect delicate fabrics.' };
  return { level: 'ok', msg: 'Humidity is comfortable for clothing storage.' };
}

// --- Routes ---

// ESP32 POSTs sensor data here
app.post('/update', (req, res) => {
  latestData = {
    ...latestData,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  console.log('[POST]', new Date().toLocaleTimeString(), latestData);
  res.json({ status: 'ok' });
});

// Dashboard GETs enriched sensor data
app.get('/update', (req, res) => {
  const suggestion   = getClothingSuggestion(latestData.temp, latestData.hum);
  const humidityAlert = getHumidityAlert(latestData.hum);
  res.json({
    ...latestData,
    suggestion,
    humidityAlert
  });
});

// Serve dashboard HTML
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health check
app.get('/', (req, res) => {
  res.send('Smart Wardrobe Server Running ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Smart Wardrobe server running on port ${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard\n`);
});