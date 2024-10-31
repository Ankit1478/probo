
import { redis } from '../utils/redis.js';
import { ORDERBOOK, STOCK_BALANCES , INR_BALANCES } from "../utils/models.js";
import {generateEventId , generateUniqueId} from "../index.js"

export  async function Buy(buyerId ,stockSymbol , quantity , price , stockType ,requestIds){
        const TRANSACTIONS = [];
       
        let userBalance =( INR_BALANCES[buyerId].balance)/100;

    
        let totalCost = (price/100) * quantity/100;
    
        // Check if user has sufficient INR balance 
        if (userBalance < totalCost) {
            redis.publishToRedis("buyStocks",JSON.stringify({
                requestId: requestIds,
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

                    redis.publishToRedis("buyStocks",JSON.stringify({
                        requestId: requestIds,
                        error:false,
                        msg: JSON.stringify({ message: ORDERBOOK })
                    }))
                    
                    
                    redis.publishToRedis(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));
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

                redis.publishToRedis("buyStocks",JSON.stringify({
                    requestId: requestIds,
                    error:false,
                    msg:JSON.stringify(ORDERBOOK) 
                }))

                redis.publishToRedis(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));

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
            redis.publishToRedis("buyStocks", JSON.stringify({
                requestId: requestIds,
                error: false,
                msg: JSON.stringify({ message: ORDERBOOK })
            }));

           
           
            redis.publishToRedis(`sentToWebSocket.${stockSymbol}`, JSON.stringify(ORDERBOOK[stockSymbol] ));
 }
    
}



