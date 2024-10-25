import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();


router.post("/create/:stocksymbols",(req,res)=>{
    const  stockSymbol  = req.params.stocksymbols;
    const requestId = uuidv4();
  
    pushtoRedis({
      type :"newStockSymbol",
      data:stockSymbol,
      requestId: requestId
    })
    redisPubSub.publishMessage("symbolCreated", requestId, res);
  })
  
export default router;