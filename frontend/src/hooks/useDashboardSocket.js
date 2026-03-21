import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { ACCESS_TOKEN_NAME } from '@/config/serverApiConfig';

export const useDashboardSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const queryClient = useQueryClient();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const tenantId = currentAdmin?.tenantId;

  const refreshAllDashboardQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [queryClient]);

  useEffect(() => {
    if (!tenantId) return;

    const token = localStorage.getItem(ACCESS_TOKEN_NAME);
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/', '') || '/';

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:dashboard', { tenantId });
    });

    socket.on('dashboard:refresh', () => refreshAllDashboardQueries());
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('dashboard:refresh');
      socket.disconnect();
    };
  }, [tenantId, refreshAllDashboardQueries]);

  return { isConnected, lastRefreshed };
};
export default useDashboardSocket;
