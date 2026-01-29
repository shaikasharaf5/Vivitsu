import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
}

interface SocketContextType {
  isConnected: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulate WebSocket connection
    const timer = setTimeout(() => setIsConnected(true), 1000);
    
    // Simulate periodic notifications
    const notifInterval = setInterval(() => {
      const messages = [
        'New issue reported in your area',
        'Issue #1234 has been resolved',
        'A worker has been assigned to your issue',
        'Inspection completed for issue #5678',
      ];
      
      const randomNotif: Notification = {
        id: Date.now().toString(),
        message: messages[Math.floor(Math.random() * messages.length)],
        type: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as 'info' | 'success' | 'warning',
        timestamp: new Date(),
      };
      
      setNotifications(prev => [randomNotif, ...prev].slice(0, 10));
    }, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(notifInterval);
    };
  }, []);

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ isConnected, notifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
