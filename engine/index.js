import express from 'express';
const app = express();
const router = express.Router();

app.use(express.json());
const INR_BALANCES = {
    "user1": {
       balance: 100000,
       locked: 0
    },
    "user2": {
       balance: 100000,
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
                         "user2":10
                     }
                 },
                 8.5: {
                     "total": 12,
                     orders: {
                         "user1": 3,
                         "user2": 9,
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
			   "quantity": 2,
			   "locked": 10
		   },
	   }
	},
	user2: {
		"BTC_USDT_10_Oct_2024_9_30": {
		   "no": {
			   "quantity": 3,
			   "locked": 4
		   },
           "yes":{
            "quantity": 3,
			"locked": 10
           }
	   }
	}
}

const TRADE ={
    "buyerId":Math.random.toString(),
    "sellerId":Math.random.toString(),
    "buyQuentity":0,
    "sellQuantity":0,
    "BuyerTransactionId":Math.random.toString(),
    "SellerTransactionId":Math.random.toString(),
    "BuyPrice":Math.random.toString(),
    "SellPrice":Math.random.toString(),
}


const generateEventId = (stockSymbol, stockType) => {
    return `${stockSymbol}_${stockType}_${Date.now()}`;  // Unique event ID based on symbol, type, and timestamp
};
const TRANSACTIONS = [];
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

