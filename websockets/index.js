import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';

const app = express();
const httpServer = app.listen(8080);
const clients = new Map();
const redisClient = createClient({
  host: 'redis-service', // The service name from your Kubernetes configuration
  port: 6379, // Default Redis port
});
const redisPublisher = createClient({
  host: 'redis-service', // The service name from your Kubernetes configuration
  port: 6379, // Default Redis port
});

await redisClient.connect();
await redisPublisher.connect();
console.log("Connected to Redis");

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  const clientId = generateUniqueId();
  console.log("Client connected", clientId);
  
  clients.set(clientId, {
    ws,
    subscriptions: new Set()
  });

  ws.on("error", console.error);

  ws.on("message", async (message) => {
    try {
      const messageString = typeof message === "string" ? message : message.toString();
      const data = JSON.parse(messageString);

      if (data.type === "subscribe") {
        const { stockSymbol } = data;
       
        if (!clients.get(clientId).subscriptions.has(stockSymbol)) {
          const listener = (message) => {
            try {
              if (ws.readyState === WebSocket.OPEN) {
                
                const parsedMessage = JSON.parse(message);
                
                
                // Format the message exactly as the test expects
                const wsResponse = {
                  event: "event_orderbook_update",
                  message: parsedMessage  
                };
                
                ws.send(JSON.stringify(wsResponse));
                console.log('Sent message:', JSON.stringify(wsResponse));
              }
            } catch (error) {
              console.error('Error processing Redis message:', error);
            }
          };
          
          await redisClient.subscribe(`sentToWebSocket.${stockSymbol}`, listener);
          clients.get(clientId).subscriptions.add(stockSymbol);
        }
      }
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  });

  ws.on("close", async () => {
    console.log("Client disconnected", clientId);
    for (const stockSymbol of clients.get(clientId).subscriptions) {
      await redisClient.unsubscribe(`sentToWebSocket.${stockSymbol}`);
    }
    clients.delete(clientId);
  });
});

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}