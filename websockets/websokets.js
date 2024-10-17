import express, { json } from 'express'
import { WebSocketServer } from 'ws'
import { ORDERBOOK } from '../index.js';
import Redis from "ioredis";

const redis = new Redis();

const jsonData = await redis.lrange('json', 0, -1, function(err, reply) {
    console.log(reply);
});


const app = express()
const httpServer = app.listen(8080)

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);


  // reading from fronted 
  ws.on('message', function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send({data});
      }
    });
  });
  ws.send(JSON.stringify(jsonData));
  
});