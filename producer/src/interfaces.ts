export interface CreateOrderRequest {
    orderId: string;
    numberOfItems: number;
}

export interface OrderItem{
    itemId: string;
    quantity: number;
    price: number;
}

export interface OrderPayload{
    orderId: string;
    customerId: string;
    orderDate: string;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    status: 'new' | 'pending' | 'confirmed';
}