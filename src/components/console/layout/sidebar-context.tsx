'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  toggle: () => {
    throw new Error('useSidebar must be used within SidebarProvider');
  },
  close: () => {
    throw new Error('useSidebar must be used within SidebarProvider');
  },
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((value) => !value),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};
