const axios = require("axios");

const WebSocket = require("ws");

const HTTP_SERVER_URL = "http://localhost:3000";
const WS_SERVER_URL = "ws://localhost:8080";

describe("Trading System Tests", () =>{
    let ws;

    beforeAll((done) => {
        ws = new WebSocket(WS_SERVER_URL);
        ws.on("open", done);
    });

    afterAll(() => {
        ws.close();
    });

    const waitForWSMessage = () => {
        return new Promise((resolve) => {
          ws.once("message", (data) => {
            const parsedData = JSON.parse(data);
            // console.log(parsedData)
            resolve(parsedData);
          });
        });
      };


    //before going to new testCases going reset all endpoints
    // beforeEach(async () => {
    //     await axios.post(`${HTTP_SERVER_URL}/reset`);
    // });

    test.skip("Create user, onramp INR, and check balance", async () => {
        const userId = "testUser1";
       const createUserResponse =   await axios.post(`${HTTP_SERVER_URL}/user/create`,{
            userId
        });
        expect(createUserResponse.status).toBe(200);
        expect(createUserResponse.data.message).toBe(`${userId} created successfully !`);
    
        const onrampResponse = await  axios.post(`${HTTP_SERVER_URL}/onramp/inr`, {
          userId,
          amount: 1000000,
        });

        expect(onrampResponse.status).toBe(200);
        expect(onrampResponse.data.message).toEqual( `1000000 has added in testUser1` )
    })

    test.skip("Create symbol and check orderbook",async()=>{
        const stockSymbol = "TEST_SYMBOL_30_Dec_2024"
        await axios.post(`${HTTP_SERVER_URL}/create/${stockSymbol}`)
        const orderbookResponse = await axios.get(`${HTTP_SERVER_URL}/orderbook/${stockSymbol}`)
        expect(orderbookResponse.status).toBe(200);
        expect(orderbookResponse.data.message).toEqual({ yes: {}, no: {} });
    })

    //buy stock at same Price and same quantity  
    test.skip("Place buy order for yes stock and check WebSocket response",async()=>{
        const userId ="user1"
        const stockSymbol = "BTC_USDT_10_Oct_2024_9_30"
        const quantity ="12"
        const price = "9.5"
        const stockType = "yes"

        const buyResponse = await axios.post(`${HTTP_SERVER_URL}/buy`,{
            userId,stockSymbol,quantity,price,stockType
        })

        const wsMessage = await waitForWSMessage();
        const message = JSON.parse(wsMessage);
        // console.log(message)

        // console.log(sellResponse.data.message)
        expect(buyResponse.status).toBe(200)
        expect(message).toEqual(
            {[stockSymbol]:{"yes":{"8.5":{"total":12,"orders":{"user1":3,"user2":9}}},"no":{}}}
        )
    })

    test.skip("Place sell order for yes stock and check WebSocket response",async()=>{
        const userId ="user1"
        const stockSymbol = "BTC_USDT_10_Oct_2024_9_30"
        const quantity ="12"
        const price = "4"
        const stockType = "yes"

        const sellResponse = await axios.post(`${HTTP_SERVER_URL}/sell`,{
            userId,stockSymbol,quantity,price,stockType
        })

        const wsMessage = await waitForWSMessage();
        const message = JSON.parse(wsMessage);
        console.log(wsMessage)

        // console.log(sellResponse.data.message)
        expect(sellResponse.status).toBe(200)
        expect(message).toEqual(
            {"BTC_USDT_10_Oct_2024_9_30":{"yes":{"4":{"total":"12","orders":{"user1":12}},"9.5":{"total":12,"orders":{"user1":2,"user2":10}},"8.5":{"total":12,"orders":{"user1":3,"user2":9}}}}}
        
        )
    })

    test("Execute Buy orders and check WebSocket response", async()=>{
        const buyerId = "user4"
        const stockSymbol = "ETH"
        const quantity = 4
        const price = 5
        const stockType = "yes"
        const amount = "500000"


        await axios.post(`${HTTP_SERVER_URL}/user/create/`,{buyerId});
        await axios.post(`${HTTP_SERVER_URL}/onramp/inr`,{buyerId , amount});
        await axios.post(`${HTTP_SERVER_URL}/create/${stockSymbol}`);
        const buyResponse = await axios.post(`${HTTP_SERVER_URL}/buy`,{
            buyerId,stockSymbol,quantity,price,stockType
        })

        const wsMessage = await waitForWSMessage();
        const message = JSON.parse(wsMessage);
        console.log(message)
        expect(buyResponse.status).toBe(200)
        expect(message).toEqual(
            {"BTC_USDT_10_Oct_2024_9_30":{"yes":{"9.5":{"total":12,"orders":{"user1":2,"user2":10}},"8.5":{"total":12,"orders":{"user1":3,"user2":9}}},"no":{"5":{"total":8,"orders":{"user1":8}}}}}        
        )
    })

})