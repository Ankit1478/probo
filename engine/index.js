import express, { json } from 'express';
const app = express();
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const client = createClient();
const pubsub = createClient();
await client.connect();


app.use(express.json());

let INR_BALANCES = {
    "user1": {
        balance: 1000000,
        locked: 0
    },
    "user2": {
        balance: 1000000,
        locked: 10
    }
};

let ORDERBOOK = {
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
                    "user2": 9,
                }
            },
        },
        "no": {

        }
    }
}

let STOCK_BALANCES = {
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
            "yes": {
                "quantity": 3,
                "locked": 10
            }
        }
    }
}

async function startTask(datas) {
   const {type , data , requestId } = JSON.parse(datas)
   
    switch (type) {
        case 'getUserBalance':
            const userId = data
            if(!INR_BALANCES.hasOwnProperty(userId)){
                await pubsub.publish("fetchUserBalance",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:"user doesn't exists"
                }))
            }
            else{
                await pubsub.publish("fetchUserBalance",JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg:`${userId} exists `
                })) 
            }
            break;  
           
        case 'onrampMoney':
            const amount = data.amount;
            const userIdMoney = data.userId;
        
            if(!INR_BALANCES[userIdMoney]){
                await pubsub.publish("accountUpdate",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:"No balance in Your account"
                }))
            }
            else{
                INR_BALANCES[userIdMoney].balance += parseInt(amount);
                await pubsub.publish("accountUpdate",JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${amount} has added in ${userIdMoney}`
            }))
            }
            

        break;

         case 'newUser':
            const newuserId = data;
           

            if(INR_BALANCES[newuserId]){
                await pubsub.publish("newuserAdded",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:`${newuserId} already Exists !`
                }))
            }
            else{
                INR_BALANCES[newuserId] = { balance: 0, locked: 0 };
                STOCK_BALANCES[newuserId] = { "BTC_USDT_10_Oct_2024_9_30": {
                    "yes": {
                        "quantity": 2,
                        "locked": 10
                    },
                }}
                
    
                await pubsub.publish("newuserAdded",JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg:`${newuserId} created successfully !`
                }))
            }
            break;

        case 'newStockSymbol':
            const newstockSymbol = data
            console.log(newstockSymbol)
            const users = Object.keys(STOCK_BALANCES);
            
            for(const userId of users){
                STOCK_BALANCES[userId][newstockSymbol]={"yes":{quantity:1,locked:0}};
            }
            ORDERBOOK[newstockSymbol] = {yes: {}, no: {}};
            await pubsub.publish("symbolCreated" ,JSON.stringify({
                requestId: requestId,
                error:false,
                msg:`${newstockSymbol} created successfully !`
            }))

         break;

         case "orderBookCheck":
            const symbol = data

            if(!ORDERBOOK[symbol]){
                ORDERBOOK[symbol] ={ yes: {}, no: {} }
                console.log(ORDERBOOK[symbol])
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

        case 'getStockBalance':
            const stockholderUserId = data.userId
            const stockSymobolHold = data.stockSymbol

            if (!STOCK_BALANCES[stockholderUserId][stockSymobolHold]) {
                await pubsub.publish("fetchStockBalance" ,JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:`${stockholderUserId} doesn't exits !`
                }))
              }
            else{
                const stockBalance = STOCK_BALANCES[stockholderUserId][stockSymobolHold];
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
      
            if (!INR_BALANCES[buyerId]) {          
                await pubsub.publish("buyStocks",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:JSON.stringify("user Doesn't Exists")
                }))             
            }
        
            let userBalance = INR_BALANCES[buyerId].balance / 100;
            let totalCost = (price) * quantity;
        
            // Check if user has sufficient INR balance 
            if (userBalance < totalCost) {
                await pubsub.publish("buyStocks",JSON.stringify({
                    requestId: requestId,
                    error:true,
                    msg:json("insufficent Inr")
                }))
            }  

            const eventId = generateEventId(stockSymbol, stockType);
            //Exact Price Match - Two Cases 
            if (ORDERBOOK[stockSymbol][stockType].hasOwnProperty(price)) {
                let remainingQuantity = quantity;
                let totalSpent = 0;

                const quantityWeNeed = quantity;
                const quantityHaveInOrderBook = ORDERBOOK[stockSymbol][stockType][price].total;

                if (quantityWeNeed <= quantityHaveInOrderBook) {
                    //1st case - when Quantity match with same Price 
                    //2nd case - when we we need less less Quantiy


                    if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price]) {
                        let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;

                      
                        for (const seller in stocks) {
                            if (remainingQuantity == 0) break;
                            let availableQuantity = stocks[seller];

                            //how many stocks i have to buy 
                            let boughtQuantity = Math.min(availableQuantity, remainingQuantity);


                            stocks[seller] -= boughtQuantity;
    

                            if (stocks[seller] == 0) {
                                delete stocks[seller];
                            }

                            let transactionAmount = boughtQuantity * price;
                           

                            remainingQuantity -= boughtQuantity;
                            // console.log("After remainingQuantity "+remainingQuantity)
                            totalSpent += transactionAmount;


                            ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);

                            if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
                                delete ORDERBOOK[stockSymbol][stockType][price];
                            }

                            if(STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity > quantity){
                                await pubsub.publish("buyStocks",JSON.stringify({
                                    requestId: requestId,
                                    error:true,
                                    msg: JSON.stringify("no Enough Quantity") 
                                }))
                            }
                            STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                            if (STOCK_BALANCES[seller][stockSymbol][stockType].locked >= boughtQuantity) {
                                STOCK_BALANCES[seller][stockSymbol][stockType].locked -= parseInt(boughtQuantity);
                            }

                            //seller Account INR Update
                            INR_BALANCES[seller].balance += (transactionAmount*100);


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

                            await prisma.buytrade.create({
                                data:{
                                    ...newTransaction
                                }
                              })

                            // Add the new transaction to the TRANSACTIONS array
                            TRANSACTIONS.push(newTransaction);
                        }
                        
                        

                        let prices = totalCost * 100;
                        INR_BALANCES[buyerId].balance -=prices;
                        console.log(INR_BALANCES[buyerId].balance)

                        await pubsub.publish("buyStocks",JSON.stringify({
                            requestId: requestId,
                            error:false,
                            msg: JSON.stringify(TRANSACTIONS) 
                        }))
                        await pubsub.publish("sentToWebSocket", JSON.stringify({ [stockSymbol]:ORDERBOOK[stockSymbol] }))
                    }
                }
                //3rd case - when we need more Quantiy with same Price -> create No order wit same price 
                else {
                    let remainingQuantity = quantity;
                    let totalSpent = 0;

                    if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price]) {
                        let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;

                        for (const seller in stocks) {
                            if (remainingQuantity == 0) break;
                            let availableQuantity = stocks[seller];

                            //how many stocks i have to buy 
                            let boughtQuantity = Math.min(availableQuantity, remainingQuantity);


                            stocks[seller] -= boughtQuantity;

                            if (stocks[seller] == 0) {
                                delete stocks[seller];
                            }


                            let transactionAmount = boughtQuantity * price;
                            console.log("before" + remainingQuantity)
                            remainingQuantity -= boughtQuantity;
                            console.log("after" + remainingQuantity)
                            totalSpent += transactionAmount;

                            ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);


                            if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
                                delete ORDERBOOK[stockSymbol][stockType][price];
                            }

                            if (!STOCK_BALANCES[buyerId][stockSymbol]) {
                                STOCK_BALANCES[buyerId][stockSymbol] = {};
                            }
                            if (!STOCK_BALANCES[buyerId][stockSymbol][stockType]) {
                                STOCK_BALANCES[buyerId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
                            }
                            STOCK_BALANCES[buyerId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
                            console.log(boughtQuantity)
                            console.log(STOCK_BALANCES[seller][stockSymbol][stockType].locked -= parseInt(boughtQuantity))

                            //seller Account INR Update
                            INR_BALANCES[seller].balance += parseInt(transactionAmount * 100);

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

                            await prisma.buytrade.create({
                                data:{
                                    ...newTransaction
                                }
                              })

                            
                            // Add the new transaction to the TRANSACTIONS array
                            TRANSACTIONS.push(newTransaction);

                        }

                        const reverseStockType = stockType === "yes" ? "no" : "yes";
                        const reverseAmount = 10 - (price);

                        // Check if reverseStockType exists in the order book, if not, initialize it
                        if (!ORDERBOOK[stockSymbol][reverseStockType]) {
                            ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
                        }

                        if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][reverseStockType]) {

                            ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
                                "total": parseInt(remainingQuantity),
                                "order": [
                                    { [buyerId]: parseInt(remainingQuantity) }
                                ]
                            }
                        }

                        STOCK_BALANCES[buyerId][stockSymbol][stockType].locked += parseInt(remainingQuantity)
                        INR_BALANCES[buyerId].balance -= parseInt(totalSpent * 100)
                        INR_BALANCES[buyerId].locked += parseInt((quantity * price) * 100 - (totalSpent * 100));
                       
                    }
                    
                    

                    
                    await pubsub.publish("buyStocks",JSON.stringify({
                        requestId: requestId,
                        error:false,
                        msg:JSON.stringify(STOCK_BALANCES[ buyerId]) 
                    }))

                    await pubsub.publish("sentToWebSocket", JSON.stringify({ [stockSymbol]:ORDERBOOK[stockSymbol] }))
                }
            }
            else {
                let transaction = [];
                if (!ORDERBOOK[stockSymbol]) {
                    ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
                }
        
        
                const reverseStockType = stockType === "yes" ? "no" : "yes";
                const reverseAmount = 10 - (price);
        
        
                if (!ORDERBOOK[stockSymbol][reverseStockType]) {
                    ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
                }
        
                if (ORDERBOOK[stockSymbol][stockType] && !ORDERBOOK[stockSymbol][reverseStockType].hasOwnProperty(reverseAmount)) {
                    ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
                        "total": 10 - quantity,
                        "orders": {
                            [buyerId]: 10 - quantity
                        }
                    }
        
                    INR_BALANCES[buyerId].balance -= (price * quantity);
                    INR_BALANCES[buyerId].locked += (price * quantity);
        
                    // it will sell by no 
                    if (!STOCK_BALANCES[buyerId][stockSymbol][reverseStockType]) {
                        STOCK_BALANCES[buyerId][stockSymbol] = {
                            [reverseStockType]: {
                                "quantity": 0,
                                "locked": quantity
                            }
                        }
                    }
        
                }
                const newTransaction = {
                    id: generateUniqueId(),
                    buyerAccountId: buyerId,
                    sellerAccountId: buyerId,
                    tradeQty: 10 - quantity,
                    buyPrice: price,
                    buyerOrderId: generateUniqueId(),
                    sellerOrderId: generateUniqueId(),
                    eventId: eventId,
                };


                await prisma.buytrade.create({
                    data:{
                        ...newTransaction
                    }
                  })

        
                // Add the new transaction to the TRANSACTIONS array
                transaction.push(newTransaction);
        
               
                await pubsub.publish("buyStocks",JSON.stringify({
                    requestId: requestId,
                    error:false,
                    msg: JSON.stringify(STOCK_BALANCES[ buyerId]) 
                }))

                await pubsub.publish("sentToWebSocket", JSON.stringify({ [stockSymbol]:ORDERBOOK[stockSymbol] }))

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
                ORDERBOOK[sellerStockSymbol][sellerStockType][sellerPrice] = {
                    "total": sellerQuantity,
                    "orders": {
                        [sellerId]: parseInt(sellerQuantity)
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

            transaction.push(newTransaction);
        
            const combinedBalances = {
                INR_BALANCES,
                STOCK_BALANCES,
                ORDERBOOK,
                transaction
            };

            await prisma.selltrade.create({
                data: newTransaction,
              });
              
            await pubsub.publish("sellStocks",JSON.stringify({
                requestId: requestId,
                error:false,
                msg: JSON.stringify(combinedBalances) 
            }))
            console.log(ORDERBOOK[sellerStockSymbol][sellerStockType])
            await pubsub.publish("sentToWebSocket", JSON.stringify({ [sellerStockSymbol]:{[sellerStockType]:ORDERBOOK[sellerStockSymbol][sellerStockType]} }))

            break

        case 'reset':
            INR_BALANCES = {
                "user1": {
                    balance: 1000000,
                    locked: 0
                },
                "user2": {
                    balance: 1000000,
                    locked: 10
                }
            };
            STOCK_BALANCES = {
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
                        "yes": {
                            "quantity": 3,
                            "locked": 10
                        }
                    }
                }
            }
            ORDERBOOK = {
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
                                "user2": 9,
                            }
                        },
                    },
                    "no": {
            
                    }
                }
            }
            

            await pubsub.publish("resetMemory",JSON.stringify({
                requestId: requestId,
                error:false,
                msg: JSON.stringify("reset Done") 
            }))

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


