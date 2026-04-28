import { createContext, useContext, useState, type ReactNode } from "react";

export interface CartItem {
  id: number | string;
  type: "survey" | "finding" | "other";
  description: string;
  code?: string;
  date?: string;
}

interface SurveyRequestState {
  selectedItems: CartItem[];
  showCart: boolean;
}

interface SurveyRequestContextType {
  state: SurveyRequestState;
  addItem: (item: CartItem) => void;
  removeItem: (id: number | string, type: "survey" | "finding" | "other") => void;
  clearCart: () => void;
  toggleCart: (show?: boolean) => void;
  isItemSelected: (id: number | string, type: "survey" | "finding" | "other") => boolean;
}

const SurveyRequestContext = createContext<SurveyRequestContextType | undefined>(undefined);

export function SurveyRequestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SurveyRequestState>({
    selectedItems: [],
    showCart: false,
  });

  const addItem = (item: CartItem) => {
    setState((prev) => {
      if (prev.selectedItems.some((i) => i.id === item.id && i.type === item.type)) {
        return prev;
      }
      return { ...prev, selectedItems: [...prev.selectedItems, item] };
    });
  };

  const removeItem = (id: number | string, type: "survey" | "finding" | "other") => {
    setState((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((i) => !(i.id === id && i.type === type)),
    }));
  };

  const clearCart = () => {
    setState((prev) => ({ ...prev, selectedItems: [] }));
  };

  const toggleCart = (show?: boolean) => {
    setState((prev) => ({ ...prev, showCart: show !== undefined ? show : !prev.showCart }));
  };

  const isItemSelected = (id: number | string, type: "survey" | "finding" | "other") => {
    return state.selectedItems.some((i) => i.id === id && i.type === type);
  };

  return (
    <SurveyRequestContext.Provider
      value={{ state, addItem, removeItem, clearCart, toggleCart, isItemSelected }}
    >
      {children}
    </SurveyRequestContext.Provider>
  );
}

export function useSurveyRequest() {
  const context = useContext(SurveyRequestContext);
  if (!context) {
    throw new Error("useSurveyRequest must be used within a SurveyRequestProvider");
  }
  return context;
}
