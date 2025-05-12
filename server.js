const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const mqttBroker = "wss://d089792bed824fa48635d8ef188c6799.s1.eu.hivemq.cloud:8884/mqtt";
const mqttClient = mqtt.connect(mqttBroker, {
  username: "pomclear",
  password: "Pomclear123",
  protocol: "wss",
  rejectUnauthorized: false,
});

const topics = [
  "iot/ph", "iot/turbidity", "iot/tds",
  "iot/light1", "iot/light2", "iot/light3", "iot/light4",
  "iot/control", "iot/reset", "iot/degradation",
  "iot/setpoint/ph_min", "iot/setpoint/ph_max",
  "iot/setpoint/turbidity_max", "iot/setpoint/tds_max",
  "iot/setpoint/duration_minutes", "iot/continue",
  "iot/online", "iot/raspi", "iot/duration", "iot/degradation"
];

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");
  mqttClient.subscribe(topics, (err) => {
    if (err) {
      console.error(`❌ Subscription error: ${err.message}`);
    } else {
      console.log(`📡 Subscribed to topics: ${topics.join(", ")}`);
    }
  });
});

function getTimestamp() {
  const now = new Date();
  return `[${now.toISOString()}]`;
}

mqttClient.on("message", (topic, message) => {
  const timestamp = getTimestamp();
  const msgStr = message.toString();
  console.log(`📥 ${timestamp} ${topic} : ${msgStr}`);
  io.emit("mqttMessage", { topic, message: msgStr });

  if (topic === "iot/control") {
    console.log(msgStr === "1" ? "⚙️ System started" : "🛑 System stopped");
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected");
  socket.on("publish", (data) => {
    const { topic, message } = data;
    mqttClient.publish(topic, message);
    console.log(`📤 Published to ${topic}: ${message}`);
  });
});

let db;
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pomclear-ec893-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
  db = admin.database();
  console.log("✅ Firebase Admin SDK initialized");
} catch (error) {
  console.error("❌ Firebase Admin SDK init failed:", error);
  process.exit(1);
}

app.post('/save-data', (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).send("Invalid data format. Please check your request.");
  }

  const ref = db.ref("sensorData");
  const newDataRef = ref.push();
  newDataRef.set(data, (error) => {
    if (error) {
      return res.status(500).send('Error saving data');
    } else {
      return res.status(200).send('Data saved successfully');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