// app.post("/order/buy", async (req, res) => {
//     // const a = await redis.lpop("buy");
//     // const b = JSON.parse(a);
//     // console.log(b)


//     // const { userId, stockSymbol, quantity, price, stockType } = req.body;



   


//     // // Check if user has sufficient INR balance 
//     // if (userBalance < totalCost) {
//     //     return res.status(400).send({ message: "Insufficient INR balance" });
//     // }

//     const eventId = generateEventId(stockSymbol, stockType);

//     //Exact Price Match - Two Cases 
//     if (ORDERBOOK[stockSymbol][stockType].hasOwnProperty(price)) {
//         let remainingQuantity = quantity;
//         let totalSpent = 0;

//         const quantityWeNeed = quantity;
//         const quantityHaveInOrderBook = ORDERBOOK[stockSymbol][stockType][price].total;

//         if (quantityWeNeed <= quantityHaveInOrderBook) {
//             //1st case - when Quantity match with same Price 
//             //2nd case - when we we need less less Quantiy

//             if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price]) {
//                 let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;

//                 for (const seller in stocks) {

//                     if (remainingQuantity == 0) break;
//                     let availableQuantity = stocks[seller];

//                     //how many stocks i have to buy 
//                     let boughtQuantity = Math.min(availableQuantity, remainingQuantity);


