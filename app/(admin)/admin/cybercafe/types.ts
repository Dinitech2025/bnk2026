export type TicketType = {
  id: string;
  duration?: string;
  price: number;
  stock: number;
  usedToday?: number;
  brokenToday?: number;
  brokenTickets?: any[];
};

export interface BrokenTicket {
  id?: string;
  reason: string;
  code?: string;
  ticketCode?: string;
  quantity: number;
}

export interface StockUpdate {
  id: string;
  ticketId: string;
  amount: number;
  previousStock: number;
  newStock: number;
  createdAt: string;
  ticket: {
    duration: string;
    price: number;
  };
}

export interface DailyTicketHistory {
  id: string;
  ticketId: string;
  type: 'USED' | 'BROKEN';
  quantity: number;
  reason?: string;
  code?: string;
  ticketCode?: string;
  createdAt: string;
  ticket: {
    duration: string;
    price: number;
  };
}

export interface DailyReport {
  id: string;
  date: string;
  totalRevenue: number;
  ticketUsages: {
    ticket: TicketType;
    quantity: number;
  }[];
}

export interface RecentUsedTicket {
  code: string;
  createdAt: string;
  ticketId: string;
}

export const BROKEN_TICKET_REASONS = [
  { value: 'computer_failure', label: '🖥️ Ordinateur en panne' },
  { value: 'invalid_code', label: '🔑 Code d\'accès invalide' },
  { value: 'network_issue', label: '⚡ Problème réseau' },
  { value: 'software_crash', label: '💾 Plantage logiciel' },
  { value: 'power_outage', label: '🔌 Coupure électrique' },
  { value: 'hardware_malfunction', label: '⚙️ Dysfonctionnement matériel' },
  { value: 'other', label: '❓ Autre problème' }
]; 