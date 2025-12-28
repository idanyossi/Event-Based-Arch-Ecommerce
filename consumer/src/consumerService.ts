import { Kafka, Consumer } from 'kafkajs';
import { OrderPayload, ProcessedOrder } from './interfaces';


export const orderDatabase: Map<string, ProcessedOrder> = new Map();

export const topicTracker: Map<string, string[]> = new Map();

// Kafka configs
const kafka = new Kafka({
    clientId: 'order-producer',
    brokers: ['kafka:9092']
});

const consumer: Consumer = kafka.consumer({ groupId: 'order-consumer-group' });
const TOPIC_NAME = 'orders';

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
  try {
        await consumer.connect();
        await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

        console.log(`[Consumer] Subscribed to topic: ${TOPIC_NAME}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                try {
                    const orderData: OrderPayload = JSON.parse(message.value.toString());
                    const orderId = orderData.orderId;

                    // 1. Requirement: Tracking Order IDs from Topic
                    if (!topicTracker.has(topic)) {
                        topicTracker.set(topic, []);
                    }
                    // Append ID to the list for this topic
                    topicTracker.get(topic)?.push(orderId);

                    // 2. Requirement: Same actions as Exercise 1
                    processOrder(orderData);

                } catch (e) {
                    console.error(`[Consumer Error] Failed to parse message on topic ${topic}:`, e);
                }
            },
        });
    } catch (error) {
        console.error("[Consumer Error] Broker not available or connection failed:", error);
        // Throwing here allows the index.ts to handle the error if needed
        throw new Error('503: Message Broker Unavailable');
    }
}