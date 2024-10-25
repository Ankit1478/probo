import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.get("/:symbol",(req,res)=>{
    const symbol = req.params.symbol
    const requestId = uuidv4();
  
     // Push into Queue
     pushtoRedis({
      type: "orderBookCheck",
      data: symbol,
      requestId: requestId
    });
  
    redisPubSub.publishMessage("getOrderBook", requestId, res);
  
  })


  export default router;