app.post("/order/buy",(req,res)=>{
   const { userId, stockSymbol, quantity, price, stockType } = req.body;

    // Check if the user exists
    if (!INR_BALANCES[userId]) {
     return res.status(400).send({ message: "User not found" });
    }

    let userBalance = INR_BALANCES[userId].balance / 100;
    let totalCost = (price) * quantity;
    

    // Check if user has sufficient INR balance 
    if (userBalance < totalCost) {
    return res.status(400).send({ message: "Insufficient INR balance" });
   }

   const eventId = generateEventId(stockSymbol, stockType);

   //Exact Price Match - Two Cases 
   if(ORDERBOOK[stockSymbol][stockType].hasOwnProperty(price)){
    let remainingQuantity = quantity;
    let totalSpent = 0;
 
    const quantityWeNeed = quantity;
    const quantityHaveInOrderBook =  ORDERBOOK[stockSymbol][stockType][price].total;
   
    if(quantityWeNeed<=quantityHaveInOrderBook){
        //1st case - when Quantity match with same Price 
        //2nd case - when we we need less less Quantiy

        if(ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] &&ORDERBOOK[stockSymbol][stockType][price] ){
            let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;
            
            for(const seller in stocks){
                
                if(remainingQuantity==0)break;
                let availableQuantity = stocks[seller];
    
                //how many stocks i have to buy 
                let boughtQuantity = Math.min(availableQuantity , remainingQuantity);
                
    
                stocks[seller]-=boughtQuantity;
                console.log(seller)
               
                if(stocks[seller]==0){
                    delete stocks[seller];
                }
                
                let transactionAmount = boughtQuantity * price;
                // console.log("remainingQuantity "+remainingQuantity)
                
                remainingQuantity -= boughtQuantity;
                // console.log("After remainingQuantity "+remainingQuantity)
                totalSpent += transactionAmount;
                
                
    
    
                ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);
   
                if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
                    delete ORDERBOOK[stockSymbol][stockType][price];
                }
    
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                if(STOCK_BALANCES[seller][stockSymbol][stockType].locked>=boughtQuantity){
                    STOCK_BALANCES[seller][stockSymbol][stockType].locked-=parseInt(boughtQuantity);
                }
                
                //seller Account INR Update
                INR_BALANCES[seller].balance += transactionAmount;

                const newTransaction = {
                    id: generateUniqueId(),
                    buyer_account_id: userId,
                    seller_account_id: seller,
                    trade_qty: boughtQuantity,
                    buy_price: price,
                    buyer_order_id: generateUniqueId(),
                    seller_order_id: generateUniqueId(),
                    event_id: eventId,
                    created_src: "USER",
                    updated_src: "USER"
                };

                // Add the new transaction to the TRANSACTIONS array
                TRANSACTIONS.push(newTransaction);
            }
            
            let prices = totalCost*100;
    
            
            INR_BALANCES[userId].balance -= (prices.toFixed(1)*100);
            // console.log(INR_BALANCES[userId].balance -= (prices.toFixed(1)))
            // console.log(INR_BALANCES[userId].balance/100)
            
            return res.json({ORDERBOOK , INR_BALANCES ,STOCK_BALANCES , TRANSACTIONS})
        }
    }
    //3rd case - when we need more Quantiy with same Price -> create No order wit same price 
    else{
        let remainingQuantity = quantity;
        let totalSpent = 0;
       
        if(ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] &&ORDERBOOK[stockSymbol][stockType][price] ){
            let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;
           
            for(const seller in stocks){
                if(remainingQuantity==0)break;
                let availableQuantity = stocks[seller];

                //how many stocks i have to buy 
                let boughtQuantity = Math.min(availableQuantity , remainingQuantity);
                
    
                stocks[seller]-=boughtQuantity;
                
                if(stocks[seller]==0){
                    delete stocks[seller];
                }
               
                
                let transactionAmount = boughtQuantity * price;
                console.log("before" + remainingQuantity)
                remainingQuantity -= boughtQuantity;
                console.log("after"+remainingQuantity)
                totalSpent += transactionAmount;
    
                ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);
    
    
                if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
                    delete ORDERBOOK[stockSymbol][stockType][price];
                }
    
                if(!STOCK_BALANCES[userId][stockSymbol]){
                    STOCK_BALANCES[userId][stockSymbol]={};
                }
                if(!STOCK_BALANCES[userId][stockSymbol][stockType]){
                    STOCK_BALANCES[userId][stockSymbol][stockType]={quantity:0,locked:0};
                }
                STOCK_BALANCES[userId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                console.log(boughtQuantity)
                console.log(STOCK_BALANCES[seller][stockSymbol][stockType].locked-=parseInt(boughtQuantity))
                
                //seller Account INR Update
                INR_BALANCES[seller].balance += parseInt(transactionAmount*100);

                const newTransaction = {
                    id: generateUniqueId(),
                    buyer_account_id: userId,
                    seller_account_id: seller,
                    trade_qty: boughtQuantity,
                    buy_price: price,
                    buyer_order_id: generateUniqueId(),
                    seller_order_id: generateUniqueId(),
                    event_id: eventId,
                    created_src: "USER",
                    updated_src: "USER"
                };

                // Add the new transaction to the TRANSACTIONS array
                TRANSACTIONS.push(newTransaction);

                
            }
            
            

            // INR_BALANCES[userId].balance -= (prices.toFixed(1)*100);
            // console.log(INR_BALANCES[userId].balance/100 )

            const reverseStockType = stockType === "yes" ?"no":"yes";
            const reverseAmount = 10 - (price );
            
            // Check if reverseStockType exists in the order book, if not, initialize it
            if (!ORDERBOOK[stockSymbol][reverseStockType]) {
                ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
            }
          
            if(ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][reverseStockType]){
               
                ORDERBOOK[stockSymbol][reverseStockType][reverseAmount]={
                    "total":parseInt(remainingQuantity),
                    "order":[
                    { [userId]:parseInt(remainingQuantity)}
                    ]
                }
            }

            STOCK_BALANCES[userId][stockSymbol][stockType].locked+=parseInt(remainingQuantity)
            INR_BALANCES[userId].balance-=parseInt(totalSpent*100)
            INR_BALANCES[userId].locked+=parseInt((quantity*price )*100- (totalSpent*100));
            
            
        //    console.log(remainingQuantity);
        }
        return res.json({ORDERBOOK , INR_BALANCES ,STOCK_BALANCES , TRANSACTIONS})
    }
   }
   // Price is not presnt in orderBook 
   else{
   let transaction=[];
    if (!ORDERBOOK[stockSymbol]) {
        ORDERBOOK[stockSymbol] = { yes: {}, no: {} }; 
    }
   

    const reverseStockType = stockType === "yes" ?"no":"yes";
    const reverseAmount = 10 - (price / 100);


    if (!ORDERBOOK[stockSymbol][reverseStockType]) {
        ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
    }
   
    if(ORDERBOOK[stockSymbol][stockType] && !ORDERBOOK[stockSymbol][reverseStockType].hasOwnProperty(reverseAmount)){
        ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
          "total": 10-quantity,
          "orders": {
            [userId]: 10-quantity
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
     const newTransaction = {
        id: generateUniqueId(),
        buyer_account_id: userId,
        seller_account_id: userId,
        trade_qty: 10-quantity,
        buy_price: price,
        buyer_order_id: generateUniqueId(),
        seller_order_id: generateUniqueId(),
        event_id: eventId,
    };

    // Add the new transaction to the TRANSACTIONS array
    transaction.push(newTransaction);

    res.json({ORDERBOOK , STOCK_BALANCES , INR_BALANCES , transaction})
   }
  
})
console.log(TRANSACTIONS)

