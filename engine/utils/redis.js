import { createClient } from 'redis';


export class RedisPubSub{  
    constructor(){
        this.pubsub = createClient({
            host: 'redis-service', // The service name from your Kubernetes configuration
            port: 6379, // Default Redis port
            
        });
        this.client = createClient({
            host: 'redis-service', // The service name from your Kubernetes configuration
            port: 6379, // Default Redis port
        });
        this.thisConnection();
    }

    async thisConnection(){
        await this.pubsub.connect();
        await this.client.connect();
    }
    async  publishToRedis(type , data) {
        await this.pubsub.publish(type , data);
    }

    async popFromRedis(type){
       return  await this.client.blPop(type,0);
    } 
}
export    const redis = new RedisPubSub();