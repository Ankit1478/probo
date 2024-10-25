import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.get("/inr/:userId", async (req, res) => {
    const userId = req.params.userId;
    const requestId = uuidv4();
    // Push into Queue
    pushtoRedis({
      type: "getUserBalance",
      data: userId,
      requestId: requestId
    });
  
    redisPubSub.publishMessage("fetchUserBalance", requestId, res);
  });
  
  
  router.get("/stock/:userId/:stockSymbol", (req,res)=>{
    const userId = req.params.userId;
    const stockSymbol = req.params.stockSymbol;
    const requestId = uuidv4();
  
    // Push into Queue
    pushtoRedis({
      type: "getStockBalance",
      data: {userId, stockSymbol},
      requestId: requestId
    });
  
    redisPubSub.publishMessage("fetchStockBalance", requestId, res);
  
  })

  

  export default router;