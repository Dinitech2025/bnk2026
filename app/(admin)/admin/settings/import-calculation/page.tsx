'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Save, 
  RotateCcw,
  Calculator,
  Truck,
  Percent,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImportSetting {
  id: string
  key: string
  value: string
  description: string
  category: string
}

function ImportCalculationSettingsPage() {
  const [settings, setSettings] = useState<ImportSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Charger les paramètres
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/import-calculation')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ))
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings/import-calculation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès' })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings/import-calculation/reset', {
        method: 'POST'
      })

      if (response.ok) {
        await fetchSettings()
        setMessage({ type: 'success', text: 'Paramètres réinitialisés aux valeurs par défaut' })
      } else {
        throw new Error('Erreur lors de la réinitialisation')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la réinitialisation' })
    } finally {
      setSaving(false)
    }
  }

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return <Truck className="h-4 w-4" />
      case 'commission': return <Percent className="h-4 w-4" />
      case 'fees': return <DollarSign className="h-4 w-4" />
      case 'general': return <Settings className="h-4 w-4" />
      default: return <Calculator className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres de Calcul d'Importation</h1>
        <p className="text-muted-foreground">
          Configurez les paramètres utilisés pour calculer les coûts d'importation.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <Tabs defaultValue="transport" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="commission" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Commission
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Frais
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Tarifs de Transport
              </CardTitle>
              <CardDescription>
                Configurez les tarifs de transport par kg selon l'origine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('transport').map((setting) => (
                <div key={setting.key} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={setting.key}>{setting.description}</Label>
                  <Input
                    id={setting.key}
                    type="number"
                    step="0.1"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full"
                  />
                  <Badge variant="secondary">par kg</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Taux de Commission
              </CardTitle>
              <CardDescription>
                Configurez les taux de commission variables selon le prix du produit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('commission').map((setting) => (
                <div key={setting.key} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={setting.key}>{setting.description}</Label>
                  <Input
                    id={setting.key}
                    type="number"
                    step="0.1"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full"
                  />
                  <Badge variant="secondary">%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Frais et Taxes
              </CardTitle>
              <CardDescription>
                Configurez les frais fixes et les taux de taxe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('fees').map((setting) => (
                <div key={setting.key} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={setting.key}>{setting.description}</Label>
                  <Input
                    id={setting.key}
                    type="number"
                    step="0.1"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full"
                  />
                  <Badge variant="secondary">
                    {setting.key.includes('rate') ? '%' : 'fixe'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>
                Configurez les paramètres généraux de calcul.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('general').map((setting) => (
                <div key={setting.key} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={setting.key}>{setting.description}</Label>
                  <Input
                    id={setting.key}
                    type={setting.key === 'calculation_method' ? 'text' : 'number'}
                    step="0.1"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full"
                  />
                  <Badge variant="secondary">
                    {setting.key.includes('rate') ? '%' : ''}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ImportCalculationSettingsPage 