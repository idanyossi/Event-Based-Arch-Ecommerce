import {Connection, Channel, ChannelModel, ConsumeMessage} from 'amqplib';
import amqp from 'amqplib';
import { OrderPayload, ProcessedOrder } from './interfaces';


export const orderDatabase: Map<string, ProcessedOrder> = new Map();

// RabbitMQ configs
export const RABBIT_URL = 'amqp://rabbitmq'; 
export const EXCHANGE_NAME = 'ecommerce_exchange';
export const ROUTING_KEY = 'order.new';

function processOrder(orderData: OrderPayload) {
    // 1. Calculate Shipping Costs (2% of totalAmount, requirement met)
    const shippingCost = parseFloat((orderData.totalAmount * 0.02).toFixed(2));
    
    // 2. Store Order (Requirement met)
    const storedRecord: ProcessedOrder = {
        ...orderData,
        shippingCost: shippingCost,
        processedDate: new Date().toISOString()
    };
    
    orderDatabase.set(orderData.orderId, storedRecord);
    console.log(`[Consumer] Processed Order ${orderData.orderId}. Shipping: $${shippingCost}. Data saved.`);
}

export async function startOrderConsumer() {
    let connection: ChannelModel | null = null;
    let channel: Channel | null = null;

    try {
        connection =  await amqp.connect(RABBIT_URL);
        channel = await connection.createChannel();

        if (channel){
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

            const q = await channel.assertQueue('', { exclusive: true });
            
            channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY); 

            channel.consume(q.queue, (msg: ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const orderData: OrderPayload = JSON.parse(msg.content.toString());
                 
                        if (orderData.status === 'new') {
                            processOrder(orderData);
                        }
                    } catch (e) {
                        console.error("[Consumer Error] Failed to process message:", e);
                    }
                    
                    channel!.ack(msg);
                } 
            }, { noAck: false });
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
}