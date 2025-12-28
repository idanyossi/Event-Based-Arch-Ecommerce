import express, { Request, Response } from 'express';
import { CreateAndPublishOrder, UpdateAndPublishOrder } from './producerService';
import { CreateOrderRequest } from './interfaces';

const app = express();
app.use(express.json());
const PORT = 3000;

app.post('/create-order', async (req: Request, res: Response) => {
    try{
        const { orderId, numberOfItems } = req.body as CreateOrderRequest;
        if ( !orderId || typeof orderId !== 'string'){
            return res.status(400).json({ error: 'Invalid or missing orderId' });
        }
        if ( !numberOfItems || typeof numberOfItems !== 'number' || numberOfItems <= 0){
            return res.status(400).json({ error: 'Invalid or missing numberOfItems' });
        }


        const orderPayLoad = await CreateAndPublishOrder({ orderId, numberOfItems });
        return  res.status(200).json({ message: 'Order created and published successfully', order: orderPayLoad });

    } catch (error) {
       console.error("Error creating order:", error);
       if (error && (error as any).code === 'ECONNREFUSED'){
            return res.status(503).json({ error: 'Service Unavailable: Cannot connect to Kafka server, please try again later' });
       }
       return res.status(500).json({ error: 'Internal Server Error, possible issue connecting to Kafka server' }); 
    }

});

app.post('/update-order', async (req: Request, res: Response) => {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: 'orderId and status are required' });
    }

    try {
        const updatedOrder = await UpdateAndPublishOrder(orderId, status);
        res.status(200).json({
            message: 'Order updated and notification sent',
            updatedOrder
        });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        
        if (error.message.includes('503')) {
            return res.status(503).json({ error: 'Cannot notify services: Broker unavailable.' });
        }

        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Producer running on port ${PORT}`));
