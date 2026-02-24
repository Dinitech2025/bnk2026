import { User } from "@prisma/client";

export interface Order {
  id: string;
  orderNumber: string | null;
  userId: string;
  total: number;
  status: string;
  paymentStatus: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items?: OrderItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  serviceId: string | null;
  quantity: number;
  price: number;
  name: string;
  description: string | null;
} 