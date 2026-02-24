'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyReport } from '@/app/api/admin/tickets/types';

interface DailyReportProps {
  report: DailyReport;
}

export default function DailyReport({ report }: DailyReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tickets Vendus Aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Valeur</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.ticketsSold.map((item) => (
                <TableRow key={item.value}>
                  <TableCell>{item.value.toLocaleString()} Ar</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.total.toLocaleString()} Ar</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="font-bold">
                  {report.ticketsSold.reduce((acc, curr) => acc + curr.quantity, 0)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {report.totalRevenue.toLocaleString()} Ar
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets Restants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Valeur</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.remainingTickets.map((item) => (
                  <TableRow key={item.value}>
                    <TableCell>{item.value.toLocaleString()} Ar</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {report.remainingTickets.reduce((acc, curr) => acc + curr.quantity, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Invalides</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Valeur</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.invalidTickets.map((item) => (
                  <TableRow key={item.value}>
                    <TableCell>{item.value.toLocaleString()} Ar</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {report.invalidTickets.reduce((acc, curr) => acc + curr.quantity, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
 