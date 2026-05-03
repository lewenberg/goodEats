export type User = {
    _id: string;
    userId: string;
    email: string;
    name: string;
    addressLine1: string;
    city: string;
    country: string;
    role: "admin" | "owner" | "customer";
};

export type MenuItem = {
    _id: string;
    name: string;
    price: number;
    description?: string;
};

export type Restaurant = {
    _id: string;
    user: string;
    ownerId?: string | null;
    restaurantName: string;
    city: string;
    country: string;
    deliveryPrice: number;
    estimatedDeliveryTime: number;
    cuisines: string[];
    menuItems: MenuItem[];
    imageUrl: string;
    lastUpdated: string;
    isActive: boolean;
};

export type OrderItem = {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
};

export type Order = {
    _id: string;
    orderId: string;
    customerId: string;
    restaurantId: string;
    restaurantName: string;
    customerName: string;
    items: OrderItem[];
    subtotal: number;
    deliveryPrice: number;
    total: number;
    status: string;
    deliveryName: string;
    deliveryAddress: string;
    createdAt: string;
};

export type RestaurantSearchResponse = {
    data: Restaurant[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    }
}
