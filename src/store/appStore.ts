// Store global con Zustand
import { create } from 'zustand';
import { User, Device, Order, Sale, Product } from '@types/index';

interface AppState {
  // Auth
  currentUser: User | null;
  currentDevice: Device | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: User | null) => void;
  setCurrentDevice: (device: Device | null) => void;

  // UI
  currentPage: 'login' | 'pos' | 'admin' | 'reports' | 'kitchen' | 'closing';
  setCurrentPage: (page: AppState['currentPage']) => void;

  // POS State
  tables: Order[];
  currentTableNumber: number | null;
  setCurrentTable: (tableNumber: number) => void;
  addItemToTable: (item: any) => void;
  removeItemFromTable: (itemId: string) => void;
  clearTable: (tableNumber: number) => void;

  // Productos
  products: Product[];
  setProducts: (products: Product[]) => void;

  // Usuarios
  users: User[];
  setUsers: (users: User[]) => void;

  // Logout
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  currentUser: null,
  currentDevice: null,
  isAuthenticated: false,
  setCurrentUser: (user: User | null) =>
    set({ currentUser: user, isAuthenticated: !!user }),
  setCurrentDevice: (device: Device | null) => set({ currentDevice: device }),

  // UI
  currentPage: 'login',
  setCurrentPage: (page) => set({ currentPage: page }),

  // POS
  tables: [],
  currentTableNumber: null,
  setCurrentTable: (tableNumber: number) =>
    set({ currentTableNumber: tableNumber }),
  addItemToTable: (item: any) =>
    set((state) => {
      // Agregar item a la mesa actual
      return state;
    }),
  removeItemFromTable: (itemId: string) =>
    set((state) => {
      // Remover item
      return state;
    }),
  clearTable: (tableNumber: number) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.tableNumber !== tableNumber),
    })),

  // Productos y Usuarios
  products: [],
  setProducts: (products: Product[]) => set({ products }),
  users: [],
  setUsers: (users: User[]) => set({ users }),

  // Logout
  logout: () =>
    set({
      currentUser: null,
      currentDevice: null,
      isAuthenticated: false,
      currentPage: 'login',
      currentTableNumber: null,
    }),
}));
