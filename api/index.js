import 'dotenv/config'
import express from 'express';
import mongoose from 'mongoose';
import eventRouter from "./routes/event.js"
import userRouter from "./routes/user.js"
import balanceRouter from "./routes/balance.js"
import orderRouter from "./routes/order.js"
import orderbookRouter from "./routes/orderbook.js"
import onrampRouter from "./routes/onramp.js"
import symbolCreated from "./routes/symbol.js"
import reseRoutet from "./routes/reset.js"
import tradeRouter from "./routes/mint.js"
import { createClient } from 'redis';
const client = createClient();
const pubsub = createClient();
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'dotenv';
await client.connect();
await pubsub.connect();

const app = express();
app.use(express.json());


// const mongoUri = process.env.DATABASE_URL

// mongoose.connect(mongoUri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log("Connected to MongoDB"))
// .catch((error) => console.error("MongoDB connection error:", error));



app.use("/event",eventRouter);
app.use("/user",userRouter);
app.use("/balance",balanceRouter)
app.use("/order",orderRouter)
app.use("/onramp",onrampRouter)
app.use("/orderbook",orderbookRouter)
app.use("/symbol", symbolCreated)
app.use("/reset",reseRoutet)
app.use("/trade",tradeRouter)

// async function pushtoRedis(data) {
//   await client.rPush("RedisQueue", JSON.stringify(data));
// }

// app.post("/order/buy", async (req, res) => {
//   const { userId, stockSymbol, quantity, price, stockType } = req.body;
//   const requestId = uuidv4();
//   console.log(requestId)

//   pushtoRedis({
//     type: "buy",
//     data: {userId,stockSymbol , quantity , price ,  stockType},
//     requestId: requestId
//   });

  
//   // console.log("Published requestID:", requestId);

//     const publishMessage = (message) => {
//         const data = JSON.parse(message); 
//         console.log(data)
//         if (data.requestId === requestId) {
//           pubsub.unsubscribe("buyStocks", publishMessage);
//           return  res.status(200).json({message:JSON.parse(data.msg)} ); 
//         } else {
//           console.log("Request ID mismatch");
//           res.status(404).json({ message: "Something went wrong" });
//         }
//        };
//     await pubsub.subscribe("buyStocks", publishMessage);
  
// })

export default app;
app.listen(3000, async () => {
  console.log("Server is running on port 3000");
});
