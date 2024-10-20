import express from 'express'
import { WebSocketServer } from 'ws'
import { createClient } from 'redis';
const app = express()
const httpServer = app.listen(8080)

const clients = new Map();
const pubsub = createClient();
await pubsub.connect();

const wss = new WebSocketServer({ server: httpServer });

function receivedData(){
  pubsub.subscribe("sentToWebSocket",(message)=>{
    const data = JSON.parse(message)
    // console.log(JSON.parse(data)); 
    broadcastToClients(data);
  })
}

wss.on('connection', function connection(ws) {
  //Generate a unique id FOr Each client
  const clientId = generateUniqueId();
  clients.set(clientId, ws);

  ws.on('error', console.error);

  // reading from fronted 
  ws.on('message', function message(data, isBinary) {
    console.log(`Received message from client ${clientId}:`, data.toString());
  });

  
   // When a client disconnects, remove them from the map
   ws.on('close', () => {
    clients.delete(clientId);
  });

});

//
function broadcastToClients(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

setInterval(()=>{
  receivedData();
},5000)

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

console.log('WebSocket server is running on port 8080');