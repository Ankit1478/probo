import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.post("/buy", async (req, res) => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
    const requestId = uuidv4();
  
    redisPubSub.pushtoRedis({
      type: "buy",
      data: {userId,stockSymbol , quantity , price ,  stockType},
      requestId: requestId
    });
    redisPubSub.publishMessage("buyStocks", requestId, res);
    
  })
  
  router.post("/sell",async(req,res)=>{
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
    const requestId = uuidv4()
  
    redisPubSub.pushtoRedis({
      type: "sell",
      data: {userId,stockSymbol , quantity , price ,  stockType},
      requestId: requestId
    });
    redisPubSub.publishMessage("sellStocks", requestId, res);
  
  })


export default router;