//                     stocks[seller] -= boughtQuantity;
//                     console.log(seller)

//                     if (stocks[seller] == 0) {
//                         delete stocks[seller];
//                     }

//                     let transactionAmount = boughtQuantity * price;
//                     // console.log("remainingQuantity "+remainingQuantity)

//                     remainingQuantity -= boughtQuantity;
//                     // console.log("After remainingQuantity "+remainingQuantity)
//                     totalSpent += transactionAmount;




//                     ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);

//                     if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
//                         delete ORDERBOOK[stockSymbol][stockType][price];
//                     }

//                     STOCK_BALANCES[userId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
//                     if (STOCK_BALANCES[seller][stockSymbol][stockType].locked >= boughtQuantity) {
//                         STOCK_BALANCES[seller][stockSymbol][stockType].locked -= parseInt(boughtQuantity);
//                     }

//                     //seller Account INR Update
//                     INR_BALANCES[seller].balance += transactionAmount;

//                     const newTransaction = {
//                         id: generateUniqueId(),
//                         buyer_account_id: userId,
//                         seller_account_id: seller,
//                         trade_qty: boughtQuantity,
//                         buy_price: price,
//                         buyer_order_id: generateUniqueId(),
//                         seller_order_id: generateUniqueId(),
//                         event_id: eventId,
//                         created_src: "USER",
//                         updated_src: "USER"
//                     };