// Sell 
app.post("/order/sell",(req,res)=>{
    let transaction = [];
    const {userId , stockSymbol , quantity , price , stockType} = req.body;
  
    if (!STOCK_BALANCES[userId] || !STOCK_BALANCES[userId][stockSymbol] || !STOCK_BALANCES[userId][stockSymbol][stockType]) {
      return res.status(400).json({ message: "User doesn't exist or doesn't have stocks" });
    }
  
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    const eventId = generateEventId(stockSymbol, stockType);
    
  
    if(STOCK_BALANCES[userId][stockSymbol][stockType].quantity<quantity){
      return res.status(400).json({message:"you have not enough quantity to sell Stock"})
    }
    
    if (!ORDERBOOK[stockSymbol] || !ORDERBOOK[stockSymbol][stockType] || !ORDERBOOK[stockSymbol][stockType][price]) {
    ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || { yes: {}, no: {} };
    ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};
    ORDERBOOK[stockSymbol][stockType][price]={
      "total":quantity,
        "orders":{
          [userId]:parseInt(quantity)
      }
    }
    
    STOCK_BALANCES[userId][stockSymbol][stockType].locked +=quantity;
    STOCK_BALANCES[userId][stockSymbol][stockType].quantity -=quantity;
    }
   
   else  if(ORDERBOOK[stockSymbol][stockType][price]){
      ORDERBOOK[stockSymbol][stockType][price].orders[userId] = quantity
      ORDERBOOK[stockSymbol][stockType][price].total = 0;
      let totalPrice = ORDERBOOK[stockSymbol][stockType][price].total ;
      for(const stocks in ORDERBOOK[stockSymbol][stockType][price].orders){
        totalPrice+=parseInt(ORDERBOOK[stockSymbol][stockType][price].orders[stocks]);
      }
      ORDERBOOK[stockSymbol][stockType][price].total = totalPrice
      if(STOCK_BALANCES[userId][stockSymbol][stockType].quantity<quantity){
        return res.json({message:"you have not enough quantity to sell Stock"})
      }
      else{
        STOCK_BALANCES[userId][stockSymbol][stockType].locked +=parseInt(quantity);
        STOCK_BALANCES[userId][stockSymbol][stockType].quantity -=parseInt(quantity);
      }

    }
    const newTransaction = {
        id: generateUniqueId(),
        seller_account_id: userId,
        trade_qty: quantity,
        sell_price: price,
        seller_order_id: generateUniqueId(),
        event_id: eventId,
        status: "PENDING" 
    };

    transaction.push(newTransaction);

    res.json({ORDERBOOK , INR_BALANCES , STOCK_BALANCES , transaction})
    
  })
  

app.listen(3001)