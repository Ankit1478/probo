import redis from './client.js';
import { ORDERBOOK } from '../index.js';

const dataString = JSON.stringify(ORDERBOOK);
console.log(dataString);


async function init(){
    await redis.rpush("json" , dataString);
}

init();