//                     // Add the new transaction to the TRANSACTIONS array
//                     TRANSACTIONS.push(newTransaction);
//                 }

//                 let prices = totalCost * 100;


//                 INR_BALANCES[userId].balance -= (prices.toFixed(1) * 100);
//                 // console.log(INR_BALANCES[userId].balance -= (prices.toFixed(1)))
//                 // console.log(INR_BALANCES[userId].balance/100)

//                 return res.json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES, TRANSACTIONS })
//             }
//         }
//         //3rd case - when we need more Quantiy with same Price -> create No order wit same price 
//         else {
//             let remainingQuantity = quantity;
//             let totalSpent = 0;

//             if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][stockType] && ORDERBOOK[stockSymbol][stockType][price]) {
//                 let stocks = ORDERBOOK[stockSymbol][stockType][price].orders;

//                 for (const seller in stocks) {
//                     if (remainingQuantity == 0) break;
//                     let availableQuantity = stocks[seller];

//                     //how many stocks i have to buy 
//                     let boughtQuantity = Math.min(availableQuantity, remainingQuantity);


//                     stocks[seller] -= boughtQuantity;

//                     if (stocks[seller] == 0) {
//                         delete stocks[seller];
//                     }


//                     let transactionAmount = boughtQuantity * price;
//                     console.log("before" + remainingQuantity)
//                     remainingQuantity -= boughtQuantity;
//                     console.log("after" + remainingQuantity)
//                     totalSpent += transactionAmount;

