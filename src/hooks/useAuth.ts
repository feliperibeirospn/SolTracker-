import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  masterHash: string | null;
  login: (password: string) => boolean;
  setMasterPassword: (password: string) => void;
  logout: () => void;
}

import { CryptoService } from '@/services/cryptoService';

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  masterHash: localStorage.getItem('master_hash'),

  setMasterPassword: (password: string) => {
    const hash = CryptoService.hashPassword(password);
    localStorage.setItem('master_hash', hash);
    set({ masterHash: hash, isAuthenticated: true });
  },

  login: (password: string) => {
    const { masterHash } = get();
    if (masterHash && CryptoService.verifyPassword(password, masterHash)) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  }
}));
