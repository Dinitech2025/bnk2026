'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

export default function DeleteOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression de la commande');
      }

      router.push('/admin/orders');
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue lors de la suppression de la commande.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/admin/orders/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Supprimer la commande</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-6 text-red-500">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="text-xl font-semibold text-center mb-4">
          Êtes-vous sûr de vouloir supprimer cette commande ?
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          Cette action est irréversible et supprimera définitivement la commande #{params.id.substring(0, 8)}.
          Les abonnements associés à cette commande resteront actifs mais ne seront plus liés à une commande.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Link 
            href={`/admin/orders/${params.id}`}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Annuler
          </Link>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <span>Confirmer la suppression</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 