//                     ORDERBOOK[stockSymbol][stockType][price].total -= (boughtQuantity);


//                     if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
//                         delete ORDERBOOK[stockSymbol][stockType][price];
//                     }

//                     if (!STOCK_BALANCES[userId][stockSymbol]) {
//                         STOCK_BALANCES[userId][stockSymbol] = {};
//                     }
//                     if (!STOCK_BALANCES[userId][stockSymbol][stockType]) {
//                         STOCK_BALANCES[userId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
//                     }
//                     STOCK_BALANCES[userId][stockSymbol][stockType].quantity += parseInt(boughtQuantity);
//                     console.log(boughtQuantity)
//                     console.log(STOCK_BALANCES[seller][stockSymbol][stockType].locked -= parseInt(boughtQuantity))

//                     //seller Account INR Update
//                     INR_BALANCES[seller].balance += parseInt(transactionAmount * 100);

//                     const newTransaction = {
//                         id: generateUniqueId(),
//                         buyer_account_id: userId,
//                         seller_account_id: seller,
//                         trade_qty: boughtQuantity,
//                         buy_price: price,
//                         buyer_order_id: generateUniqueId(),
//                         seller_order_id: generateUniqueId(),
//                         event_id: eventId,
//                         created_src: "USER",
//                         updated_src: "USER"
//                     };

//                     // Add the new transaction to the TRANSACTIONS array
//                     TRANSACTIONS.push(newTransaction);


//                 }



//                 // INR_BALANCES[userId].balance -= (prices.toFixed(1)*100);
//                 // console.log(INR_BALANCES[userId].balance/100 )

//                 const reverseStockType = stockType === "yes" ? "no" : "yes";
//                 const reverseAmount = 10 - (price);

//                 // Check if reverseStockType exists in the order book, if not, initialize it
//                 if (!ORDERBOOK[stockSymbol][reverseStockType]) {
//                     ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
//                 }

//                 if (ORDERBOOK[stockSymbol] && ORDERBOOK[stockSymbol][reverseStockType]) {

//                     ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
//                         "total": parseInt(remainingQuantity),
//                         "order": [
//                             { [userId]: parseInt(remainingQuantity) }
//                         ]
//                     }
//                 }

//                 STOCK_BALANCES[userId][stockSymbol][stockType].locked += parseInt(remainingQuantity)
//                 INR_BALANCES[userId].balance -= parseInt(totalSpent * 100)
//                 INR_BALANCES[userId].locked += parseInt((quantity * price) * 100 - (totalSpent * 100));


//                 //    console.log(remainingQuantity);
//             }
//             return res.json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES, TRANSACTIONS })
//         }
//     }
//     // Price is not presnt in orderBook 
//     // else {
//     //     let transaction = [];
//     //     if (!ORDERBOOK[stockSymbol]) {
//     //         ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
//     //     }


//     //     const reverseStockType = stockType === "yes" ? "no" : "yes";
//     //     const reverseAmount = 10 - (price / 100);


//     //     if (!ORDERBOOK[stockSymbol][reverseStockType]) {
//     //         ORDERBOOK[stockSymbol][reverseStockType] = { total: 0, orders: {} };
//     //     }

