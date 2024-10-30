import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.get("/inr/:userId", async (req, res) => {
    const userId = req.params.userId;
    const requestId = uuidv4();
   
    redisPubSub.pushtoRedis({
      type: "getUserBalance",
      data: userId,
      requestId: requestId
    });
  
    redisPubSub.publishMessage("fetchUserBalance", requestId, res);
  });
  
  
  router.get("/stock/:userId/", (req,res)=>{
    const userId = req.params.userId;
    const requestId = uuidv4();
  console.log("hii")
   
  redisPubSub.pushtoRedis({
      type: "getStockBalance",
      data: {userId},
      requestId: requestId
    });
  
    redisPubSub.publishMessage("fetchStockBalance", requestId, res);
  
  })

  

  export default router;