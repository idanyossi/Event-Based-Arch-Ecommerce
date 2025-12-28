import express, { Request, Response } from 'express';
import { orderDatabase, startOrderConsumer, topicTracker } from './consumerService';
import { ProcessedOrder } from './interfaces';

const app = express();
app.use(express.json());
const PORT = 3001;

startOrderConsumer().catch(err => {
    console.error("Critical: Could not start Kafka consumer", err);
});

app.get('/order-details/:orderId', (req: Request, res: Response) => {
    const { orderId } = req.params;
    

    const order: ProcessedOrder | undefined = orderDatabase.get(orderId);

    if (!order) {
        return res.status(404).json({ 
            error: 'Order not found or not yet processed.',
            message: 'Check back later, or ensure the order ID is correct.' 
        });
    }
    return res.status(200).json(order);
});

app.get('/getAllOrderIdsFromTopic', (req: Request, res: Response) => {
    const topicName = req.query.topic as string;

    if (!topicName) {
        return res.status(400).json({ error: 'topic name is required as a query parameter (?topic=name)' });
    }

    const orderIds = topicTracker.get(topicName);

    if (!orderIds || orderIds.length === 0) {
        return res.status(404).json({ 
            message: `No order events have been received from topic: ${topicName} yet.` 
        });
    }

    console.log(`Order IDs received from topic [${topicName}]:`, orderIds);

    return res.status(200).json({
        topic: topicName,
        count: orderIds.length,
        orderIds: orderIds
    });
});

app.listen(PORT, () => console.log(`Consumer running on port ${PORT}`));