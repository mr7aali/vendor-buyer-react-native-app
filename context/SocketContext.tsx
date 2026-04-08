import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Socket } from 'socket.io-client';
import socketService from '../services/socket';
import { RootState } from '../store/store';

interface SocketContextData {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const resolveChatUserId = (entity: any): string | null => {
    const value =
        entity?.userId ??
        entity?.buyer?.userId ??
        entity?.vendor?.userId ??
        entity?.user?.userId ??
        entity?.id ??
        entity?._id ??
        null;
    return value === undefined || value === null ? null : String(value);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const token = useSelector((state: RootState) => state.auth.accessToken);
    const user = useSelector((state: RootState) => state.auth.user);
    const roomIds = useMemo(() => Array.from(
        new Set(
            [
                resolveChatUserId(user),
                resolveChatUserId((user as any)?.buyer),
                resolveChatUserId((user as any)?.vendor),
                user?.id,
                (user as any)?._id,
            ]
                .filter((v) => v !== undefined && v !== null)
                .map((v) => String(v))
        )
    ), [user]);
    const roomKey = roomIds.join('|');

    useEffect(() => {
        if (!token) {
            socketService.disconnect();
            setIsConnected(false);
            return;
        }

        const socket = socketService.init(token);

        const joinRooms = () => {
            roomIds.forEach((id) => socket.emit('join_room', `user:${id}`));
        };

        const onConnect = () => {
            console.log("Socket connected:", socket.id);
            setIsConnected(true);
            joinRooms();
        };

        const onDisconnect = () => setIsConnected(false);
        const onError = (err: any) => console.error("Socket error:", err);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onError);
        socket.on('error', onError);

        if (!socket.connected) {
            socket.connect();
        } else {
            setIsConnected(true);
            joinRooms();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onError);
            socket.off('error', onError);
        };
    }, [token, roomIds, roomKey]);

    return (
        <SocketContext.Provider value={{ socket: socketService.getSocket(), isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
