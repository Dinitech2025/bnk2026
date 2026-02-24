'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Globe, Key, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface PayPalConfig {
  environment: 'sandbox' | 'production';
  clientId: string;
  clientSecret: string;
  webhookId: string;
  currency: string;
  conversionRate: number;
  autoConvert: boolean;
}

interface PayPalConfigProps {
  paymentMethodId: string;
  providerId: string;
  initialConfig: PayPalConfig;
  onConfigUpdate: (config: PayPalConfig) => void;
}

export function PayPalConfig({ paymentMethodId, providerId, initialConfig, onConfigUpdate }: PayPalConfigProps) {
  const [config, setConfig] = useState<PayPalConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/payment-providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: config,
          apiEndpoint: config.environment === 'production' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com'
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      onConfigUpdate(config);
      toast.success('Configuration PayPal sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/payment-methods/paypal/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: 'Connexion PayPal réussie' });
        toast.success('Test de connexion PayPal réussi');
      } else {
        setTestResult({ success: false, message: result.error || 'Erreur de connexion' });
        toast.error('Échec du test de connexion PayPal');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de réseau' });
      toast.error('Erreur lors du test de connexion');
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (key: keyof PayPalConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration PayPal
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez votre intégration PayPal pour accepter les paiements
          </p>
        </div>
        <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
          {config.environment === 'production' ? 'Production' : 'Sandbox'}
        </Badge>
      </div>

      {/* Configuration de l'environnement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Environnement
          </CardTitle>
          <CardDescription>
            Choisissez entre l'environnement de test (sandbox) et la production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Environnement PayPal</Label>
            <Select 
              value={config.environment} 
              onValueChange={(value: 'sandbox' | 'production') => updateConfig('environment', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Sandbox (Test)
                  </div>
                </SelectItem>
                <SelectItem value="production">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Production (Live)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {config.environment === 'production' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Mode Production</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Attention : Vous êtes en mode production. Les paiements seront réels.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Clés API PayPal
          </CardTitle>
          <CardDescription>
            Configurez vos identifiants PayPal pour l'environnement {config.environment}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              type="text"
              value={config.clientId}
              onChange={(e) => updateConfig('clientId', e.target.value)}
              placeholder="Votre Client ID PayPal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={config.clientSecret}
              onChange={(e) => updateConfig('clientSecret', e.target.value)}
              placeholder="Votre Client Secret PayPal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookId">Webhook ID (Optionnel)</Label>
            <Input
              id="webhookId"
              type="text"
              value={config.webhookId}
              onChange={(e) => updateConfig('webhookId', e.target.value)}
              placeholder="ID du webhook PayPal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration des devises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Configuration des devises
          </CardTitle>
          <CardDescription>
            Configurez la conversion entre Ariary (Ar) et la devise PayPal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise PayPal</Label>
              <Select 
                value={config.currency} 
                onValueChange={(value) => updateConfig('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conversionRate">Taux de conversion</Label>
              <Input
                id="conversionRate"
                type="number"
                value={config.conversionRate}
                onChange={(e) => updateConfig('conversionRate', parseFloat(e.target.value) || 0)}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground">
                1 {config.currency} = {config.conversionRate} Ar
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="autoConvert"
              checked={config.autoConvert}
              onCheckedChange={(checked) => updateConfig('autoConvert', checked)}
            />
            <Label htmlFor="autoConvert">Conversion automatique des montants</Label>
          </div>
        </CardContent>
      </Card>

      {/* Test de connexion */}
      {testResult && (
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
        
        <Button variant="outline" onClick={handleTest} disabled={isTesting}>
          {isTesting ? 'Test en cours...' : 'Tester la connexion'}
        </Button>
      </div>
    </div>
  );
}

