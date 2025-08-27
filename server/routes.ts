import type { Express } from "express";
import { createServer, type Server } from "http";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { storage } from "./storage";
import { connectToMongoDB } from './services/mongoose';
import { agentManager } from './services/agents';
import { blockchainService } from './services/blockchain';
import { wsManager, broadcastStatsUpdate } from './services/websocket';
import { createUserSchema, createTransactionSchema, createAlertSchema, updateAgentSchema } from '@shared/schema';
import { z } from 'zod';

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize MongoDB connection
  await connectToMongoDB();

  // Session configuration with MongoDB store
  app.use(session({
    secret: process.env.SESSION_SECRET || 'crypto-fraud-detection-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || process.env.DATABASE_URL,
      touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize WebSocket server
  wsManager.initialize(httpServer);

  // Start services
  await agentManager.start();
  await blockchainService.startMonitoring();

  // Broadcast system stats every 10 seconds
  setInterval(async () => {
    try {
      const stats = await storage.getSystemStats();
      broadcastStatsUpdate(stats);
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }, 10000);

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user._id.toString();
      req.session.username = user.username;

      // Log login
      await storage.createAuditLog({
        userId: user._id.toString(),
        username: user.username,
        action: 'login',
        resource: 'authentication',
        details: { method: 'password' },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.session.userId = user._id.toString();
      req.session.username = user.username;

      res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid user data', details: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    const username = req.session.username;
    const userId = req.session.userId;

    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }

      // Log logout
      storage.createAuditLog({
        userId,
        username,
        action: 'logout',
        resource: 'authentication',
        details: {},
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // System routes
  app.get('/api/system/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/system/status', requireAuth, async (req, res) => {
    try {
      const status = await storage.getConnectionStatus();
      res.json({
        database: status,
        websocket: {
          connected: true,
          clients: wsManager.getClientCount()
        },
        agents: {
          running: true,
          count: (await storage.getAgents()).length
        }
      });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Agent routes
  app.get('/api/agents', requireAuth, async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error('Get agents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/agents/:id', requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error) {
      console.error('Get agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/agents/:id', requireAuth, async (req, res) => {
    try {
      const updates = updateAgentSchema.parse(req.body);
      const agent = await agentManager.updateAgentStatus(req.params.id, updates);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Log the update
      await storage.createAuditLog({
        userId: req.session.userId,
        username: req.session.username,
        action: 'update',
        resource: 'agent',
        resourceId: req.params.id,
        details: updates,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid agent data', details: error.errors });
      }
      console.error('Update agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Transaction routes
  app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const transactions = await storage.getTransactions(limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/transactions/high-risk', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await storage.getHighRiskTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('Get high-risk transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/wallets/:address/transactions', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getTransactionsByAddress(req.params.address, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Alert routes
  app.get('/api/alerts', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const alerts = await storage.getAlerts(limit, offset);
      res.json(alerts);
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/alerts/open', requireAuth, async (req, res) => {
    try {
      const alerts = await storage.getOpenAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Get open alerts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/alerts', requireAuth, async (req, res) => {
    try {
      const alertData = createAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);

      // Log alert creation
      await storage.createAuditLog({
        userId: req.session.userId,
        username: req.session.username,
        action: 'create',
        resource: 'alert',
        resourceId: alert._id.toString(),
        details: alertData,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid alert data', details: error.errors });
      }
      console.error('Create alert error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/alerts/:id', requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const alert = await storage.updateAlert(req.params.id, updates);

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Log alert update
      await storage.createAuditLog({
        userId: req.session.userId,
        username: req.session.username,
        action: 'update',
        resource: 'alert',
        resourceId: req.params.id,
        details: updates,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json(alert);
    } catch (error) {
      console.error('Update alert error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Wallet routes
  app.get('/api/wallets', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const wallets = await storage.getWalletProfiles(limit, offset);
      res.json(wallets);
    } catch (error) {
      console.error('Get wallets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/wallets/high-risk', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const wallets = await storage.getHighRiskWallets(limit);
      res.json(wallets);
    } catch (error) {
      console.error('Get high-risk wallets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/wallets/:address', requireAuth, async (req, res) => {
    try {
      const wallet = await storage.getWalletProfile(req.params.address);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      res.json(wallet);
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Report routes
  app.get('/api/reports', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const reports = await storage.getReports(limit, offset);
      res.json(reports);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/reports', requireAuth, async (req, res) => {
    try {
      const reportData = {
        ...req.body,
        generatedBy: req.session.username,
        status: 'scheduled'
      };
      
      const report = await storage.createReport(reportData);

      // Log report creation
      await storage.createAuditLog({
        userId: req.session.userId,
        username: req.session.username,
        action: 'create',
        resource: 'report',
        resourceId: report._id.toString(),
        details: reportData,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || ''
      });

      res.json(report);
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Audit log routes
  app.get('/api/audit-logs', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}
