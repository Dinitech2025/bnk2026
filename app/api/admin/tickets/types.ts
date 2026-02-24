export type TicketStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'INVALID';
export type TicketValue = 500 | 1000 | 2000 | 5000;

export interface Ticket {
  id: string;
  code: string;
  value: TicketValue;
  status: TicketStatus;
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
  batchId?: string;
}

export interface TicketBatch {
  id: string;
  createdAt: string;
  quantity: number;
  value: TicketValue;
  description?: string;
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  ticketsSold: {
    value: TicketValue;
    quantity: number;
    total: number;
  }[];
  remainingTickets: {
    value: TicketValue;
    quantity: number;
  }[];
  invalidTickets: {
    value: TicketValue;
    quantity: number;
  }[];
} 
 