import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();


import Schema from '../db/schems.js';


router.post("/",async(req,res)=>{
    const { stockSymbol, endTime, description, sourceOfTrade } = req.body;
    const requestId = uuidv4(); 

    const newMarket = new Schema({
      symbol: stockSymbol,
      endTime: new Date(endTime),
      description: description,
      sourceOfTrade: sourceOfTrade,
    });

    await newMarket.save()

    redisPubSub.pushtoRedis({
        type: "eventCreated",
        data: stockSymbol,
        requestId: requestId
      });
  
    redisPubSub.publishMessage("events", requestId, res);
  })


  export default router;