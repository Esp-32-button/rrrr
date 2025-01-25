const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket setup for communication with the ESP32
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let esp32Socket = null;

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  ws.on("message", (message) => {
    console.log("Received:", message);
    if (message === "esp32") {
      esp32Socket = ws;
      console.log("ESP32 connected");
    }
  });

  ws.on("close", () => {
    if (ws === esp32Socket) {
      esp32Socket = null;
      console.log("ESP32 disconnected");
    }
  });
});

// API route to receive angle from website
app.post("/set-angle", (req, res) => {
  const { angle } = req.body;

  if (!angle || typeof angle !== "number" || angle < 0 || angle > 180) {
    return res.status(400).json({ error: "Invalid angle value" });
  }

  console.log(`Received angle: ${angle}`);

  // Send the angle to the ESP32 if connected
  if (esp32Socket && esp32Socket.readyState === WebSocket.OPEN) {
    esp32Socket.send(JSON.stringify({ angle }));
    res.json({ message: "Angle sent to ESP32" });
  } else {
    res.status(500).json({ error: "ESP32 not connected" });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

