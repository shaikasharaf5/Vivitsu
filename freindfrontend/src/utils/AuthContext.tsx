import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'citizen' | 'worker' | 'inspector' | 'contractor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for different roles
const demoUsers: Record<string, User & { password: string }> = {
  'citizen@demo.com': { id: '1', email: 'citizen@demo.com', name: 'John Citizen', role: 'citizen', password: 'demo' },
  'worker@demo.com': { id: '2', email: 'worker@demo.com', name: 'Mike Worker', role: 'worker', password: 'demo' },
  'inspector@demo.com': { id: '3', email: 'inspector@demo.com', name: 'Sarah Inspector', role: 'inspector', password: 'demo' },
  'contractor@demo.com': { id: '4', email: 'contractor@demo.com', name: 'Bob Contractor', role: 'contractor', password: 'demo' },
  'admin@demo.com': { id: '5', email: 'admin@demo.com', name: 'Admin User', role: 'admin', password: 'demo' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cityfix_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const demoUser = demoUsers[email.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      const { password: _, ...userData } = demoUser;
      setUser(userData);
      localStorage.setItem('cityfix_user', JSON.stringify(userData));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
    throw new Error('Invalid credentials');
  };

  const register = async (name: string, email: string, _password: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
    };
    
    setUser(newUser);
    localStorage.setItem('cityfix_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cityfix_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
