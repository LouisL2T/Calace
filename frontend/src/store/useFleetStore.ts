import { create } from 'zustand';
import api from '../services/api';
import { RentalCar } from '../types';

interface FleetState {
  cars: RentalCar[];
  isLoading: boolean;
  error: string | null;
  fetchCars: () => Promise<void>;
  createCar: (car: Partial<RentalCar>) => Promise<void>;
  updateCar: (id: string, car: Partial<RentalCar>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  cars: [],
  isLoading: false,
  error: null,

  fetchCars: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/fleet/rental-cars');
      set({ cars: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching rental cars:', error);
      set({ error: 'Mietwagen konnten nicht geladen werden', isLoading: false });
    }
  },

  createCar: async (car) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/fleet/rental-cars', car);
      set((state) => ({ cars: [...state.cars, response.data], isLoading: false }));
    } catch (error) {
      console.error('Error creating rental car:', error);
      set({ error: 'Fehler beim Erstellen des Mietwagens', isLoading: false });
      throw error;
    }
  },

  updateCar: async (id, car) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/fleet/rental-cars/${id}`, car);
      set((state) => ({
        cars: state.cars.map((c) => (c.id === id ? response.data : c)),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error updating rental car:', error);
      set({ error: 'Fehler beim Aktualisieren des Mietwagens', isLoading: false });
      throw error;
    }
  },

  deleteCar: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/fleet/rental-cars/${id}`);
      set((state) => ({
        cars: state.cars.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error deleting rental car:', error);
      set({ error: 'Fehler beim Löschen des Mietwagens', isLoading: false });
      throw error;
    }
  },
}));
