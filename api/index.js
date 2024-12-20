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
const pubsub = createClient({
    host: 'redis-service', 
    port: 6379,
});
await pubsub.connect().then(()=>{
  console.log("connected to pubsub")
})

const app = express();
app.use(express.json());

app.use("/event",eventRouter);
app.use("/user",userRouter);
app.use("/balance",balanceRouter)
app.use("/order",orderRouter)
app.use("/onramp",onrampRouter)
app.use("/orderbook",orderbookRouter)
app.use("/symbol", symbolCreated)
app.use("/reset",reseRoutet)
app.use("/trade",tradeRouter)

app.get("/",(req,res)=>{
res.send("hiii")
})

const mongoUri = process.env.DATABASE_URL

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((error) => console.error("MongoDB connection error:", error));


export default app;
app.listen(3000, async () => {
  console.log("Server is running on port 3000");
});
