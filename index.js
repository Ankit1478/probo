import express from 'express';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const client = createClient();
const pubsub = createClient();


const INR_BALANCES = {
  "user1": {
    balance: 10000,
    locked: 0
  },
  "user2": {
    balance: 10000,
    locked: 10
  }
};

export const ORDERBOOK = {
  "BTC_USDT_10_Oct_2024_9_30": {
    "yes": {
      9.5: {
        "total": 12,
        orders: {
          "user1": 2,
          "user2": 10
        }
      },
      8.5: {
        "total": 12,
        orders: {
          "user1": 3,
          "user2": 3,
          "user3": 6
        }
      },
    },
    "no": {

    }
  }
}

const STOCK_BALANCES = {
  user1: {
    "BTC_USDT_10_Oct_2024_9_30": {
      "yes": {
        "quantity": 100,
        "locked": 0
      },

    }
  },
  user2: {
    "BTC_USDT_10_Oct_2024_9_30": {
      "no": {
        "quantity": 3,
        "locked": 4
      }
    }
  }
}

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



app.post("/user/create/:userId", (req, res) => {
  const userId = req.params.userId;
  INR_BALANCES[userId] = { balance: 0, locked: 0 };
  if (!STOCK_BALANCES[userId]) STOCK_BALANCES[userId] = {}
  pushtoRedis("newUser", userId);
  res.status(201).json({ INR_BALANCES, STOCK_BALANCES });
})

app.post('/onramp/inr', (req, res) => {
  const { userId, amount } = req.body;
  INR_BALANCES[userId].balance += parseInt(amount);
  const addBalanceToUserAcount = INR_BALANCES[userId];
  pushtoRedis("onramp", addBalanceToUserAcount);
  res.json({ message: `Onramped ${userId} with amount ${amount}` });
})

app.post("/create/stockSymbol", (req, res) => {
  const { userId, stockSymbol } = req.body;
  STOCK_BALANCES[userId] = {
    [stockSymbol]: {
      "yes": {
        "quantity": 0,
        "locked": 0
      }
      ,
      "no": {
        "quantity": 0,
        "locked": 0
      }
    }
  }
  pushtoRedis("stockSymbol", stockSymbol);
  // res.status(201).json({message:`Symbol ${stockSymbol} created`});
  res.json({ STOCK_BALANCES })
})


//get user balance
app.get("/balances/:userId", async (req, res) => {
  const userId = req.params.userId;
  const requestId = uuidv4();
  // Push ino Queue
  pushtoRedis({
    type: "getUserBalance",
    data: userId,
    requestId:requestId
  });

  pubsub.subscribe('fetchUserBalance',(message)=>{
    const data = JSON.parse(message);
    console.log(data);
    if(data.requestId===requestId){
     return res.status(201).json({message:data.msg})
    }
    else{
      return res.status(400).json({message:data.msg})
    }
  })
})


//get stock balance
app.get("/balance/stock/:userId/:stockSymbol/:stocktype", (req, res) => {
  const userId = req.params.userId;
  const stockSymbol = req.params.stockSymbol;
  const stockType = req.params.stocktype;
  if (!STOCK_BALANCES[userId][stockSymbol]) {
    return res.json({ message: "Please Create Stock Symbol first" })
  }
  const stockBalance = STOCK_BALANCES[userId][stockSymbol][stockType].quantity;
  console.log(stockBalance)
  const userStockbalance = stockBalance;
  return res.json({ stockBalance });
})


app.post("/buy", async (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  if (INR_BALANCES[userId].balance < (price * 100) * quantity) {
    return res.json({ message: "You don't have balance in Your Account Please! Recharge your wallet" });
  }

  const userWantToBuy = {
    userId: userId,
    stockSymbol: stockSymbol,
    quantity: quantity,
    price: price,
    stockType: stockType,
    useAccountBalance: INR_BALANCES[userId].balance
  }
  redis.rpush("buy", JSON.stringify(userWantToBuy))
  // const a = await redis.lpop("buy");
  // const b = await JSON.parse(a);
  // const c = b.userId;
  res.json({ hii: "hi" })
})

export default app;

app.listen(3000, async () => {
  await client.connect();
  await pubsub.connect();
  console.log("Server is running on port 3000");
});
