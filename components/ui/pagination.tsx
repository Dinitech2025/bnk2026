'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  className?: string;
}

// Composants individuels pour compatibilité
export const PaginationContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center space-x-2', className)} {...props}>
    {children}
  </div>
)

export const PaginationItem = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const PaginationLink = ({ 
  children, 
  className, 
  href, 
  isActive,
  ...props 
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { isActive?: boolean }) => (
  <Link 
    href={href || '#'} 
    className={cn(
      'inline-flex items-center justify-center w-9 h-9 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground',
      isActive && 'bg-primary text-primary-foreground',
      className
    )} 
    {...props}
  >
    {children}
  </Link>
)

export const PaginationPrevious = ({ 
  children, 
  className, 
  href,
  ...props 
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link 
    href={href || '#'} 
    className={cn(
      'inline-flex items-center justify-center px-3 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground',
      className
    )} 
    {...props}
  >
    <ChevronLeft className="h-4 w-4 mr-1" />
    {children || 'Précédent'}
  </Link>
)

export const PaginationNext = ({ 
  children, 
  className, 
  href,
  ...props 
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link 
    href={href || '#'} 
    className={cn(
      'inline-flex items-center justify-center px-3 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground',
      className
    )} 
    {...props}
  >
    {children || 'Suivant'}
    <ChevronRight className="h-4 w-4 ml-1" />
  </Link>
)

export const PaginationEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-center w-9 h-9', className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
  </div>
)

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  limit,
  className
}: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        Affichage de {startItem} à {endItem} sur {totalCount} résultat{totalCount > 1 ? 's' : ''}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Bouton précédent */}
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageURL(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Link>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </>
          )}
        </Button>

        {/* Numéros de page */}
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <Button
                  key={`dots-${index}`}
                  variant="ghost"
                  size="sm"
                  disabled
                  className="w-9 h-9"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                asChild={!isCurrentPage}
                disabled={isCurrentPage}
                className="w-9 h-9"
              >
                {isCurrentPage ? (
                  pageNumber
                ) : (
                  <Link href={createPageURL(pageNumber)}>
                    {pageNumber}
                  </Link>
                )}
              </Button>
            );
          })}
        </div>

        {/* Bouton suivant */}
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage < totalPages}
          disabled={currentPage >= totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageURL(currentPage + 1)}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          ) : (
            <>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}