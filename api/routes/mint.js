import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.post("/mint", async (req, res) => {
    const {userId , stockSymbol, quantity} = req.body;
    const requestId = uuidv4();
   
    redisPubSub.pushtoRedis({
      type: "mint",
      data: {userId,stockSymbol , quantity},
      requestId: requestId
    });
  
    redisPubSub.publishMessage("minttrade", requestId, res);
  });
  

  export default router;