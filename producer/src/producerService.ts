import * as amqp from 'amqplib';
import { Connection, Channel, ChannelModel } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, OrderPayload, OrderItem } from './interfaces';


// RabbitMQ configs
const RABBIT_URL = 'amqp://rabbitmq'; 
const EXCHANGE_NAME = 'ecommerce_exchange';
const ROUTING_KEY = 'order.new';

// Generators for the randomized requests
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate random price
const getRandomPrice = () => parseFloat((Math.random() * 100).toFixed(2));

export async function CreateAndPublishOrder(requestedData: CreateOrderRequest): Promise<OrderPayload> {
    
    const items: OrderItem[] = [];
    let totalAmount = 0;

    for (let i = 0; i< requestedData.numberOfItems; i++) {
       const price = getRandomPrice();
       const quantity = getRandomInt(1,5);
       const item: OrderItem = {
            itemId: uuidv4(),
            quantity: quantity,
            price: price
        };
       items.push(item);
       totalAmount += price * quantity;    
    }

    const orderPayload: OrderPayload = {
        orderId: requestedData.orderId,
        customerId: uuidv4(),
        orderDate: new Date().toISOString(),
        items: items,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        currency: 'USD',
        status: 'new'
    };

    // Connect to RabbitMQ and publish the message
    let connection: ChannelModel | null = null;
    let channel: Channel | null = null;


    try {
        connection = await amqp.connect(RABBIT_URL);

        channel = await connection.createChannel();
        
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
        
        channel.publish(
            EXCHANGE_NAME, 
            ROUTING_KEY, 
            Buffer.from(JSON.stringify(orderPayload))
        );
        
    } finally { 
        if (channel) await channel.close();
        if (connection) await connection.close();
    }

    return orderPayload;
}