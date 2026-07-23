import { create } from 'zustand';
import { CryptoService } from '@/services/cryptoService';

interface AuthState {
  isAuthenticated: boolean;
  masterHash: string | null;
  userEmail: string | null;
  // Guardamos a senha em memória apenas durante a sessão ativa para permitir o auto-sync
  // Sem salvar no localStorage por segurança
  sessionPassword: string | null;
  login: (email: string, password: string) => boolean;
  setMasterPassword: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  masterHash: localStorage.getItem('master_hash'),
  userEmail: localStorage.getItem('user_email'),
  sessionPassword: null,

  setMasterPassword: (email: string, password: string) => {
    const hash = CryptoService.hashPassword(email.toLowerCase() + password);
    localStorage.setItem('master_hash', hash);
    localStorage.setItem('user_email', email.toLowerCase());
    set({
      masterHash: hash,
      userEmail: email.toLowerCase(),
      isAuthenticated: true,
      sessionPassword: password
    });
  },

  login: (email: string, password: string) => {
    const { masterHash } = get();
    const hashToVerify = CryptoService.hashPassword(email.toLowerCase() + password);
    if (masterHash === hashToVerify) {
      set({
        isAuthenticated: true,
        userEmail: email.toLowerCase(),
        sessionPassword: password
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, sessionPassword: null });
  }
}));
