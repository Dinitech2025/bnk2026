"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Clock, TrendingUp, Calculator, AlertTriangle, Package, History, Upload, FileText, Download, Trash2, RefreshCw, Eye, X } from "lucide-react";
import { TicketType, BrokenTicket, StockUpdate, DailyTicketHistory, DailyReport, RecentUsedTicket, BROKEN_TICKET_REASONS } from "./types";

export default function CyberCafePage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [stockHistory, setStockHistory] = useState<StockUpdate[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [dailyHistory, setDailyHistory] = useState<DailyTicketHistory[]>([]);
  const [isLoadingDailyHistory, setIsLoadingDailyHistory] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<{[key: string]: string}>({});
  const [lastTicketCode, setLastTicketCode] = useState<string>('');
  const [showTicketCode, setShowTicketCode] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [isImportingPDF, setIsImportingPDF] = useState(false);
  const [recentUsedTickets, setRecentUsedTickets] = useState<{[ticketId: string]: RecentUsedTicket[]}>({});
  const [showBrokenTicketDialog, setShowBrokenTicketDialog] = useState(false);
  const [selectedTicketForBroken, setSelectedTicketForBroken] = useState<any>(null);
  const [brokenTicketReason, setBrokenTicketReason] = useState('');
  const { toast } = useToast();
  // Gestion du drag and drop
  const [draggedTicket, setDraggedTicket] = useState<any>(null);

  // Charger les tickets avec les données du jour - VERSION OPTIMISÉE
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/cybercafe/tickets').then(res => res.json()),
      fetch('/api/cybercafe/daily-history?date=' + date).then(res => res.json())
    ])
      .then(([ticketsData, historyData]) => {
        // Calculer les usages du jour depuis l'historique
        const todayUsage: {[key: string]: {used: number, broken: number, brokenDetails: any[]}} = {};
        
        if (historyData.success && historyData.history) {
          historyData.history.forEach((entry: DailyTicketHistory) => {
            if (!todayUsage[entry.ticketId]) {
              todayUsage[entry.ticketId] = { used: 0, broken: 0, brokenDetails: [] };
            }
            
            if (entry.type === 'USED') {
              todayUsage[entry.ticketId].used += entry.quantity;
            } else if (entry.type === 'BROKEN') {
              todayUsage[entry.ticketId].broken += entry.quantity;
              // Extraire le code du champ reason si c'est un ancien format
              const codeFromReason = entry.reason?.match(/Code coupon: ([^\s]+)/)?.[1];
              todayUsage[entry.ticketId].brokenDetails.push({
                quantity: entry.quantity,
                reason: entry.reason,
                code: entry.code || codeFromReason || entry.ticketCode
              });
            }
          });
        }

        // Charger les 5 derniers tickets utilisés par type de ticket
        const usedTicketsByType: {[ticketId: string]: any[]} = {};
        historyData.history
          ?.filter((entry: DailyTicketHistory) => entry.type === 'USED')
          .forEach((entry: DailyTicketHistory) => {
            if (!usedTicketsByType[entry.ticketId]) {
              usedTicketsByType[entry.ticketId] = [];
            }
            if (usedTicketsByType[entry.ticketId].length < 5) {
              const code = entry.reason?.replace('Code coupon: ', '') || entry.code || entry.ticketCode;
              usedTicketsByType[entry.ticketId].push({
                ...entry,
                ticketDuration: entry.ticket.duration,
                ticketPrice: entry.ticket.price,
                code: code
              });
            }
          });
        setRecentUsedTickets(usedTicketsByType);

        // Appliquer les données d'usage aux tickets
        const processedTickets = ticketsData.map((ticket: TicketType) => ({
          ...ticket,
          usedToday: todayUsage[ticket.id]?.used || 0,
          brokenToday: todayUsage[ticket.id]?.broken || 0,
          brokenTickets: todayUsage[ticket.id]?.brokenDetails || []
        }));
        
        setTickets(processedTickets);
        
        // Calculer le revenu journalier
        const revenue = processedTickets.reduce((sum: number, ticket: TicketType) => 
          sum + ((ticket.usedToday || 0) * ticket.price), 0);
        setDailyRevenue(revenue);
        
        setIsLoading(false);
        loadAvailableCodes();
      })
      .catch((error) => {
        console.error('Erreur chargement données:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive"
        });
        setIsLoading(false);
      });
  }, [date]);

  // Charger les rapports du mois
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const year = now.getFullYear().toString();

    fetch(`/api/cybercafe/reports?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setMonthlyTotal(data.monthlyTotal || 0);
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les rapports",
          variant: "destructive"
        });
      });
  }, []);

  // Charger l'historique au démarrage
  useEffect(() => {
    loadStockHistory();
  }, []);

  // Recharger les codes quand les tickets changent
  useEffect(() => {
    if (tickets.length > 0) {
      console.log('Tickets chargés, génération des codes...');
      loadAvailableCodes();
    }
  }, [tickets]);

  // Charger l'historique journalier
  const loadDailyHistory = async () => {
    try {
      setIsLoadingDailyHistory(true);
      const response = await fetch(`/api/cybercafe/daily-history?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyHistory(data.history);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDailyHistory(false);
    }
  };

  // Charger les tickets avec les données du jour
  const loadTickets = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Chargement des tickets...');
      
      const [ticketsResponse, historyResponse] = await Promise.all([
        fetch('/api/cybercafe/tickets'),
        fetch('/api/cybercafe/daily-history?date=' + date)
      ]);

      if (!ticketsResponse.ok) {
        const errorData = await ticketsResponse.json();
        console.error('❌ Erreur API tickets:', errorData);
        throw new Error(errorData.error || 'Erreur lors du chargement des tickets');
      }

      if (!historyResponse.ok) {
        const errorData = await historyResponse.json();
        console.error('❌ Erreur API historique:', errorData);
        throw new Error(errorData.error || 'Erreur lors du chargement de l\'historique');
      }

      const [ticketsData, historyData] = await Promise.all([
        ticketsResponse.json(),
        historyResponse.json()
      ]);

      console.log('📊 Données reçues:', { tickets: ticketsData, history: historyData });

      // Calculer les usages du jour depuis l'historique
      const todayUsage: {[key: string]: {used: number, broken: number, brokenDetails: any[]}} = {};
      
      if (historyData.success && historyData.history) {
        historyData.history.forEach((entry: DailyTicketHistory) => {
          if (!todayUsage[entry.ticketId]) {
            todayUsage[entry.ticketId] = { used: 0, broken: 0, brokenDetails: [] };
          }
          
          if (entry.type === 'USED') {
            todayUsage[entry.ticketId].used += entry.quantity;
          } else if (entry.type === 'BROKEN') {
            todayUsage[entry.ticketId].broken += entry.quantity;
            const codeFromReason = entry.reason?.match(/Code coupon: ([^\s]+)/)?.[1];
            todayUsage[entry.ticketId].brokenDetails.push({
              id: entry.id, // Ajouter l'ID pour pouvoir supprimer l'entrée plus tard
              quantity: entry.quantity,
              reason: entry.reason,
              code: entry.code || codeFromReason || entry.ticketCode
            });
          }
        });
      }

      // Charger les tickets utilisés récents
      const usedTicketsByType: {[ticketId: string]: any[]} = {};
      historyData.history
        ?.filter((entry: DailyTicketHistory) => entry.type === 'USED')
        .forEach((entry: DailyTicketHistory) => {
          if (!usedTicketsByType[entry.ticketId]) {
            usedTicketsByType[entry.ticketId] = [];
          }
          if (usedTicketsByType[entry.ticketId].length < 5) {
            const code = entry.reason?.replace('Code coupon: ', '') || entry.code || entry.ticketCode;
            usedTicketsByType[entry.ticketId].push({
              ...entry,
              ticketDuration: entry.ticket.duration,
              ticketPrice: entry.ticket.price,
              code: code
            });
          }
        });
      setRecentUsedTickets(usedTicketsByType);

      // Appliquer les données d'usage aux tickets
      const processedTickets = ticketsData.map((ticket: TicketType) => ({
        ...ticket,
        usedToday: todayUsage[ticket.id]?.used || 0,
        brokenToday: todayUsage[ticket.id]?.broken || 0,
        brokenTickets: todayUsage[ticket.id]?.brokenDetails || []
      }));
      
      setTickets(processedTickets);
      
      // Calculer le revenu journalier
      const revenue = processedTickets.reduce((sum: number, ticket: TicketType & { usedToday?: number }) => 
        sum + ((ticket.usedToday || 0) * ticket.price), 0);
      setDailyRevenue(revenue);
      
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tickets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      await loadDailyHistory();
      await loadTickets();
    };
    loadInitialData();
  }, [date]);

  // Après l'utilisation d'un ticket
  const handleUseTicket = async (ticketId: string) => {
    try {
      const response = await fetch('/api/cybercafe/use-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Recharger les données
      await loadDailyHistory();
      await loadTickets();

      toast({
        title: "✅ Ticket utilisé",
        description: `Code: ${data.code}`,
        duration: 5000
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'utiliser le ticket",
        variant: "destructive"
      });
    }
  };

  // Charger les codes disponibles depuis la base de données
  const loadAvailableCodes = async () => {
    try {
      if (tickets.length === 0) {
        console.log('Aucun ticket chargé encore');
        setAvailableCodes([]);
        return;
      }

      // Récupérer les vrais codes depuis l'API
      try {
        const response = await fetch('/api/cybercafe/codes');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tickets) {
            // Adapter le format pour l'affichage
            const adaptedCodes = data.tickets.map((ticket: any) => ({
              ticketType: ticket.duration,
              price: ticket.price,
              codes: ticket.availableCodes.map((code: any) => code.code),
              usedCount: ticket.usedCount
            }));
            setAvailableCodes(adaptedCodes);
            console.log('Codes réels chargés depuis la base:', adaptedCodes);
            return;
          }
        }
      } catch (apiError) {
        console.log('API codes non disponible, affichage des stocks seulement');
      }

      // Fallback: afficher seulement les stocks sans codes simulés
      const codesData = tickets.map(ticket => ({
        ticketType: ticket.duration || `${ticket.price}Ar`,
        price: ticket.price,
        codes: [], // Pas de codes générés artificiellement
        usedCount: 0
      })).filter(t => t.ticketType);
      
      console.log('Affichage des stocks sans codes simulés:', codesData);
      setAvailableCodes(codesData);
    } catch (error) {
      console.error('Erreur lors du chargement des codes:', error);
    }
  };

  const loadStockHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/cybercafe/stock?history=true');
      if (res.ok) {
        const data = await res.json();
        setStockHistory(data.slice(0, 10)); // Afficher les 10 dernières
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const recordDailyHistory = async (ticketId: string, type: 'USED' | 'BROKEN', quantity: number, reason?: string, code?: string) => {
    try {
      await fetch('/api/cybercafe/daily-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          type,
          quantity,
          reason,
          code,
          date
        })
      });
    } catch (error) {
      console.error('Erreur enregistrement historique:', error);
    }
  };

  const useTicket = async (ticketId: string, index: number) => {
    try {
      const response = await fetch('/api/cybercafe/use-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'utilisation du ticket');
      }

      const result = await response.json();
      
      if (result.success) {
        // Stocker le code pour l'affichage (l'API renvoie le code sous 'code')
        if (result.code) {
          setLastTicketCode(result.code);
          setShowTicketCode(true);
        }

        // Recharger les données réelles du jour (l'API use-ticket enregistre déjà dans l'historique)
        await loadTickets();
        await loadDailyHistory();

        toast({
          title: "🎫 Ticket utilisé",
          description: result.code ? `Code: ${result.code}` : "Ticket décompté du stock",
          duration: 4000
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'utiliser le ticket",
        variant: "destructive"
      });
    }
  };

  const addToStock = async (ticketId: string, amount: number) => {
    try {
      const res = await fetch('/api/cybercafe/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, amount })
      });

      if (!res.ok) throw new Error();

      const updatedTicket = await res.json();
      setTickets(prev => prev.map(t => 
        t.id === updatedTicket.id ? { ...t, stock: updatedTicket.stock } : t
      ));

      // Recharger l'historique
      loadStockHistory();

      toast({
        title: "✅ Stock mis à jour",
        description: `+${amount} tickets ajoutés`
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock",
        variant: "destructive"
      });
    }
  };

  const recordBrokenTickets = async (index: number, amount: number, ticketCode?: string) => {
    const ticket = tickets[index];
    const reason = selectedReasons[index] || 'other';
    const reasonLabel = BROKEN_TICKET_REASONS.find(r => r.value === reason)?.label || '❓ Autre';

    try {
      // Enregistrer dans l'historique journalier
      await recordDailyHistory(ticket.id, 'BROKEN', amount, reason, ticketCode);

      // Mettre à jour l'état local avec le code
      const newTickets = [...tickets];
      if (!newTickets[index].brokenTickets) {
        newTickets[index].brokenTickets = [];
      }
      newTickets[index].brokenTickets.push({
        quantity: amount,
        reason,
        code: ticketCode // Ajouter le code s'il est fourni
      });
      newTickets[index].brokenToday = (newTickets[index].brokenToday || 0) + amount;
      setTickets(newTickets);

      toast({
        title: "⚠️ Tickets défaillants enregistrés",
        description: `${amount} tickets - ${reasonLabel}${ticketCode ? ` - Code: ${ticketCode}` : ''}`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les tickets défaillants",
        variant: "destructive"
      });
    }
  };

  const saveReport = async () => {
    try {
      // Vérifier s'il y a des activités à sauvegarder
      const hasActivity = tickets.some(ticket => 
        (ticket.usedToday || 0) > 0 || (ticket.brokenToday || 0) > 0
      );

      if (!hasActivity) {
        toast({
          title: "Aucune activité",
          description: "Aucun ticket utilisé aujourd'hui",
          variant: "default"
        });
        return;
      }

      // Formater la date pour l'API
      const formattedDate = new Date(date).toISOString().split('T')[0];

      // Préparer les données d'usage
      const ticketUsages = tickets
        .filter(ticket => (ticket.usedToday || 0) > 0 || (ticket.brokenToday || 0) > 0)
        .map(ticket => ({
          ticketId: ticket.id,
          quantity: (ticket.usedToday || 0) + (ticket.brokenToday || 0),
          brokenDetails: ticket.brokenTickets?.map(broken => ({
            reason: broken.reason,
            code: broken.code || broken.ticketCode || null,
            quantity: 1
          })) || []
        }));

      // Calculer le total des revenus
      const totalRevenue = tickets.reduce((sum, ticket) => 
        sum + ((ticket.usedToday || 0) * ticket.price), 0
      );

      // Envoyer les données à l'API
      const response = await fetch('/api/cybercafe/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formattedDate,
          ticketUsages,
          totalRevenue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();

      // Réinitialiser les compteurs
      setTickets(prevTickets => prevTickets.map(t => ({
        ...t,
        usedToday: 0,
        brokenToday: 0,
        brokenTickets: []
      })));
      setDailyRevenue(0);

      // Recharger les rapports du mois
      const now = new Date();
      const month = (now.getMonth() + 1).toString();
      const year = now.getFullYear().toString();

      const reportsResponse = await fetch(`/api/cybercafe/reports?month=${month}&year=${year}`);
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
        setMonthlyTotal(reportsData.monthlyTotal || 0);
      }

      toast({
        title: "✅ Rapport sauvegardé",
        description: `Chiffre d'affaires: ${totalRevenue.toLocaleString()} Ar`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde rapport:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le rapport",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Fonction d'import PDF
  const handlePDFImport = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier PDF valide",
        variant: "destructive"
      });
      return;
    }

    setIsImportingPDF(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/cybercafe/import-pdf', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }

      if (result.success) {
        // Recharger les tickets et les codes
        const ticketsResponse = await fetch('/api/cybercafe/tickets');
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.map((ticket: TicketType) => ({
          ...ticket,
          usedToday: 0,
          brokenToday: 0,
          brokenTickets: []
        })));

        loadAvailableCodes();
        loadStockHistory();

        toast({
          title: "🎉 Import réussi !",
          description: `${result.totalTickets} tickets importés depuis le PDF`,
          duration: 5000
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur d'import",
        description: error.message || "Impossible d'importer le PDF",
        variant: "destructive"
      });
    } finally {
      setIsImportingPDF(false);
    }
  };

  // Fonction pour marquer un ticket utilisé comme défaillant
  const markUsedTicketAsBroken = async (usedTicket: any, reason: string) => {
    try {
      const ticketIndex = tickets.findIndex(t => t.id === usedTicket.ticketId);
      if (ticketIndex !== -1) {
        // S'assurer que nous avons le code
        const ticketCode = usedTicket.code || usedTicket.reason?.replace('Code coupon: ', '') || usedTicket.ticketCode;
        
        // Enregistrer dans l'historique journalier avec le code
        await recordDailyHistory(usedTicket.ticketId, 'BROKEN', 1, reason, ticketCode);

        // Mettre à jour l'état local
        const newTickets = [...tickets];
        if (!newTickets[ticketIndex].brokenTickets) {
          newTickets[ticketIndex].brokenTickets = [];
        }
        newTickets[ticketIndex].brokenTickets.push({
          quantity: 1,
          reason,
          code: ticketCode
        });
        newTickets[ticketIndex].brokenToday = (newTickets[ticketIndex].brokenToday || 0) + 1;
        setTickets(newTickets);

        toast({
          title: "⚠️ Ticket marqué comme défaillant",
          description: `Code: ${ticketCode} - ${BROKEN_TICKET_REASONS.find(r => r.value === reason)?.label}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer le ticket comme défaillant",
        variant: "destructive"
      });
    }
  };

  // Remplacer les appels à reloadTodayData par loadTickets et loadDailyHistory
  const handleMarkAsBroken = async (ticketId: string, reason: string, code: string) => {
    try {
      const response = await fetch('/api/cybercafe/daily-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          type: 'BROKEN',
          quantity: 1,
          reason,
          code,
          date
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Recharger les données
      await refreshData();

      toast({
        title: "✅ Ticket marqué comme défaillant",
        description: `Raison: ${BROKEN_TICKET_REASONS.find(r => r.value === reason)?.label}`,
        duration: 3000
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer le ticket comme défaillant",
        variant: "destructive"
      });
    }
  };

  // Gérer le signalement d'un ticket utilisé comme défaillant
  const handleReportUsedTicket = async () => {
    if (!selectedTicketForBroken || !brokenTicketReason) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une raison",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Marquer comme défaillant dans l'historique
      await fetch('/api/cybercafe/daily-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicketForBroken.ticketId,
          type: 'BROKEN',
          quantity: 1,
          reason: brokenTicketReason,
          code: selectedTicketForBroken.code,
          date
        })
      });

      // 2. Supprimer de l'historique d'utilisation
      await fetch(`/api/cybercafe/daily-history/${selectedTicketForBroken.id}`, {
        method: 'DELETE'
      });

      // Recharger les données
      await refreshData();

      toast({
        title: "✅ Ticket signalé comme défaillant",
        description: `Le ticket est maintenant dans "Problèmes Signalés"`,
        duration: 3000
      });

      setShowBrokenTicketDialog(false);
      setBrokenTicketReason('');
      setSelectedTicketForBroken(null);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de signaler le ticket",
        variant: "destructive"
      });
    }
  };

  // Gérer le retour d'un ticket utilisé vers le stock disponible
  const handleReturnUsedTicket = async (usedTicket: any) => {
    try {
      // 1. Remettre en stock
      await fetch('/api/cybercafe/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: usedTicket.ticketId,
          amount: 1
        })
      });

      // 2. Supprimer de l'historique d'utilisation
      await fetch(`/api/cybercafe/daily-history/${usedTicket.id}`, {
        method: 'DELETE'
      });

      // 3. Mettre à jour les états locaux
      const ticketIndex = tickets.findIndex(t => t.id === usedTicket.ticketId);
      if (ticketIndex !== -1) {
        const newTickets = [...tickets];
        const ticket = newTickets[ticketIndex];
        
        // Diminuer le compteur d'utilisés
        newTickets[ticketIndex] = {
          ...ticket,
          usedToday: Math.max((ticket.usedToday || 0) - 1, 0),
          stock: (ticket.stock || 0) + 1
        };
        setTickets(newTickets);
        
        // Diminuer le revenu journalier
        setDailyRevenue(prev => Math.max(prev - ticket.price, 0));
      }

      // 4. Recharger les données pour synchroniser
      await refreshData();

      toast({
        title: "✅ Ticket remis en stock",
        description: `Code: ${usedTicket.code || usedTicket.ticketCode} - Ticket disponible à nouveau`,
        duration: 3000
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de remettre le ticket en stock",
        variant: "destructive"
      });
    }
  };



  // Fonction pour gérer le début du drag depuis "Tickets Utilisés"
  const handleDragStart = (history: any, ticket: any) => {
    setDraggedTicket({
      ...history,
      ticketId: ticket.id,
      ticketDuration: ticket.duration,
      ticketPrice: ticket.price,
      code: history.code || history.ticketCode
    });
  };

  // Fonction pour gérer le drop sur "Problèmes Signalés"
  const handleDropToBroken = () => {
    if (draggedTicket) {
      setSelectedTicketForBroken(draggedTicket);
      setShowBrokenTicketDialog(true);
      setDraggedTicket(null);
    }
  };

  // Fonction pour gérer le drop sur "Tickets Utilisés" (annulation d'un problème)
  const handleDropToUsed = async (brokenTicket: any) => {
    try {
      // 1. Supprimer l'entrée BROKEN de la base de données
      if (brokenTicket.id) {
        await fetch(`/api/cybercafe/daily-history/${brokenTicket.id}`, {
          method: 'DELETE'
        });
      }
      
      // 2. Créer une nouvelle entrée USED dans l'historique
      await fetch('/api/cybercafe/daily-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: brokenTicket.ticketId,
          type: 'USED',
          quantity: 1,
          code: brokenTicket.code || brokenTicket.ticketCode || null,
          date
        })
      });
      
      // 3. Recharger les données
      await refreshData();
      
      toast({
        title: "✅ Problème annulé",
        description: `Le ticket ${brokenTicket.code || brokenTicket.ticketCode || 'inconnu'} est remis dans "Tickets Utilisés"`,
        duration: 3000
      });
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler le problème",
        variant: "destructive"
      });
    }
  };

  // Rafraîchir seulement les données sans recharger l'interface
  const refreshData = async () => {
    try {
      // Utiliser un état de loading spécifique pour ne pas affecter l'interface
      setIsRefreshing(true);
      console.log('🔄 Rafraîchissement des données...');
      
      const [ticketsData, historyData] = await Promise.all([
        fetch('/api/cybercafe/tickets').then(res => res.json()),
        fetch('/api/cybercafe/daily-history?date=' + date).then(res => res.json())
      ]);

      // Calculer les usages du jour depuis l'historique
      const todayUsage: {[key: string]: {used: number, broken: number, brokenDetails: any[]}} = {};
      
      if (historyData.success && historyData.history) {
        historyData.history.forEach((entry: DailyTicketHistory) => {
          if (!todayUsage[entry.ticketId]) {
            todayUsage[entry.ticketId] = { used: 0, broken: 0, brokenDetails: [] };
          }
          
          if (entry.type === 'USED') {
            todayUsage[entry.ticketId].used += entry.quantity;
          } else if (entry.type === 'BROKEN') {
            todayUsage[entry.ticketId].broken += entry.quantity;
            const codeFromReason = entry.reason?.match(/Code coupon: ([^\s]+)/)?.[1];
            todayUsage[entry.ticketId].brokenDetails.push({
              id: entry.id,
              quantity: entry.quantity,
              reason: entry.reason,
              code: entry.code || codeFromReason || entry.ticketCode
            });
          }
        });
      }

      // Charger les tickets utilisés récents
      const usedTicketsByType: {[ticketId: string]: any[]} = {};
      historyData.history
        ?.filter((entry: DailyTicketHistory) => entry.type === 'USED')
        .forEach((entry: DailyTicketHistory) => {
          if (!usedTicketsByType[entry.ticketId]) {
            usedTicketsByType[entry.ticketId] = [];
          }
          if (usedTicketsByType[entry.ticketId].length < 5) {
            const code = entry.reason?.replace('Code coupon: ', '') || entry.code || entry.ticketCode;
            usedTicketsByType[entry.ticketId].push({
              ...entry,
              ticketDuration: entry.ticket.duration,
              ticketPrice: entry.ticket.price,
              code: code
            });
          }
        });
      setRecentUsedTickets(usedTicketsByType);

      // Appliquer les données d'usage aux tickets
      const processedTickets = ticketsData.map((ticket: TicketType) => ({
        ...ticket,
        usedToday: todayUsage[ticket.id]?.used || 0,
        brokenToday: todayUsage[ticket.id]?.broken || 0,
        brokenTickets: todayUsage[ticket.id]?.brokenDetails || []
      }));
      
      setTickets(processedTickets);
      
      // Calculer le revenu journalier
      const revenue = processedTickets.reduce((sum: number, ticket: TicketType & { usedToday?: number }) => 
        sum + ((ticket.usedToday || 0) * ticket.price), 0);
      setDailyRevenue(revenue);

      // Rafraîchir aussi l'historique quotidien
      await loadDailyHistory();
      
      console.log('✅ Données rafraîchies');
      toast({
        title: "✅ Données actualisées",
        description: "Les informations ont été mises à jour",
        duration: 2000
      });
      
    } catch (error) {
      console.error('Erreur rafraîchissement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🌐 Gestion Cybercafé</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            📅 {new Date().toLocaleDateString('fr-FR')}
          </Badge>
          <Badge variant="default" className="text-lg px-3 py-1 bg-green-600">
            💰 {dailyRevenue.toLocaleString()} Ar
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Usage Journalier
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Gestion Stock
          </TabsTrigger>
          <TabsTrigger value="codes" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Codes
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rapports
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          {/* Section d'import PDF prominente */}
          <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
                <Upload className="h-8 w-8" />
                📄 Import PDF - Tickets DT WIFI ZONE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-white hover:border-blue-400 transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      handlePDFImport(file);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  }}
                >
                  <FileText className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">
                    Glissez votre PDF ici ou cliquez pour sélectionner
                  </h3>
                  <p className="text-blue-600 mb-4">
                    Format supporté : PDF contenant des tickets DT WIFI ZONE
                  </p>
                  
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    <Button 
                      type="button"
                      size="lg" 
                      disabled={isImportingPDF}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                      onClick={() => {
                        const input = document.getElementById('pdf-upload') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      {isImportingPDF ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Sélectionner un PDF
                        </>
                      )}
                    </Button>
                  </Label>
                  
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePDFImport(file);
                      }
                    }}
                  />
                </div>

                {/* Informations sur le format */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Card className="bg-white border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">✅ Format attendu :</h4>
                      <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                        <div>DT WIFI ZONE 1</div>
                        <div>Coupon</div>
                        <div className="text-blue-600 font-bold">30m1GDmC9</div>
                        <div>30min 1 GiB 500Ar</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-800 mb-2">🎯 Extraction automatique :</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Codes uniques des tickets</li>
                        <li>Durées (30min, 1h, etc.)</li>
                        <li>Prix (500Ar, 1000Ar, etc.)</li>
                        <li>Ajout automatique au stock</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vue d'ensemble des stocks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Vue d'ensemble des stocks
                </div>
                <Button 
                  onClick={() => {
                    // Recharger tous les données
                    setIsLoading(true);
                    fetch('/api/cybercafe/tickets')
                      .then(res => res.json())
                      .then(data => {
                        setTickets(data.map((ticket: TicketType) => ({
                          ...ticket,
                          usedToday: 0,
                          brokenToday: 0,
                          brokenTickets: []
                        })));
                        loadAvailableCodes();
                        loadStockHistory();
                        setIsLoading(false);
                        toast({
                          title: "🔄 Données actualisées",
                          description: "Les stocks ont été rechargés"
                        });
                      });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-20 mb-2" />
                        <Skeleton className="h-8 w-12 mb-3" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Aucun ticket en stock
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Importez un PDF pour commencer à gérer vos tickets
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.map((ticket) => {
                    const stockLevel = ticket.stock === 0 ? 'empty' : 
                                      ticket.stock <= 10 ? 'low' : 'normal';
                    
                    return (
                      <Card key={ticket.id} className={`border-2 ${
                        stockLevel === 'empty' ? 'border-red-200' :
                        stockLevel === 'low' ? 'border-yellow-200' : 'border-green-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="font-bold text-sm">
                              {ticket.duration}
                            </Badge>
                            <span className="text-sm font-medium text-gray-600">
                              {ticket.price.toLocaleString()} Ar
                            </span>
                          </div>
                          
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold mb-1">
                              {ticket.stock}
                            </div>
                            <div className="text-sm text-gray-500">
                              tickets disponibles
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  stockLevel === 'empty' ? 'bg-red-500' :
                                  stockLevel === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (ticket.stock / 50) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="text-center">
                              <span className={`text-xs font-medium ${
                                stockLevel === 'empty' ? 'text-red-600' :
                                stockLevel === 'low' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {stockLevel === 'empty' ? '❌ Stock épuisé' :
                                 stockLevel === 'low' ? '⚠️ Stock faible' : '✅ Stock normal'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions de gestion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Actions de gestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vider tous les stocks */}
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Vider tous les stocks
                    </h3>
                    <p className="text-red-700 text-sm mb-3">
                      Supprime tous les codes et remet les stocks à zéro.
                    </p>
                    <Button 
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `⚠️ ATTENTION !\n\nVoulez-vous vraiment vider TOUS les stocks ?\n\nCette action est IRRÉVERSIBLE !`
                        );
                        
                        if (!confirmed) return;
                        
                        const confirmation = prompt('Tapez "VIDER" pour confirmer:');
                        if (confirmation !== 'VIDER') {
                          toast({
                            title: "Action annulée",
                            description: "Stocks conservés",
                          });
                          return;
                        }

                        try {
                          const res = await fetch('/api/cybercafe/empty-stock', {
                            method: 'POST',
                          });

                          if (!res.ok) throw new Error();

                          const result = await res.json();
                          setTickets(prev => prev.map(t => ({ ...t, stock: 0 })));
                          loadAvailableCodes();
                          loadStockHistory();

                          toast({
                            title: "🗑️ Stocks vidés",
                            description: `${result.deletedCodes} codes supprimés`,
                          });
                        } catch {
                          toast({
                            title: "Erreur",
                            description: "Impossible de vider les stocks",
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Vider les stocks
                    </Button>
                  </CardContent>
                </Card>

                {/* Voir les codes détaillés */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Codes détaillés
                    </h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Accéder à la page complète avec tous les codes individuels.
                    </p>
                    <Button
                      onClick={() => window.open('/admin/cybercafe/codes', '_blank')}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-100"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir tous les codes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Historique récent des imports */}
          {stockHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique récent des imports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stockHistory.slice(0, 5).map((update) => (
                    <div key={update.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {update.ticket.duration}
                        </Badge>
                        <span className="text-sm">
                          +{update.amount} tickets
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(update.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          {/* Résumé rapide du jour */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dailyRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Chiffre d'affaires (Ar)</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tickets.reduce((sum: number, t: TicketType & { usedToday?: number }) => sum + (t.usedToday || 0), 0)}
                </div>
                <div className="text-sm text-blue-700">Tickets utilisés</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tickets.reduce((sum, t) => sum + (t.brokenToday || 0), 0)}
                </div>
                <div className="text-sm text-red-700">Tickets défaillants</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {tickets.reduce((sum, t) => sum + t.stock, 0)}
                </div>
                <div className="text-sm text-purple-700">Stock total</div>
              </CardContent>
            </Card>
          </div>

          {/* Bouton de rafraîchissement et date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="date">📅 Date :</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button 
              onClick={refreshData}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser les données
            </Button>

          </div>

          {/* Section principale des tickets */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-20 mb-2" />
                      <Skeleton className="h-8 w-12 mb-3" />
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              tickets.map((ticket, ticketIndex) => (
                <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                          {ticket.duration}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {ticket.price.toLocaleString()} Ar
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ticket.stock === 0 ? "destructive" : ticket.stock <= 10 ? "outline" : "default"} 
                               className={ticket.stock <= 10 && ticket.stock > 0 ? "border-orange-400 text-orange-600" : ""}>
                          📦 {ticket.stock} en stock
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      {/* Carte Utiliser Ticket */}
                      <Card className="bg-green-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            🎫 Utiliser ticket
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            className="w-full mb-2" 
                            onClick={() => useTicket(ticket.id, ticketIndex)}
                            disabled={ticket.stock <= 0}
                          >
                            Donner un ticket
                          </Button>
                          <p className="text-center text-sm text-muted-foreground">
                            {ticket.stock} disponibles
                          </p>
                        </CardContent>
                      </Card>

                      {/* Carte Tickets Utilisés */}
                      <Card className="bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            🕒 Tickets Utilisés
                          </CardTitle>
                        </CardHeader>
                        <CardContent 
                          className={`p-3 transition-all duration-200 ${
                            draggedTicket && draggedTicket.reason 
                              ? 'bg-blue-100 border-2 border-dashed border-blue-400' 
                              : ''
                          }`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedTicket) {
                              if (draggedTicket.reason) {
                                // Si on fait glisser depuis "Problèmes Signalés" vers "Tickets Utilisés"
                                handleDropToUsed(draggedTicket);
                                setDraggedTicket(null);
                              } else {
                                // Si on fait glisser depuis "Tickets Utilisés" vers "Tickets Utilisés" -> ne rien faire
                                console.log('🔄 Drop dans la même zone "Tickets Utilisés" - aucune action');
                                setDraggedTicket(null);
                              }
                            }
                          }}
                        >
                          {isLoadingDailyHistory ? (
                            <div className="space-y-1">
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-6 w-full" />
                            </div>
                          ) : dailyHistory.filter(h => h.type === 'USED' && h.ticket.duration === ticket.duration).length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {dailyHistory
                                .filter(h => h.type === 'USED' && h.ticket.duration === ticket.duration)
                                .filter(history => {
                                  // Exclure les tickets qui sont aussi dans les problèmes signalés
                                  const isAlsoBroken = ticket.brokenTickets?.some(broken => 
                                    (broken.code && broken.code === (history.code || history.ticketCode)) ||
                                    (broken.ticketCode && broken.ticketCode === (history.code || history.ticketCode))
                                  );
                                  return !isAlsoBroken;
                                })
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((history) => (
                                  <div 
                                    key={history.id} 
                                    className="flex justify-between items-center px-2 py-1 bg-white rounded text-xs border border-gray-100 cursor-move hover:bg-blue-50 transition-colors"
                                    draggable
                                    onDragStart={() => handleDragStart(history, ticket)}
                                    onDragEnd={() => setDraggedTicket(null)}
                                  >
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                                        {history.code || history.ticketCode || "Code non disponible"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {new Date(history.createdAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5 ml-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                        onClick={() => {
                                          handleReturnUsedTicket({
                                            ...history,
                                            ticketId: ticket.id,
                                            code: history.code || history.ticketCode
                                          });
                                        }}
                                        title="Remettre en stock disponible"
                                      >
                                        ↩️
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                                        onClick={() => {
                                          setSelectedTicketForBroken({
                                            ...history,
                                            ticketId: ticket.id,
                                            code: history.code || history.ticketCode
                                          });
                                          setShowBrokenTicketDialog(true);
                                        }}
                                        title="Signaler comme défaillant"
                                      >
                                        ⚠️
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-3 text-xs">
                              Aucun ticket {ticket.duration} utilisé aujourd'hui
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Carte Problèmes */}
                      <Card className="bg-red-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            ⚠️ Problèmes Signalés
                          </CardTitle>
                        </CardHeader>
                        <CardContent 
                          className={`p-3 transition-all duration-200 ${
                            draggedTicket && !draggedTicket.reason 
                              ? 'bg-red-100 border-2 border-dashed border-red-400' 
                              : ''
                          }`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedTicket && !draggedTicket.reason) {
                              // Si on fait glisser depuis "Tickets Utilisés" vers "Problèmes Signalés"
                              handleDropToBroken();
                            }
                          }}
                        >
                          {ticket.brokenTickets && ticket.brokenTickets.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {ticket.brokenTickets.map((broken, index) => (
                                <div 
                                  key={index}
                                  className="flex justify-between items-center px-2 py-1 bg-white rounded text-xs border border-gray-100 cursor-move hover:bg-red-50 transition-colors"
                                  draggable
                                  onDragStart={() => setDraggedTicket({ 
                                    ...broken, 
                                    ticketId: ticket.id,
                                    reason: broken.reason || 'unknown' // S'assurer qu'il y a une raison pour identifier le drag depuis problèmes
                                  })}
                                  onDragEnd={() => setDraggedTicket(null)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5 flex-shrink-0">
                                        {(() => {
                                          // Debug temporaire pour comprendre la structure
                                          if (broken.code === null || broken.code === undefined || broken.code === "Code N/A") {
                                            console.log('🔍 Ticket avec Code N/A:', {
                                              'broken.code': broken.code,
                                              'broken.ticketCode': broken.ticketCode, 
                                              'broken.reason': broken.reason,
                                              'type de reason': typeof broken.reason,
                                              'broken complet': broken
                                            });
                                          }
                                          
                                          // Essayer de récupérer le code depuis plusieurs sources
                                          let codeValue = null;
                                          
                                          // 1. Champ code direct
                                          if (broken.code && broken.code.trim()) {
                                            codeValue = broken.code.trim();
                                          }
                                          // 2. Champ ticketCode  
                                          else if (broken.ticketCode && broken.ticketCode.trim()) {
                                            codeValue = broken.ticketCode.trim();
                                          }
                                          // 3. Extraire depuis reason si format ancien "Code coupon: XXXXX"
                                          else if (broken.reason && typeof broken.reason === 'string') {
                                            const match = broken.reason.match(/Code coupon:\s*([^\s,]+)/i);
                                            if (match && match[1]) {
                                              codeValue = match[1].trim();
                                            }
                                          }
                                          
                                          return codeValue || "Code N/A";
                                        })()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground truncate">
                                        - {(() => {
                                          // Convertir la valeur de raison en label lisible
                                          if (broken.reason) {
                                            // Si c'est l'ancien format avec "Code coupon:", extraire seulement la vraie raison
                                            if (broken.reason.includes && broken.reason.includes('Code coupon:')) {
                                              const cleanReason = broken.reason.replace(/Code coupon: [^\s,]+\s*[,]?\s*/, '').trim();
                                              // Chercher le label correspondant
                                              const reasonObj = BROKEN_TICKET_REASONS.find(r => r.value === cleanReason);
                                              return reasonObj ? reasonObj.label : cleanReason || "Raison non spécifiée";
                                            }
                                            
                                            // Chercher le label correspondant à la valeur
                                            const reasonObj = BROKEN_TICKET_REASONS.find(r => r.value === broken.reason);
                                            return reasonObj ? reasonObj.label : broken.reason;
                                          }
                                          return "Raison non spécifiée";
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 ml-1 flex-shrink-0"
                                    onClick={async () => {
                                      try {
                                        const brokenTicket = ticket.brokenTickets?.[index];
                                        if (!brokenTicket) return;
                                        
                                        // 1. Supprimer l'entrée BROKEN de la base de données
                                        if (brokenTicket.id) {
                                          await fetch(`/api/cybercafe/daily-history/${brokenTicket.id}`, {
                                            method: 'DELETE'
                                          });
                                        }
                                        
                                        // 2. Créer une nouvelle entrée USED dans l'historique (API)
                                        await fetch('/api/cybercafe/daily-history', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            ticketId: ticket.id,
                                            type: 'USED',
                                            quantity: 1,
                                            code: brokenTicket.code || brokenTicket.ticketCode || null,
                                            date
                                          })
                                        });
                                        
                                        // 3. Recharger les données pour synchroniser (cela va automatiquement retirer de "Problèmes Signalés")
                                        await refreshData();
                                        
                                        toast({
                                          title: "✅ Problème annulé",
                                          description: `Le ticket ${brokenTicket.code || brokenTicket.ticketCode || 'inconnu'} est remis dans "Tickets Utilisés"`,
                                          duration: 3000
                                        });
                                        
                                      } catch (error: any) {
                                        toast({
                                          title: "Erreur",
                                          description: error.message || "Impossible d'annuler le problème",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    title="Annuler ce problème et remettre en tickets utilisés"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-3 text-xs">
                              Aucun problème signalé
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Carte Aujourd'hui */}
                      <Card className="bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            📊 Aujourd'hui
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                ✅ Utilisés:
                              </span>
                              <span className="font-bold text-green-600">
                                {ticket.usedToday || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                ❌ Défaillants:
                              </span>
                              <span className="font-bold text-red-600">
                                {ticket.brokenToday || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="flex items-center gap-2">
                                💰 Revenus:
                              </span>
                              <span className="font-bold text-purple-600">
                                {((ticket.usedToday || 0) * ticket.price).toLocaleString()} Ar
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Popup pour afficher le code ticket */}
          <Dialog open={showTicketCode} onOpenChange={setShowTicketCode}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  🎫 Code Ticket Généré
                </DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="text-xs text-green-600 mb-2">Code d'accès:</div>
                  <div className="text-2xl font-bold font-mono text-green-800 bg-white p-3 rounded border">
                    {lastTicketCode}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Donnez ce code au client pour accéder à Internet
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(lastTicketCode);
                      toast({
                        title: "✅ Code copié",
                        description: "Le code a été copié dans le presse-papier"
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    📋 Copier
                  </Button>
                  <Button
                    onClick={() => setShowTicketCode(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    ✅ Compris
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Popup pour marquer un ticket utilisé comme défaillant */}
          <Dialog open={showBrokenTicketDialog} onOpenChange={setShowBrokenTicketDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  ⚠️ Marquer Ticket Défaillant
                </DialogTitle>
              </DialogHeader>
              {selectedTicketForBroken && (
                <div className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="text-center space-y-2">
                      <Badge variant="outline" className="font-bold">
                        {selectedTicketForBroken.ticketDuration}
                      </Badge>
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {selectedTicketForBroken.code}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedTicketForBroken.ticketPrice} Ar - {new Date(selectedTicketForBroken.createdAt).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="broken-reason" className="text-sm font-medium mb-2 block">
                      Raison du problème :
                    </Label>
                    <select
                      id="broken-reason"
                      value={brokenTicketReason}
                      onChange={(e) => setBrokenTicketReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">-- Sélectionner une raison --</option>
                      {BROKEN_TICKET_REASONS.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowBrokenTicketDialog(false);
                        setBrokenTicketReason('');
                        setSelectedTicketForBroken(null);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={!brokenTicketReason}
                      onClick={handleReportUsedTicket}
                    >
                      ⚠️ Confirmer
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Actions en fin de journée */}
          {(dailyRevenue > 0 || tickets.reduce((sum, t) => sum + (t.brokenToday || 0), 0) > 0) && (
            <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      💰 Bilan de la journée
                    </h3>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {dailyRevenue.toLocaleString()} Ar
                      </div>
                      <div className="text-sm text-green-700">
                        {tickets.reduce((sum: number, t: TicketType & { usedToday?: number }) => sum + (t.usedToday || 0), 0)} tickets vendus
                        {tickets.reduce((sum: number, t: TicketType & { brokenToday?: number }) => sum + (t.brokenToday || 0), 0) > 0 && 
                          ` • ${tickets.reduce((sum: number, t: TicketType & { brokenToday?: number }) => sum + (t.brokenToday || 0), 0)} problèmes`
                        }
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={saveReport}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    💾 Sauvegarder le rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Codes de Tickets Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableCodes.map((ticketCodes) => (
                  <div key={ticketCodes.ticketType} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold">{ticketCodes.ticketType}</Badge>
                        <span className="text-sm text-gray-600">{ticketCodes.price} Ar</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-green-600 font-bold">{ticketCodes.codes.length} disponibles</span> • 
                        <span className="text-red-600"> {ticketCodes.usedCount} utilisés</span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {ticketCodes.codes.map((code: string, index: number) => (
                        <div key={index} className="bg-gray-50 rounded p-2 flex items-center justify-between">
                          <span className="font-mono text-sm font-medium">{code}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copier le code"
                          >
                            📋
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {availableCodes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>Aucun code trouvé</p>
                    <p className="text-sm">Tickets chargés: {tickets.length}</p>
                    <button 
                      onClick={() => {
                        console.log('Tickets actuels:', tickets);
                        loadAvailableCodes();
                      }}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      🔄 Générer les codes
                    </button>
                  </div>
                )}

                {/* Bouton pour la page complète */}
                <div className="text-center pt-4">
                  <Button
                    onClick={() => window.open('/admin/cybercafe/codes', '_blank')}
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    🔗 Voir la page complète avec toutes les fonctionnalités
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu rapide des statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Aperçu des Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="font-bold">
                        {ticket.duration}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {ticket.price} Ar
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Disponibles:</span>
                        <span className="font-bold text-green-600">
                          {ticket.stock}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${ticket.stock > 0 ? Math.min(100, (ticket.stock / 20) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        {ticket.stock === 0 ? "Stock épuisé" : 
                         ticket.stock <= 5 ? "Stock faible" : 
                         "Stock normal"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {tickets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun ticket trouvé.</p>
                  <p className="text-sm">Importez des PDFs pour voir les codes disponibles.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                💡 À propos des codes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🎫 Codes disponibles :</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Chaque ticket importé a un code unique</li>
                    <li>Les codes viennent directement des PDFs</li>
                    <li>Un code utilisé ne peut plus être réutilisé</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📋 Dans la liste complète :</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Voir tous les codes par type de ticket</li>
                    <li>Copier les codes en un clic</li>
                    <li>Statistiques détaillées d'utilisation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">📊 Rapports du Mois</h2>
              <div className="text-2xl font-bold text-purple-600">
                Total: {monthlyTotal?.toLocaleString() || 0} Ar
              </div>
            </div>

            <div className="grid gap-4">
              {reports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun rapport pour ce mois
                </p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">
                        📅 {new Date(report.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <div className="font-bold text-green-600">
                        {report.totalRevenue.toLocaleString()} Ar
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {report.ticketUsages.map((usage, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{usage.ticket.duration}:</span>
                          <span className="font-semibold">{usage.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Mises à Jour de Stock
              </h2>
              <Button 
                onClick={loadStockHistory}
                disabled={isLoadingHistory}
                variant="outline"
              >
                {isLoadingHistory ? "Chargement..." : "🔄 Actualiser"}
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : stockHistory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun historique de mise à jour de stock disponible
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les mises à jour apparaîtront ici après avoir ajouté du stock
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {stockHistory.map((update) => (
                  <div key={update.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-bold">
                          {update.ticket.duration}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {update.ticket.price.toLocaleString()} Ar
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {new Date(update.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} à {new Date(update.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground">Stock précédent</div>
                        <div className="font-semibold text-red-600">{update.previousStock}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Ajouté</div>
                        <div className="font-bold text-green-600">+{update.amount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Nouveau stock</div>
                        <div className="font-semibold text-blue-600">{update.newStock}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {stockHistory.length >= 50 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Affichage des 50 dernières mises à jour
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
 