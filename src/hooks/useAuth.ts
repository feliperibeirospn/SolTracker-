import { create } from 'zustand';
import { CryptoService } from '@/services/cryptoService';

interface AuthState {
  isAuthenticated: boolean;
  masterHash: string | null;
  userEmail: string | null;
  login: (email: string, password: string) => boolean;
  setMasterPassword: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  masterHash: localStorage.getItem('master_hash'),
  userEmail: localStorage.getItem('user_email'),

  setMasterPassword: (email: string, password: string) => {
    const hash = CryptoService.hashPassword(email.toLowerCase() + password);
    localStorage.setItem('master_hash', hash);
    localStorage.setItem('user_email', email.toLowerCase());
    set({ masterHash: hash, userEmail: email.toLowerCase(), isAuthenticated: true });
  },

  login: (email: string, password: string) => {
    const { masterHash } = get();
    const hashToVerify = CryptoService.hashPassword(email.toLowerCase() + password);
    if (masterHash === hashToVerify) {
      set({ isAuthenticated: true, userEmail: email.toLowerCase() });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  }
}));
