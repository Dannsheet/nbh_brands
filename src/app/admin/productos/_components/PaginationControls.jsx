'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function PaginationControls({ currentPage, totalPages }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const createPageURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400 min-w-[100px]"
        onClick={() => router.push(createPageURL(currentPage - 1))}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-gray-400">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400 min-w-[100px]"
        onClick={() => router.push(createPageURL(currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  );
}
