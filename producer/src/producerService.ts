import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, OrderPayload, OrderItem } from './interfaces';
import { send } from 'process';


// Kafka configs
const kafka = new Kafka({
    clientId: 'order-producer',
    brokers: ['kafka:9092']
});

const producer: Producer = kafka.producer();
const TOPIC_NAME = 'orders';

const ordersDb = new Map<string, OrderPayload>();

// Generators for the randomized requests
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate random price
const getRandomPrice = () => parseFloat((Math.random() * 100).toFixed(2));


// create order and publish to Kafka
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

    ordersDb.set(orderPayload.orderId, orderPayload);
    sendToKafka(orderPayload);
    return orderPayload;
}

export async function UpdateAndPublishOrder(orderId: string, newStatus: string): Promise<OrderPayload> {
    const order = ordersDb.get(orderId);
    if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
    }
    order.status = newStatus as 'new' | 'pending' | 'confirmed';
    ordersDb.set(orderId, order);
    sendToKafka(order);
    return order;
}

async function sendToKafka(order: OrderPayload) {
    try{
        await producer.connect();
        await producer.send({
            topic: TOPIC_NAME,
            messages: [
                { key: order.orderId, value: JSON.stringify(order) }
            ]
        });
        console.log(`Order ${order.orderId} sent to Kafka topic ${TOPIC_NAME}`);
    } catch (error) {
        console.error("Error sending order to Kafka:", error);
        throw new Error("Message broker is currently unavailable 503");
    } finally {
        await producer.disconnect();
    }
}