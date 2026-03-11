import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');

class SocketService {
    private static instance: SocketService;
    public socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(token?: string): Socket {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                auth: token ? { token } : {},
                transports: ['websocket', 'polling'],
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });
        } else {
            this.socket.auth = token ? { token } : {};
        }
        return this.socket;
    }

    public connect(): void {
        if (this.socket) {
            this.socket.connect();
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export default SocketService.getInstance();
