import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

interface WebSocketMessage {
  type: 'agent_update' | 'transaction_update' | 'alert_update' | 'stats_update' | 'connection_status';
  data: any;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connection_status',
        data: { 
          connected: true, 
          timestamp: new Date().toISOString(),
          clientCount: this.clients.size
        }
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

      ws.on('pong', () => {
        // Client is alive
      });
    });

    console.log('WebSocket server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'connection_status', data: { ping: 'pong', timestamp: new Date().toISOString() } });
        break;
      case 'subscribe':
        // Handle subscription to specific data streams
        console.log('Client subscribed to:', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageString);
      } else {
        this.clients.delete(ws);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();

// Helper functions for broadcasting specific updates
export function broadcastAgentUpdate(data: {
  id: string;
  status: string;
  progress: number;
  lastRun?: Date;
}) {
  wsManager.broadcast({
    type: 'agent_update',
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}

export function broadcastTransactionUpdate(data: any) {
  wsManager.broadcast({
    type: 'transaction_update',
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}

export function broadcastAlertUpdate(data: any) {
  wsManager.broadcast({
    type: 'alert_update',
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}

export function broadcastStatsUpdate(data: any) {
  wsManager.broadcast({
    type: 'stats_update',
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}
