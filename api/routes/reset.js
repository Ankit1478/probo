import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.post("/",(req,res)=>{
    const requestId = uuidv4()
    pushtoRedis({
      type: "reset",
      data:{},
      requestId: requestId
    });
    redisPubSub.publishMessage("resetMemory", requestId, res);
  
  })
  

  export default router