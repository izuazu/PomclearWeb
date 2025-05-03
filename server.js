const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.use(express.json());

const mqttBroker = "wss://d089792bed824fa48635d8ef188c6799.s1.eu.hivemq.cloud:8884/mqtt";
const mqttClient = mqtt.connect(mqttBroker, {
username: "pomclear",
password: "Pomclear123",
protocol: "wss",
rejectUnauthorized: false,
});

const topics = [
"iot/ph",
"iot/turbidity",
"iot/tds",
"iot/light1",
"iot/light2",
"iot/light3",
"iot/light4",
"iot/control",
"iot/reset",
"iot/degradation",
"iot/setpoint/ph_min",
"iot/setpoint/ph_max",
"iot/setpoint/turbidity_max",
"iot/setpoint/tds_max",
"iot/setpoint/duration_minutes",
"iot/continue",
"iot/online",
];

mqttClient.on("connect", () => {
console.log("Connected to MQTT Broker");
mqttClient.subscribe(topics, (err) => {
if (!err) {
console.log(`Subscribed to topics: ${topics.join(", ")}`);
} else {
console.error(`Subscription error: ${err.message}`);
}
});
});

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}]`;
}

mqttClient.on("message", (topic, message) => {
const timestamp = getTimestamp();
console.log(`Message received from ${topic} ${timestamp} : ${message.toString()}`);
io.emit("mqttMessage", { topic, message: message.toString() });

if (topic === "iot/control") {
    if (message.toString() === "1") {
        console.log("System started");
    } else if (message.toString() === "0") {
        console.log("System stopped");
    }
}

});

io.on("connection", (socket) => {
console.log("Client connected");

socket.on("publish", (data) => {
    const { topic, message } = data;
    mqttClient.publish(topic, message);
    console.log(`Published to ${topic}: ${message}`);
});

});

try {
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
credential: admin.credential.cert(serviceAccount),
databaseURL: "https://pomclear-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
console.log("Firebase Admin SDK initialized successfully.");

app.post('/save-data', (req, res) => {
    const data = req.body;
    console.log('Data received from client:', data);

    if (!data || typeof data !== 'object' || !data.time || !data.turbidity || !data.ph || !data.tds || !data.degradation) {
        console.error("Invalid data format received from client.");
        return res.status(400).send("Invalid data format. Please check your request.");
    }

    const ref = db.ref("sensorData");

    const newDataRef = ref.push();

    newDataRef.set(data, (error) => {
        if (error) {
            console.error('Error saving data to Firebase:', error);
            return res.status(500).send('Error saving data');
        } else {
            console.log('Data saved to Firebase');
            return res.status(200).send('Data saved successfully');
        }
    });
});

} catch (error) {
console.error("Failed to initialize Firebase Admin SDK:", error);
process.exit(1);
}

const PORT = 8884;
server.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});