import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderNotFound() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">Commande introuvable</h1>
        <p className="text-muted-foreground mb-8">
          La commande que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Link href="/admin/orders">
          <Button className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste des commandes
          </Button>
        </Link>
      </div>
    </div>
  );
} 
 