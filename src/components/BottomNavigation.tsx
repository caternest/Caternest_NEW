import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChefHat, Calendar, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      label: 'Caterers',
      icon: ChefHat,
      path: '/explore',
    },
    {
      label: 'Orders',
      icon: Calendar,
      path: '/orders',
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 py-2 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md">
      {navItems.map((item) => {
        const isActive =
          item.path === '/'
            ? currentPath === '/' && localStorage.getItem('homepage_mode') !== 'marketplace'
            : currentPath.startsWith(item.path);

        return (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95"
          >
            <item.icon
              size={20}
              className={cn(
                'transition-all duration-200',
                isActive
                  ? 'text-brand-green-900 stroke-[2.5px] scale-110'
                  : 'text-slate-400 hover:text-slate-600 stroke-[2px]'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium mt-1 font-poppins transition-all duration-200',
                isActive
                  ? 'text-brand-green-900 font-extrabold'
                  : 'text-slate-400 font-semibold'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
