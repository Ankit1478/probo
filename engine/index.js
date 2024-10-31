import express, { json } from 'express';
const app = express();
import { ORDERBOOK,STOCK_BALANCES,INR_BALANCES } from './utils/book.js';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const client = createClient();
const pubsub = createClient();
await client.connect();


app.use(express.json());


async function startTask(datas) {
   const {type , data , requestId } = JSON.parse(datas)
   
    switch (type) {

        case 'eventCreated':
            const eventCreated = data;
            ORDERBOOK[eventCreated] = { yes: {}, no: {} };
            await pubsub.publish("events", JSON.stringify({
                requestId: requestId,
                error: false,
                msg: JSON.stringify(eventCreated)
            }));

        break;

        case 'getUserBalance':
            const userId = data;
            if (!INR_BALANCES.hasOwnProperty(userId)) {
                await pubsub.publish("fetchUserBalance", JSON.stringify({
                    requestId: requestId,
                    error: true,
                    msg: JSON.stringify("user doesn't exist")
                }));
            } else {
                
                await pubsub.publish("fetchUserBalance", JSON.stringify({
                    requestId: requestId,
                    error: false,
                    msg: JSON.stringify(INR_BALANCES[userId])
                }));
            }

            break;  
           
        case 'onrampMoney':
            const amount = data.amount;
            const userIdMoney = data.userId;
            
        
            if(!INR_BALANCES.hasOwnProperty(userIdMoney)){
                
                INR_BALANCES [userIdMoney] = { balance: 0, locked: 0 };
                INR_BALANCES[userIdMoney].balance += parseInt(amount);
                await pubsub.publish("accountUpdate",JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${JSON.stringify(`${amount} has added in ${userIdMoney}`)}`
            }))
            }
            else{

                INR_BALANCES[userIdMoney].balance += parseInt(amount);
               
                await pubsub.publish("accountUpdate",JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${JSON.stringify(`${amount} has added in ${userIdMoney}`)}`
            }))
            }
            

        break;

         case 'newUser':
               const newuserId = JSON.parse(data);
           

                INR_BALANCES[newuserId]= { balance: 0, locked: 0 };
                // console.log(INR_BALANCES)
               
                STOCK_BALANCES[newuserId] = {}
                
        
                await pubsub.publish("newuserAdded",JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg:JSON.stringify(newuserId)
                }))

            break;

        case 'newStockSymbol':
            const newstockSymbol = data
          
            const users = Object.keys(STOCK_BALANCES);
            
            for(const userId of users){
                STOCK_BALANCES[userId][newstockSymbol]={
                    "yes":{quantity:0,locked:0},
                    "no":{quantity:0,locked:0}
                };
            }

            ORDERBOOK[newstockSymbol] = {yes: {}, no: {}};
           
            await pubsub.publish("symbolCreated" ,JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${JSON.stringify(`${newstockSymbol} created successfully !`)}`
            }))

         break;

         case "orderBookCheck":
            const symbol = data

            if(!ORDERBOOK[symbol]){
                ORDERBOOK[symbol] ={ yes: {}, no: {} }
            
                const orderBooks = ORDERBOOK[symbol]

                await pubsub.publish("getOrderBook" ,JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg:JSON.stringify(orderBooks)
                }))

            }
            else{
            const orderBooks = ORDERBOOK[symbol]
            await pubsub.publish("getOrderBook" ,JSON.stringify({
                requestId: requestId,
                error:false,
                msg:JSON.stringify(orderBooks)
            }))
            }

        break

        case "mint":
            const mintId = data.userId
            const mintStockSyambol = data.stockSymbol
            const minQuantity = data.quantity

            if (!STOCK_BALANCES[mintId]) {
                STOCK_BALANCES[mintId] = {};
              }
             
            
              if (!STOCK_BALANCES[mintId][mintStockSyambol]) {
                STOCK_BALANCES[mintId] = 
               { [mintStockSyambol]:{
                  yes: {
                    quantity: 0,
                    locked: 0,
                  },
                  no: {
                    quantity: 0,
                    locked: 0,
                  },
                }}
              }
             
            
              if(!STOCK_BALANCES[mintId][mintStockSyambol].yes || !STOCK_BALANCES[mintId][mintStockSyambol].no) {
                STOCK_BALANCES[mintId][mintStockSyambol].yes = { quantity: 0, locked: 0 };
                STOCK_BALANCES[mintId][mintStockSyambol].no = { quantity: 0, locked: 0 };
              }
            
              STOCK_BALANCES[mintId][mintStockSyambol].yes.quantity += parseInt(minQuantity);
              
              STOCK_BALANCES[mintId][mintStockSyambol].no.quantity += parseInt(minQuantity);
             

              await pubsub.publish("minttrade" ,JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${JSON.stringify(`${minQuantity} has added in ${mintId}`)}`
            }))

        break

        case 'getStockBalance':
            const stockholderUserId = data.userId
           

            if (!STOCK_BALANCES[stockholderUserId] ) {
                STOCK_BALANCES[stockholderUserId] ={}
                await pubsub.publish("fetchStockBalance" ,JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:`${stockholderUserId} doesn't exits !`
                }))
              }
            else{

                const stockBalance = STOCK_BALANCES[stockholderUserId];

                await pubsub.publish("fetchStockBalance" ,JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg:`${JSON.stringify(stockBalance)}`
                }))
            }
        break;

        case 'buy':
            const TRANSACTIONS = [];
            const buyerId = data.userId
            const stockSymbol = data.stockSymbol
            const quantity = data.quantity
            const price = data.price
            const stockType = data.stockType
    

           
            let userBalance =( INR_BALANCES[buyerId].balance)/100;

        
            let totalCost = (price/100) * quantity/100;
        
            // Check if user has sufficient INR balance 
            if (userBalance < totalCost) {
                await pubsub.publish("buyStocks",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:json("insufficent Inr")
                }))
            }  

            const eventId = generateEventId(stockSymbol, stockType);
            
            // const bookEntry = ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType];
            let yesOrNoEntry = false;
            //check yes or no entry is empty
            if(ORDERBOOK[stockSymbol] &&ORDERBOOK[stockSymbol][stockType] )
            if (Object.keys(ORDERBOOK[stockSymbol][stockType]).length != 0) {
                yesOrNoEntry = true;
            }
            //Exact Price Match - Two Cases 
        
             
            
            if (yesOrNoEntry === true && ORDERBOOK[stockSymbol][stockType].hasOwnProperty(price/100)) {
                let remainingQuantity = quantity;
                let totalSpent = 0;
               
                const quantityWeNeed = quantity;
               
                const quantityHaveInOrderBook = ORDERBOOK[stockSymbol][stockType][price/100].total;

                
                if (quantityWeNeed <= quantityHaveInOrderBook) {

                    //1st case - when Quantity match with same Price 
                    //2nd case - when we we need less less Quantiy

                    if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price/100]) {
                        let stocks = ORDERBOOK[stockSymbol][stockType][price/100].orders;

                        for (const seller in stocks) {

                            if (remainingQuantity == 0) break;
                            let availableQuantity = stocks[seller].quantity;

                            //how many stocks i have to buy 
                            let boughtQuantity = Math.min(parseInt(availableQuantity), parseInt(remainingQuantity));
                       

                            if (stocks[seller] == 0) {
                                delete stocks[seller];
                            }


                            stocks[seller] -= parseInt(boughtQuantity);
                            
    

                            let transactionAmount = boughtQuantity * price;
                           

                            remainingQuantity -= boughtQuantity;
                            
                            totalSpent += transactionAmount;


                            ORDERBOOK[stockSymbol][stockType][price/100].total -= (boughtQuantity);

                            if (ORDERBOOK[stockSymbol][stockType][price/100].total === 0) {
                                delete ORDERBOOK[stockSymbol][stockType][price/100];
                            }
                            
                            
                            STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                            


                            let newTransaction = {
                                id: generateUniqueId(),
                                buyerAccountId: buyerId,
                                sellerAccountId: seller,
                                tradeQty: boughtQuantity,
                                buyPrice: price,
                                buyerOrderId: generateUniqueId(),
                                sellerOrderId: generateUniqueId(),
                                eventId: eventId,
                            };

                            // await prisma.buytrade.create({
                            //     data:{
                            //         ...newTransaction
                            //     }
                            //   })

                            // Add the new transaction to the TRANSACTIONS array
                            TRANSACTIONS.push(newTransaction);
                        }
                        
                        

                        let prices = totalCost * 100;
                        INR_BALANCES[buyerId].balance -=prices;

                        await pubsub.publish("buyStocks",JSON.stringify({
                            requestId: requestId,
                            error:false,
                            msg: JSON.stringify({ message: ORDERBOOK })
                        }))
                        
                        
                        await pubsub.publish(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));
                    }
                }
                //3rd case - when we need more Quantiy with same Price -> create No order wit same price 
                else {
                    let remainingQuantity = quantity;
                    let totalSpent = 0;

                    if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price/100]) {
                        let stocks = ORDERBOOK[stockSymbol][stockType][price/100].orders;
                        

                        for (const seller in stocks) {
                            

                            if (remainingQuantity == 0) break;

                            let availableQuantity = stocks[seller].quantity;

                            //how many stocks i have to buy 
                            let boughtQuantity = Math.min(parseInt(availableQuantity), parseInt(remainingQuantity));
                            

                            stocks[seller] -= boughtQuantity;

                            if (stocks[seller] == 0) {
                                delete stocks[seller];
                            }
                            

                            let transactionAmount = boughtQuantity * price;
                            console.log("mulily "+ price);
                            console.log("boughtQuantity "+boughtQuantity)
                            
                            remainingQuantity -= boughtQuantity;
                            
                            
                            
                            totalSpent += transactionAmount;
                            

                            ORDERBOOK[stockSymbol][stockType][price/100].total -= (boughtQuantity);


                            if (ORDERBOOK[stockSymbol][stockType][price/100].total === 0) {
                                delete ORDERBOOK[stockSymbol][stockType][price/100];
                            }

                            if (!STOCK_BALANCES[buyerId][stockSymbol]) {
                                STOCK_BALANCES[buyerId][stockSymbol] = {};
                            }
                            if (!STOCK_BALANCES[buyerId][stockSymbol][stockType]) {
                                STOCK_BALANCES[buyerId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
                            }
                            STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                            
                        
                            let newTransaction = {
                                id: generateUniqueId(),
                                buyerAccountId: buyerId,
                                sellerAccountId: seller,
                                tradeQty: boughtQuantity,
                                buyPrice: price,
                                buyerOrderId: generateUniqueId(),
                                sellerOrderId: generateUniqueId(),
                                eventId: eventId,
                            };

                            // await prisma.buytrade.create({
                            //     data:{
                            //         ...newTransaction
                            //     }
                            //   })

                            
                            // Add the new transaction to the TRANSACTIONS array
                            TRANSACTIONS.push(newTransaction);

                        }

                        
                        const reverseStockType = stockType === "yes" ? "no" : "yes";
                        const reverseAmount = 10 - (price/100);

                        // console.log("remainingQuantity " + remainingQuantity)
                      
                        // Check if reverseStockType exists in the order book, if not, initialize it
                        if(remainingQuantity>0)
                        { 
                        if (!ORDERBOOK[stockSymbol][reverseStockType]) {
                            ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
                        }

                        if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][reverseStockType]) {
                            ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
                                "total": parseInt(remainingQuantity),
                                "orders": {
                                     [buyerId]:{
                                        type: "reverted",
                                        quantity:parseInt(remainingQuantity) 
                                     } 
                            }
                            }
                            INR_BALANCES[buyerId].balance -= parseInt(remainingQuantity * price)
                        }}

                        STOCK_BALANCES[buyerId][stockSymbol][stockType].locked += parseInt(remainingQuantity)
                    
                        INR_BALANCES[buyerId].balance -= parseInt(totalSpent)
                        console.log(INR_BALANCES[buyerId])
                        INR_BALANCES[buyerId].locked += parseInt((quantity * price) - (totalSpent ));
                       
                    }

                    await pubsub.publish("buyStocks",JSON.stringify({
                        requestId: requestId,
                        error:false,
                        msg:JSON.stringify(ORDERBOOK) 
                    }))

                    await pubsub.publish(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));

                }
            }
            else {

                let transaction = [];
                
                

                const reverseStockType = stockType === "yes" ? "no" : "yes";
                const reverseAmount = (10 - price/ 100) ; 

                // Update user balances
                const userbalances = INR_BALANCES[buyerId].balance ;
                //  console.log(userbalances)
                // console.log(parseInt(price) * parseInt(quantity))
                
                const totalcosts = parseInt(price) * parseInt(quantity);
        
                const totalamount = userbalances - totalcosts;
               
                
                INR_BALANCES[buyerId].balance -= totalcosts;
                INR_BALANCES[buyerId].locked += totalcosts;

                if(ORDERBOOK[stockSymbol][reverseStockType].hasOwnProperty(reverseAmount)){
                    const orders =  ORDERBOOK[stockSymbol][reverseStockType][reverseAmount].orders
                    ORDERBOOK[stockSymbol][reverseStockType][reverseAmount].total+=parseInt(quantity);
                    orders[buyerId] ={
                        type: "reverted",
                        quantity: quantity,
                    }
                }
                // Create the exact orderbook structure expected by the test
                else {
                    ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
                        total: quantity,
                        orders: {
                        [buyerId]: {
                            type: "reverted",
                            quantity: quantity,
                        }
                        }
                    };
                }
                
                STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity+=parseInt(quantity)

                
            
                // Create transaction record
                const newTransaction = {
                    id: generateUniqueId(),
                    buyerAccountId: buyerId,
                    sellerAccountId: buyerId,
                    tradeQty: quantity,
                    buyPrice: price,
                    buyerOrderId: generateUniqueId(),
                    sellerOrderId: generateUniqueId(),
                    eventId: generateUniqueId(),
                };
                
                transaction.push(newTransaction);

                // Publish updates
                await pubsub.publish("buyStocks", JSON.stringify({
                    requestId: requestId,
                    error: false,
                    msg: JSON.stringify({ message: ORDERBOOK })
                }));

               
               
                await pubsub.publish(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));
     }
        break;
        
        case 'sell':
            let transaction = [];
            const sellerId = data.userId
            const sellerStockSymbol = data.stockSymbol
            const sellerQuantity = data.quantity
            const sellerPrice = data.price
            const sellerStockType = data.stockType
            
           
            if (!STOCK_BALANCES[sellerId] || !STOCK_BALANCES[sellerId][sellerStockSymbol] || !STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType]) {
                await pubsub.publish("sellStocks",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg: JSON.stringify("Nop Stocks Found!") 
                }))
            }

            const eventIds = generateEventId(sellerStockSymbol, sellerStockType);
            

            const reverseStockType = sellerStockType === "yes" ? "no" : "yes";
            if (STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].quantity < sellerQuantity) {
                await pubsub.publish("sellStocks",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg: JSON.stringify("you have not enough quantity to sell Stoc") 
                }))
            }

           
        
             if (!ORDERBOOK[sellerStockSymbol] || !ORDERBOOK[sellerStockSymbol][sellerStockType] || !ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice]) {
                ORDERBOOK[sellerStockSymbol] = ORDERBOOK[sellerStockSymbol] || { yes: {}, no: {} };
                ORDERBOOK[sellerStockSymbol][sellerStockType] = ORDERBOOK[sellerStockSymbol][sellerStockType] || {};
                ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice/100] = {
                    "total": sellerQuantity,
                    "orders": {
                        [sellerId]:{
                            type: "sell",
                            quantity: sellerQuantity
                        }
                    }
                }
        
                STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].locked += sellerQuantity;
                STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].sellerQuantity -= sellerQuantity;
            }

            else  if(ORDERBOOK[sellerStockSymbol] && ORDERBOOK[sellerStockSymbol][sellerStockType] && !ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice]){
                ORDERBOOK[sellerStockSymbol] = {
                    [reverseStockType]:
                   {[10 - sellerPrice/100] : {
                    "total": sellerQuantity,
                    "orders": {
                        [sellerId]:{
                            type: "sell",
                            quantity: sellerQuantity
                        }
                    }
                }
            }
            }
            
                STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].locked += sellerQuantity;
                STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].sellerQuantity -= sellerQuantity;
            }
            

            else if (ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice]) {
                ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].orders[sellerId] = sellerQuantity
                ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].total = 0;
                let totalsellerPrice = ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].total;
                for (const stocks in ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].orders) {
                    totalsellerPrice += parseInt(ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].orders[stocks]);
                }
                ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice].total = totalsellerPrice
                if (STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].quantity < sellerQuantity) {
                    await pubsub.publish("sellStocks",JSON.stringify({
                        requestId: requestId,
                        error:true,
                        msg: JSON.stringify("you have not enough quantity to sell Stock") 
                    }))
                    
                }
                else {
                    STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].locked += parseInt(sellerQuantity);
                    STOCK_BALANCES[sellerId][sellerStockSymbol][sellerStockType].quantity -= parseInt(sellerQuantity);
                }
            }
           
            const newTransaction = {
                id: generateUniqueId(),
                sellerAccountId: sellerId,
                tradeQty: sellerQuantity,
                sellPrice: sellerPrice,
                sellerOrderId: generateUniqueId(),
                eventId: eventIds,
                
            };

            INR_BALANCES[sellerId].balance+=parseInt(sellerPrice*sellerQuantity);
           
           

            transaction.push(newTransaction);
        
            const combinedBalances = {
                INR_BALANCES,
                STOCK_BALANCES,
                ORDERBOOK,
                transaction
            };

            // await prisma.selltrade.create({
            //     data: newTransaction,
            //   });
              
            await pubsub.publish("sellStocks",JSON.stringify({
                requestId: requestId,
                error:false,
                msg: JSON.stringify(combinedBalances) 
            }))
            
            await pubsub.publish(`sentToWebSocket.${sellerStockSymbol}`, JSON.stringify(ORDERBOOK[sellerStockSymbol] ));

            break

        case 'reset':
            
         
            Object.keys(INR_BALANCES).forEach(key => delete INR_BALANCES[key]);
            Object.keys(ORDERBOOK).forEach(key => delete ORDERBOOK[key]);
            Object.keys(STOCK_BALANCES).forEach(key => delete STOCK_BALANCES[key]);

            await pubsub.publish("resetMemory", JSON.stringify({
                requestId: requestId,
                error: false,
                msg: JSON.stringify("reset Done") 
}));


        break
    }
}

async function worker() {
    while (true) {
        try {
            const result = await client.blPop("RedisQueue",0);
            startTask(result.element)
        }
        catch (e) {
            console.log(e);
            console.log("error")
            process.exit()
        }
    }
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

const generateEventId = (stockSymbol, stockType) => {
    return `${stockSymbol}_${stockType}_${Date.now()}`;  // Unique event ID based on symbol, type, and timestamp
};



app.listen(3001, async () => {
    await Promise.all([
       
        pubsub.connect(),
    ])
    await worker();
    console.log("Engine is running properly at port 3001")
})