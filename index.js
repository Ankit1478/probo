import express, { json } from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
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

  const ORDERBOOK = {
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


app.post("/user/create/:userId",(req,res)=>{
    const userId = req.params.userId;
    INR_BALANCES[userId]={balance:0,locked:0};
    res.status(201).json({message: `User ${userId} created`});
})


app.post("/symbol/create/:stockSymbol",(req,res)=>{
    const stockSymbol = req.params.stockSymbol;
    const users = Object.keys(STOCK_BALANCES);
    for(const userId of users){
        STOCK_BALANCES[userId][stockSymbol]={"yes":{quantity:1,locked:0}};
    }
    res.status(201).json({message:`Symbol ${stockSymbol} created`});
})



app.get("/orderbook",(req,res)=>{
    return res.json({ORDERBOOK});
})



app.get("/balances/inr", (req, res) => {
    return res.json(INR_BALANCES);  
});


app.get("/balances/stock",(req,res)=>{
    return res.json(STOCK_BALANCES);
})

//get user balance
app.get("/balances/:userId",(req,res)=>{    
    const userId = req.params.userId;
    const balance = INR_BALANCES[userId].balance;
    return res.json({balance});
})

app.post('/onramp/inr',(req,res)=>{
    const {userId ,amount} = req.body;
    INR_BALANCES[userId].balance+=parseInt(amount);
   
    res.json({message:`Onramped ${userId} with amount ${amount}`});
})

//get stsock balance
app.get("/balance/stock/:userId",(req,res)=>{    
    const userId = req.params.userId;
    const stockBalance = STOCK_BALANCES[userId];
    return res.json({stockBalance});
})


app.post("/order/buy", (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  // Check if the user exists
  if (!INR_BALANCES[userId]) {
    return res.status(400).send({ message: "User not found" });
  }
  
  let userBalance = INR_BALANCES[userId].balance / 100;
  let totalCost = (price/100) * quantity;

  // Check if user has sufficient INR balance 
  if (userBalance < totalCost) {
    return res.status(400).send({ message: "Insufficient INR balance" });
  }
 
  let remainingQuantity = quantity;
  let totalSpent = 0;


   // Exact price match
  if(ORDERBOOK[stockSymbol][stockType].hasOwnProperty(price)){
  if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price]  ) {
    let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;
  
    for(const seller in stocks){
      if(remainingQuantity==0)break;
      let availableQuantity = stocks[seller];
      //how many stocks i have to buy 
      let boughtQuantity = Math.min(availableQuantity , remainingQuantity);

      // stocks buy from sellers
      stocks[seller]-=boughtQuantity;
      if(stocks[seller]==0){
        delete stocks[seller];
      }

      let transactionAmount = boughtQuantity * price;
      INR_BALANCES[userId].balance -= transactionAmount;
      INR_BALANCES[seller].balance += transactionAmount;
     
      
      if(!STOCK_BALANCES[userId][stockSymbol]){
        STOCK_BALANCES[userId][stockSymbol]={};
      }
      if(!STOCK_BALANCES[userId][stockSymbol][stockType]){
        STOCK_BALANCES[userId][stockSymbol][stockType]={quantity:0,locked:0};
      }
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);

      remainingQuantity -= boughtQuantity;
      totalSpent += transactionAmount;

      ORDERBOOK[stockSymbol][stockType][price].total -= (quantity - remainingQuantity)
      

      if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
        delete ORDERBOOK[stockSymbol][stockType][price];
      }
      INR_BALANCES[userId].locked -= quantity;
    }
  }
  }

  else{
    // 3 cases 
    // 1st case -> create a no Order with 10-x
    if (!ORDERBOOK[stockSymbol]) {
      ORDERBOOK[stockSymbol] = { yes: {}, no: {} }; 
    }

    const reverseStockType = stockType === "yes" ?"no":"yes";
    const reverseAmount = 10 - (price / 100);

    if(ORDERBOOK[stockSymbol][stockType] && !ORDERBOOK[stockSymbol][reverseStockType].hasOwnProperty(reverseAmount)){
      ORDERBOOK[stockSymbol] = {
        [reverseStockType]: {
          "total": reverseAmount,
          "orders": {
            [userId]: reverseAmount
          }
        }
      }
      INR_BALANCES[userId].balance -=(price*quantity);
      INR_BALANCES[userId].locked +=(price*quantity);

      // it will sell by no 
      if(!STOCK_BALANCES[userId][stockSymbol][reverseStockType]){
        STOCK_BALANCES[userId][stockSymbol]={
          [reverseStockType]:{
            "quantity":0,
            "locked":quantity
          }
        }
      }
    }

    return res.json( {ORDERBOOK })
    
  }
  
  res.status(200).send({ 
    message: "Order successfully filled",
    quantityFilled: quantity,
    totalSpent,
    INR_BALANCES
  });
});


