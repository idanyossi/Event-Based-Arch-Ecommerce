export interface OrderPayload{
    orderId: string;
    customerId: string;
    orderDate: string;
    items: {
        itemId: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    currency: string;
    status: 'new' | 'pending' | 'confirmed';
}

export interface ProcessedOrder{
    shippingCost: number;
    processedDate: string;
}