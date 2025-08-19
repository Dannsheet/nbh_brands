'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLink({ href, label, icon, badge }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors font-medium ${ 
        isActive
          ? 'bg-yellow-400 text-black'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-gray-900 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
