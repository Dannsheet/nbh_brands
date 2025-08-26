'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/Input';

export default function SearchBar({ placeholder = 'Buscar por nombre...' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams?.get('q') ?? '';
  const [value, setValue] = useState(q);

  // Debounce opcional: para búsquedas en keyup
  const handleSearchDebounced = useDebouncedCallback((val) => {
    const params = new URLSearchParams(window.location.search);
    if (val) params.set('q', val);
    else params.delete('q');
    params.set('page', '1'); // reset page
    router.push(`/admin/productos?${params.toString()}`);
  }, 300);

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    params.set('page', '1');
    router.push(`/admin/productos?${params.toString()}`);
  }

  function handleChange(e) {
    const v = e.target.value;
    setValue(v);
    handleSearchDebounced(v);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="max-w-sm"
      />
      <button type="submit" className="ml-2 btn">Buscar</button>
    </form>
  );
}