app.post("/order/sell",(req,res)=>{
  const {userId , stockSymbol , quantity , price , stockType} = req.body;

  if (!STOCK_BALANCES[userId]) {
    return res.status(400).json({ message: "User doesn't exist or doesn't have stocks" });
  }

  if (quantity <= 0) {
    return res.status(400).json({ message: "Quantity must be greater than zero" });
  }
  

  if(STOCK_BALANCES[userId][stockSymbol][stockType].quantity<quantity){
    return res.status(400).json({message:"you have not enough quantity to sell Stock"})
  }
  
  if (!ORDERBOOK[stockSymbol][stockType][price]) {
  ORDERBOOK[stockSymbol][stockType][price]={
    "total":quantity,
      "orders":{
        [userId]:quantity
    }
  }
  console.log(":hii")
  STOCK_BALANCES[userId][stockSymbol][stockType].locked +=quantity;
  STOCK_BALANCES[userId][stockSymbol][stockType].quantity -=quantity;
  }
 
 else  if(ORDERBOOK[stockSymbol][stockType][price]){
    console.log("hi")
    ORDERBOOK[stockSymbol][stockType][price].orders[userId] = quantity
    ORDERBOOK[stockSymbol][stockType][price].total =0;
    let totalPrice = ORDERBOOK[stockSymbol][stockType][price].total ;
    for(const stocks in ORDERBOOK[stockSymbol][stockType][price].orders){
      totalPrice+=ORDERBOOK[stockSymbol][stockType][price].orders[stocks];
  
    }
    ORDERBOOK[stockSymbol][stockType][price].total = totalPrice
    if(STOCK_BALANCES[userId][stockSymbol][stockType].quantity<quantity){
      return res.json({message:"you have not enough quantity to sell Stock"})
    }
    else{
      STOCK_BALANCES[userId][stockSymbol][stockType].locked +=quantity;
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity -=quantity;
    }
   
  }

  res.json({ORDERBOOK , INR_BALANCES , STOCK_BALANCES})
})

app.post("/trade/mint",(req,res)=>{
    const{userId , stockSymbol , quantity}= req.body;

    if (!INR_BALANCES[userId]) {
      return res.status(404).json({ error: `User ${userId} not found` });
  }

  if(!STOCK_BALANCES[userId][stockSymbol]){
    return STOCK_BALANCES[userId][stockSymbol]={};
  }
 
  const  userBalance = INR_BALANCES[userId].balance;
  const price = parseInt(userBalance);
  const totalBalance =  price*quantity*2;

  
  if(!userId || !stockSymbol || !quantity){
      res.json("please add valuebale information")
    }


    if(!STOCK_BALANCES[userId][stockSymbol].yes){
         STOCK_BALANCES[userId][stockSymbol]={
            yes:{
                "quantity": quantity,
                "locked": 0
            }
        }

    }
    if(!STOCK_BALANCES[userId][stockSymbol].no){
        STOCK_BALANCES[userId][stockSymbol].no={
                "quantity": quantity,
                "locked": 0
        }
    }

    STOCK_BALANCES[userId][stockSymbol].yes.quantity += parseInt(quantity);
    STOCK_BALANCES[userId][stockSymbol].no.quantity += parseInt(quantity);

    const remainingBalance = totalBalance - price;
    res.json({ message:  `Minted ${quantity}  'yes' and 'no' tokens for user ${userId}, remaining balance is ${remainingBalance}` });
})


export default app;


    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
