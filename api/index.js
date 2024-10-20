import express, { json } from 'express';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const client = createClient();
const pubsub = createClient();


async function pushtoRedis(data) {
  // Push data to Redis queue
  await client.rPush("RedisQueue", JSON.stringify(data));
  console.log("Data pushed to Redis queue");
}

//step -1 user Create a account  
//step-2 user onramp money to their aoccount
//step-3 create stockSymbol
//stpe-4 get user balance 
//step - 4 get stock balance 



app.post("/user/create",async(req,res)=>{
  const {userId} = req.body;
  const requestId = uuidv4();
  //push into Redis
  pushtoRedis({
    type :"newUser",
    data:userId,
    requestId: requestId
  })

  const publishMessage = (message) => {
    const data = JSON.parse(message); 
    if (data.requestId === requestId) {
    

      pubsub.unsubscribe('newuserAdded', publishMessage);
      return  res.status(201).json({ message: data.msg }); 
    } else {
      console.log("Request ID mismatch");
      res.status(404).json({ message: "Something went wrong" });
    }
  };
  await pubsub.subscribe("newuserAdded", publishMessage);
})


//onRamp Money 

app.post("/onramp/inr", (req, res) => {
  const { userId, amount } = req.body;
  const requestId = uuidv4(); // Unique ID for this request

  // Push into Redis Queue
  pushtoRedis({
    type: "onrampMoney",
    data: { userId, amount },
    requestId: requestId
  });

  const publishMessage = (message) => {
    const data = JSON.parse(message); 
    if (data.requestId === requestId) {
      res.status(201).json({ message: data.msg }); 

      pubsub.unsubscribe('accountUpdate', publishMessage);
    } else {
      console.log("Request ID mismatch");
      res.status(404).json({ message: "Something went wrong" });
    }
  };
  pubsub.subscribe("accountUpdate", publishMessage);
});

//stock Symbol is Created 
app.post("/create/stockSymbols",(req,res)=>{
  const { stockSymbol } = req.body;
  const requestId = uuidv4();

  pushtoRedis({
    type :"newStockSymbol",
    data:stockSymbol,
    requestId: requestId
  })

  const publishMessage = (message) => {
    const data = JSON.parse(message); 
    console.log(data);
    if (data.requestId === requestId) {
      res.status(201).json({ message: data.msg }); 

      pubsub.unsubscribe('symbolCreated', publishMessage);
    } else {
      console.log("Request ID mismatch");
      res.status(404).json({ message: "Something went wrong" });
    }
  };
  pubsub.subscribe("symbolCreated", publishMessage);
})

 //get user balance
app.get("/balances/:userId", async (req, res) => {
  const userId = req.params.userId;
  const requestId = uuidv4();
  // Push into Queue
  pushtoRedis({
    type: "getUserBalance",
    data: userId,
    requestId: requestId
  });

  const pubsubListener = (message) => {
    const data = JSON.parse(message);
    // Ensure only one response is sent
    if (data.requestId === requestId) {
      res.status(201).json({ message: data.msg });
      // Unsubscribe after receiving the response
      pubsub.unsubscribe('fetchUserBalance', pubsubListener);
    } else {
      res.status(400).json({ message: "Request ID mismatch" });
    }
  };
  // Subscribe to the relevant pubsub channel
  pubsub.subscribe('fetchUserBalance', pubsubListener);

});


app.get("/balance/stock/:userId/:stockSymbol", (req,res)=>{
  const userId = req.params.userId;
  const stockSymbol = req.params.stockSymbol;
  const requestId = uuidv4();

  // Push into Queue
  pushtoRedis({
    type: "getStockBalance",
    data: {userId, stockSymbol},
    requestId: requestId
  });

  const pubsubListener = (message) => {
    const data = JSON.parse(message);
    // Ensure only one response is sent
    if (data.requestId === requestId) {
      res.status(201).json({ message: data.msg });
      // Unsubscribe after receiving the response
      pubsub.unsubscribe('fetchStockBalance', pubsubListener);
    } else {
      res.status(400).json({ message: "Request ID mismatch" });
    }
  };
  // Subscribe to the relevant pubsub channel
  pubsub.subscribe('fetchStockBalance', pubsubListener);

})


app.post("/buy", async (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  const requestId = uuidv4();

  pushtoRedis({
    type: "buy",
    data: {userId,stockSymbol , quantity , price ,  stockType},
    requestId: requestId
  });
  
  const pubsubListener = (message) => {
    const data = JSON.parse(message);
    // Ensure only one response is sent
    if (data.requestId === requestId) {
      res.status(201).json({ message: JSON.parse(data.msg) });
      // Unsubscribe after receiving the response
      pubsub.unsubscribe('sellStocks', pubsubListener);
    } else {
      res.status(400).json({ message: "Request ID mismatch" });
    }
  };
  // Subscribe to the relevant pubsub channel
  pubsub.subscribe('sellStocks', pubsubListener);
})

app.post("/sell",async(req,res)=>{
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  const requestId = uuidv4()

  pushtoRedis({
    type: "sell",
    data: {userId,stockSymbol , quantity , price ,  stockType},
    requestId: requestId
  });

  const pubsubListener = (message) => {
    const data = JSON.parse(message);
    // Ensure only one response is sent
    if (data.requestId === requestId) {
      res.status(201).json({ message: JSON.parse(data.msg) });
      // Unsubscribe after receiving the response
      pubsub.unsubscribe('sellStocks', pubsubListener);
    } else {
      res.status(400).json({ message: "Request ID mismatch" });
    }
  };
  // Subscribe to the relevant pubsub channel
  pubsub.subscribe('sellStocks', pubsubListener);
})

export default app;

app.listen(3000, async () => {
  await client.connect();
  await pubsub.connect();
  console.log("Server is running on port 3000");
});
