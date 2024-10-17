import redis from './client.js';
import { ORDERBOOK } from '../index.js';

const dataString = JSON.stringify(ORDERBOOK);
console.log(dataString);

export async function init(){
    await redis.rpush("json" , dataString);
}

export async function remove(){
    await redis.lpop("json");
}

init();