//     //     if (ORDERBOOK[stockSymbol][stockType] && !ORDERBOOK[stockSymbol][reverseStockType].hasOwnProperty(reverseAmount)) {
//     //         ORDERBOOK[stockSymbol][reverseStockType][reverseAmount] = {
//     //             "total": 10 - quantity,
//     //             "orders": {
//     //                 [userId]: 10 - quantity
//     //             }
//     //         }

//     //         INR_BALANCES[userId].balance -= (price * quantity);
//     //         INR_BALANCES[userId].locked += (price * quantity);

//     //         // it will sell by no 
//     //         if (!STOCK_BALANCES[userId][stockSymbol][reverseStockType]) {
//     //             STOCK_BALANCES[userId][stockSymbol] = {
//     //                 [reverseStockType]: {
//     //                     "quantity": 0,
//     //                     "locked": quantity
//     //                 }
//     //             }
//     //         }

//     //     }
//     //     const newTransaction = {
//     //         id: generateUniqueId(),
//     //         buyer_account_id: userId,
//     //         seller_account_id: userId,
//     //         trade_qty: 10 - quantity,
//     //         buy_price: price,
//     //         buyer_order_id: generateUniqueId(),
//     //         seller_order_id: generateUniqueId(),
//     //         event_id: eventId,
//     //     };

//     //     // Add the new transaction to the TRANSACTIONS array
//     //     transaction.push(newTransaction);

//     //     res.json({ ORDERBOOK, STOCK_BALANCES, INR_BALANCES, transaction })
//     // }

// })


// Sell 
// app.post("/order/sell", (req, res) => {
//     // let transaction = [];
//     // const { userId, stockSymbol, quantity, price, stockType } = req.body;

//     // if (!STOCK_BALANCES[userId] || !STOCK_BALANCES[userId][stockSymbol] || !STOCK_BALANCES[userId][stockSymbol][stockType]) {
//     //     return res.status(400).json({ message: "User doesn't exist or doesn't have stocks" });
//     // }

//     // if (quantity <= 0) {
//     //     return res.status(400).json({ message: "Quantity must be greater than zero" });
//     // }

//     // const eventId = generateEventId(stockSymbol, stockType);


//     if (STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity) {
//         return res.status(400).json({ message: "you have not enough quantity to sell Stock" })
//     }

//     if (!ORDERBOOK[stockSymbol] || !ORDERBOOK[stockSymbol][stockType] || !ORDERBOOK[stockSymbol][stockType][price]) {
//         ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || { yes: {}, no: {} };
//         ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};
//         ORDERBOOK[stockSymbol][stockType][price] = {
//             "total": quantity,
//             "orders": {
//                 [userId]: parseInt(quantity)
//             }
//         }

//         STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;
//         STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
//     }

//     else if (ORDERBOOK[stockSymbol][stockType][price]) {
//         ORDERBOOK[stockSymbol][stockType][price].orders[userId] = quantity
//         ORDERBOOK[stockSymbol][stockType][price].total = 0;
//         let totalPrice = ORDERBOOK[stockSymbol][stockType][price].total;
//         for (const stocks in ORDERBOOK[stockSymbol][stockType][price].orders) {
//             totalPrice += parseInt(ORDERBOOK[stockSymbol][stockType][price].orders[stocks]);
//         }
//         ORDERBOOK[stockSymbol][stockType][price].total = totalPrice
//         if (STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity) {
//             return res.json({ message: "you have not enough quantity to sell Stock" })
//         }
//         else {
//             STOCK_BALANCES[userId][stockSymbol][stockType].locked += parseInt(quantity);
//             STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= parseInt(quantity);
//         }

//     }
//     const newTransaction = {
//         id: generateUniqueId(),
//         seller_account_id: userId,
//         trade_qty: quantity,
//         sell_price: price,
//         seller_order_id: generateUniqueId(),
//         event_id: eventId,
//         status: "PENDING"
//     };

//     transaction.push(newTransaction);

//     res.json({ ORDERBOOK, INR_BALANCES, STOCK_BALANCES, transaction })

// })


app.listen(3001, async () => {
    await Promise.all([
       
        pubsub.connect(),
    ])
    await worker();
    console.log("Engine is running properly at port 3001")
})