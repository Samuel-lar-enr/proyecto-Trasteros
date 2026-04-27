import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/api';
import type { LoginRequest, User } from '../types/apiTypes';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (data: LoginRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const hydrateUser = useCallback(async () => {
    // Si la variable de entorno indica que no requiere autenticación
    const requireAuth = import.meta.env.VITE_REQUIRE_AUTH;
    
    if (requireAuth === 'false') {
      // En modo sin auth, marcar como autenticado con usuario dummy
      setUser({
        id: 1,
        email: 'dev@example.com',
        name: 'Usuario Desarrollo',
        userType: 'PARTICULAR',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsBootstrapping(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsBootstrapping(false);
      return;
    }

    try {
      const me = await authService.getMe();
      setUser(me.user);
    } catch {
      authService.logout();
      setUser(null);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  const login = useCallback(async (data: LoginRequest) => {
    await authService.login(data);
    const me = await authService.getMe();
    setUser(me.user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await authService.googleLogin({ idToken });
    const me = await authService.getMe();
    setUser(me.user);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, isBootstrapping, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};