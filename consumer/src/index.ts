import express, { Request, Response } from 'express';
import { orderDatabase, startOrderConsumer } from './consumerService';
import { ProcessedOrder } from './interfaces';

const app = express();
app.use(express.json());
const PORT = 3001;

startOrderConsumer();

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

app.listen(PORT, () => console.log(`Consumer running on port ${PORT}`));