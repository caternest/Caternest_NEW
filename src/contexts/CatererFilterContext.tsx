import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface CatererFilters {
  cuisineFilter: string; // '' (cleared/default), 'Veg', 'Non-Veg'
  occasionFilter: string[];
  budgetFilter: number;
  guestsFilter: string[];
  sortOption: string;
  isLiveCounters: boolean;
  isVerifiedOnly: boolean;
  ratingFilter: number;
  searchKeyword: string;
}

export const DEFAULT_CATERER_FILTERS: CatererFilters = {
  cuisineFilter: '', // Default: no food type filter active (clean/cleared)
  occasionFilter: [],
  budgetFilter: 1000, // 1000 = All Budgets
  guestsFilter: [],
  sortOption: 'Popularity',
  isLiveCounters: false,
  isVerifiedOnly: false,
  ratingFilter: 0,
  searchKeyword: '',
};

interface CatererFilterContextType {
  filters: CatererFilters;
  cuisineFilter: string;
  occasionFilter: string[];
  budgetFilter: number;
  guestsFilter: string[];
  sortOption: string;
  isLiveCounters: boolean;
  isVerifiedOnly: boolean;
  ratingFilter: number;
  searchKeyword: string;
  setCuisineFilter: (action: string | ((prev: string) => string)) => void;
  setOccasionFilter: (action: string[] | ((prev: string[]) => string[])) => void;
  setBudgetFilter: (action: number | ((prev: number) => number)) => void;
  setGuestsFilter: (action: string[] | ((prev: string[]) => string[])) => void;
  setSortOption: (action: string | ((prev: string) => string)) => void;
  setIsLiveCounters: (action: boolean | ((prev: boolean) => boolean)) => void;
  setIsVerifiedOnly: (action: boolean | ((prev: boolean) => boolean)) => void;
  setRatingFilter: (action: number | ((prev: number) => number)) => void;
  setSearchKeyword: (action: string | ((prev: string) => string)) => void;
  toggleOccasionFilter: (occName: string) => void;
  clearAllFilters: () => void;
  resetToDefaults: () => void;
}

const CatererFilterContext = createContext<CatererFilterContextType | undefined>(undefined);

export function CatererFilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CatererFilters>(DEFAULT_CATERER_FILTERS);

  // In-memory ref to detect login/logout session transitions without touching localStorage/cookies
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentUserId = user?.id || null;

    // Detect session transitions:
    // 1. User logged out: previous was non-null, now null -> reset filters
    // 2. User logged in: previous was null or different user -> reset filters (fresh login starts clean)
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
      console.log(`[CATERER FILTERS] Session transition detected (${prevUserIdRef.current} -> ${currentUserId}). Initializing filters to defaults.`);
      setFilters(DEFAULT_CATERER_FILTERS);
    }

    prevUserIdRef.current = currentUserId;
  }, [user?.id]);

  const setCuisineFilter = (action: string | ((prev: string) => string)) => {
    setFilters(prev => {
      const nextVal = typeof action === 'function' ? action(prev.cuisineFilter) : action;
      // Guarantee "Both" or non-veg/veg only
      const sanitized = nextVal === 'Veg' || nextVal === 'Non-Veg' ? nextVal : '';
      return { ...prev, cuisineFilter: sanitized };
    });
  };

  const setOccasionFilter = (action: string[] | ((prev: string[]) => string[])) => {
    setFilters(prev => ({
      ...prev,
      occasionFilter: typeof action === 'function' ? action(prev.occasionFilter) : action,
    }));
  };

  const toggleOccasionFilter = (occName: string) => {
    setFilters(prev => ({
      ...prev,
      occasionFilter: prev.occasionFilter.includes(occName)
        ? prev.occasionFilter.filter(o => o !== occName)
        : [...prev.occasionFilter, occName],
    }));
  };

  const setBudgetFilter = (action: number | ((prev: number) => number)) => {
    setFilters(prev => ({
      ...prev,
      budgetFilter: typeof action === 'function' ? action(prev.budgetFilter) : action,
    }));
  };

  const setGuestsFilter = (action: string[] | ((prev: string[]) => string[])) => {
    setFilters(prev => ({
      ...prev,
      guestsFilter: typeof action === 'function' ? action(prev.guestsFilter) : action,
    }));
  };

  const setSortOption = (action: string | ((prev: string) => string)) => {
    setFilters(prev => ({
      ...prev,
      sortOption: typeof action === 'function' ? action(prev.sortOption) : action,
    }));
  };

  const setIsLiveCounters = (action: boolean | ((prev: boolean) => boolean)) => {
    setFilters(prev => ({
      ...prev,
      isLiveCounters: typeof action === 'function' ? action(prev.isLiveCounters) : action,
    }));
  };

  const setIsVerifiedOnly = (action: boolean | ((prev: boolean) => boolean)) => {
    setFilters(prev => ({
      ...prev,
      isVerifiedOnly: typeof action === 'function' ? action(prev.isVerifiedOnly) : action,
    }));
  };

  const setRatingFilter = (action: number | ((prev: number) => number)) => {
    setFilters(prev => ({
      ...prev,
      ratingFilter: typeof action === 'function' ? action(prev.ratingFilter) : action,
    }));
  };

  const setSearchKeyword = (action: string | ((prev: string) => string)) => {
    setFilters(prev => ({
      ...prev,
      searchKeyword: typeof action === 'function' ? action(prev.searchKeyword) : action,
    }));
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_CATERER_FILTERS);
  };

  const resetToDefaults = () => {
    setFilters(DEFAULT_CATERER_FILTERS);
  };

  return (
    <CatererFilterContext.Provider
      value={{
        filters,
        cuisineFilter: filters.cuisineFilter,
        occasionFilter: filters.occasionFilter,
        budgetFilter: filters.budgetFilter,
        guestsFilter: filters.guestsFilter,
        sortOption: filters.sortOption,
        isLiveCounters: filters.isLiveCounters,
        isVerifiedOnly: filters.isVerifiedOnly,
        ratingFilter: filters.ratingFilter,
        searchKeyword: filters.searchKeyword,
        setCuisineFilter,
        setOccasionFilter,
        toggleOccasionFilter,
        setBudgetFilter,
        setGuestsFilter,
        setSortOption,
        setIsLiveCounters,
        setIsVerifiedOnly,
        setRatingFilter,
        setSearchKeyword,
        clearAllFilters,
        resetToDefaults,
      }}
    >
      {children}
    </CatererFilterContext.Provider>
  );
}

export function useCatererFilters() {
  const context = useContext(CatererFilterContext);
  if (!context) {
    throw new Error('useCatererFilters must be used within a CatererFilterProvider');
  }
  return context;
}
