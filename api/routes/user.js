import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { RedisPubSub } from "../utils/redisClient.js";
const redisPubSub = new RedisPubSub();

router.post("/create/:userId", async (req, res) => {
    const userId = req.params.userId;
    const requestId = uuidv4();

    // Push into Redis
    redisPubSub.pushtoRedis({
        type: "newUser",
        data: JSON.stringify({ userId }),
        requestId: requestId
    });

    // Call publishMessage on the instance
    redisPubSub.publishMessage("newuserAdded", requestId, res);
});


export default router;