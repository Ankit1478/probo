import { createClient } from 'redis';


export class RedisPubSub{  
    constructor(){
        this.pubsub = createClient();
        this.pubsub.connect();
        this.client = createClient();
        this.client.connect();
    }

    async  pushtoRedis(data) {
      await this.client.rPush("RedisQueue", JSON.stringify(data));
    }

    async publishMessage(type, requestId, res){
        const publishMessage = (message) => {
            const data = JSON.parse(message); 
            if (data.requestId === requestId) {
              this.pubsub.unsubscribe(type, publishMessage);
              return  res.status(200).json({message: JSON.parse(data.msg )} ); 
            } else {
              console.log("Request ID mismatch");
              res.status(404).json({ message: "Something went wrong" });
            }
           };
        await this.pubsub.subscribe(type, publishMessage);
    }
}
