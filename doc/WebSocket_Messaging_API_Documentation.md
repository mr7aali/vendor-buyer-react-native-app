Read Receipts 

Marking Messages as Read 

Event: mark_read 

Mark a message as read by emitting the 'mark_read' event with the message ID. 

Request Payload 

A string containing the message ID. 

Example 

socket.emit('mark_read', 'message-id-123', (response) => { 

  console.log('Message marked as read:', response); 

}); 

Receiving Read Receipts 

Event: message_read 

When someone reads your message, you'll receive a 'message_read' event. 

Payload 

Field 

Type 

Description 

messageId 

string 

ID of the message that was read 

 

Example 

socket.on('message_read', (data) => { 

  console.log('Message read:', data.messageId); 

 

  // Update UI to show read receipt 

  updateMessageStatus(data.messageId, 'read'); 

}); 

 

Complete Integration Example 

React/TypeScript Example 

import { useEffect, useState } from 'react'; 

import { io, Socket } from 'socket.io-client'; 

 

interface Message { 

  id: string; 

  senderId: string; 

  receiverId: string; 

  messageText: string; 

  isRead: boolean; 

  createdAt: string; 

} 

 

export function useWebSocket(token: string, currentUserId: string) { 

  const [socket, setSocket] = useState<Socket | null>(null); 

  const [messages, setMessages] = useState<Message[]>([]); 

  const [isConnected, setIsConnected] = useState(false); 

 

  useEffect(() => { 

    const newSocket = io(process.env.REACT_APP_WS_URL!, { 

      auth: { token } 

    }); 

 

    // Connection events 

    newSocket.on('connect', () => { 

      console.log('Connected to WebSocket'); 

      setIsConnected(true); 

    }); 

 

    newSocket.on('disconnect', () => { 

      console.log('Disconnected from WebSocket'); 

      setIsConnected(false); 

    }); 

 

    newSocket.on('connect_error', (error) => { 

      console.error('Connection error:', error); 

      setIsConnected(false); 

    }); 

 

    // Message events 

    newSocket.on('new_message', (message: Message) => { 

      setMessages(prev => [...prev, message]); 

 

      // Auto-mark as read if receiver and chat is active 

      if (message.receiverId === currentUserId) { 

        newSocket.emit('mark_read', message.id); 

      } 

    }); 

 

    newSocket.on('message_read', ({ messageId }) => { 

      setMessages(prev => 

        prev.map(msg => 

          msg.id === messageId ? { ...msg, isRead: true } : msg 

        ) 

      ); 

    }); 

 

    setSocket(newSocket); 

 

    return () => { 

      newSocket.close(); 

    }; 

  }, [token, currentUserId]); 

 

  const sendMessage = (receiverId: string, messageText: string) => { 

    if (!socket || !isConnected) { 

      console.error('Socket not connected'); 

      return; 

    } 

 

    socket.emit('send_message', { receiverId, messageText }); 

  }; 

 

  const markAsRead = (messageId: string) => { 

    if (!socket || !isConnected) return; 

    socket.emit('mark_read', messageId); 

  }; 

 

  return { 

    socket, 

    messages, 

    isConnected, 

    sendMessage, 

    markAsRead 

  }; 

} 

 

Error Handling 

Common Errors 

Error Type 

Cause 

Solution 

Connection Error 

Invalid or missing JWT token 

Ensure valid token is provided in auth object 

Forbidden 

Token verification failed 

Check token format and validity 

Disconnect 

Authentication failure 

Reconnect with valid credentials 

Timeout 

Network issues 

Implement automatic reconnection logic 

 

Reconnection Strategy 

const socket = io(SERVER_URL, { 

  auth: { token }, 

  reconnection: true, 

  reconnectionAttempts: 5, 

  reconnectionDelay: 1000, 

  reconnectionDelayMax: 5000, 

  timeout: 20000 

}); 

Best Practices 

Token Management: Store JWT tokens securely and refresh before expiration 

Connection Lifecycle: Always clean up socket connections when components unmount 

Message Queueing: Queue messages when offline and send when reconnected 

Read Receipts: Only mark messages as read when the user actually views them 

Error Handling: Implement comprehensive error handling and user feedback 

UI Updates: Use optimistic updates for better user experience 

Duplicate Prevention: Track message IDs to prevent duplicate displays 

API Reference Summary 

Events to Emit (Client → Server) 

Event 

Payload 

Description 

send_message 

{ receiverId, messageText } 

Send a message to another user 

mark_read 

messageId (string) 

Mark a message as read 

 

Events to Listen (Server → Client) 

Event 

Payload 

Description 

connect 

none 

Successfully connected to server 

disconnect 

reason (string) 

Disconnected from server 

connect_error 

error 

Connection/authentication error 

new_message 

Message object 

New message received 

message_read 

{ messageId } 

Message was read by recipient 

 

Support & Additional Resources 

For additional assistance or questions about the WebSocket messaging API, please refer to: 

Socket.IO Documentation: https://socket.io/docs/v4/ 

Contact the backend development team for server-side issues 

Check server logs for detailed debugging information 