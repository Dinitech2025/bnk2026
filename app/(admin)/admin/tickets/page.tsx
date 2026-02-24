import React from 'react';
import { headers } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TicketsList from '@/components/admin/tickets/tickets-list';
import TicketGenerator from '@/components/admin/tickets/ticket-generator';
import DailyReport from '@/components/admin/tickets/daily-report';
import type { Ticket, TicketBatch, DailyReport as DailyReportType } from '@/app/api/admin/tickets/types';

// Force dynamic rendering to avoid URL parsing errors during static generation
export const dynamic = 'force-dynamic'

async function getTickets() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3000'
    const response = await fetch(baseUrl + '/api/admin/tickets', {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch tickets:', response.status)
      return []
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
}

async function getDailyReport() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3000'
    const response = await fetch(baseUrl + '/api/admin/tickets/daily-report', {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch daily report:', response.status)
      return { totalRevenue: 0, ticketsSold: [], remainingTickets: [], invalidTickets: [] }
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching daily report:', error)
    return { totalRevenue: 0, ticketsSold: [], remainingTickets: [], invalidTickets: [] }
  }
}

export default async function TicketsPage() {
  const [tickets, dailyReport] = await Promise.all([
    getTickets(),
    getDailyReport()
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Tickets Internet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Statistiques rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Recette du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dailyReport.totalRevenue.toLocaleString()} Ar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {dailyReport.ticketsSold.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets restants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {dailyReport.remainingTickets.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets invalides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {dailyReport.invalidTickets.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList>
          <TabsTrigger value="report">Rapport Journalier</TabsTrigger>
          <TabsTrigger value="tickets">Liste des Tickets</TabsTrigger>
          <TabsTrigger value="generator">Générer des Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <DailyReport report={dailyReport} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsList tickets={tickets} />
        </TabsContent>

        <TabsContent value="generator">
          <TicketGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
 