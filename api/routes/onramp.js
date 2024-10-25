import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.post("/inr", (req, res) => {
    const { userId, amount } = req.body;
    const requestId = uuidv4(); 
  
    // Push into Redis Queue
    pushtoRedis({
      type: "onrampMoney",
      data: { userId, amount },
      requestId: requestId
    });
  
    redisPubSub.publishMessage("accountUpdate", requestId, res);
  });


  export default router