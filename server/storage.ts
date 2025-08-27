import { 
  User, Agent, Transaction, Alert, WalletProfile, Report, AuditLog,
  getConnectionStatus, getCollectionStats
} from './services/mongoose';
import type { 
  IUser, IAgent, ITransaction, IAlert, IWalletProfile, IReport, IAuditLog,
  CreateUser, CreateTransaction, CreateAlert, UpdateAgent
} from '@shared/schema';
import bcrypt from 'bcrypt';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  createUser(user: CreateUser): Promise<IUser>;
  validateUser(username: string, password: string): Promise<IUser | null>;

  // Agent methods
  getAgents(): Promise<IAgent[]>;
  getAgent(id: string): Promise<IAgent | null>;
  updateAgent(id: string, updates: UpdateAgent): Promise<IAgent | null>;
  
  // Transaction methods
  getTransactions(limit?: number, offset?: number): Promise<ITransaction[]>;
  getTransaction(id: string): Promise<ITransaction | null>;
  getTransactionByHash(hash: string): Promise<ITransaction | null>;
  createTransaction(transaction: CreateTransaction): Promise<ITransaction>;
  getHighRiskTransactions(limit?: number): Promise<ITransaction[]>;
  getTransactionsByAddress(address: string, limit?: number): Promise<ITransaction[]>;

  // Alert methods
  getAlerts(limit?: number, offset?: number): Promise<IAlert[]>;
  getAlert(id: string): Promise<IAlert | null>;
  createAlert(alert: CreateAlert): Promise<IAlert>;
  updateAlert(id: string, updates: Partial<IAlert>): Promise<IAlert | null>;
  getOpenAlerts(): Promise<IAlert[]>;

  // Wallet Profile methods
  getWalletProfiles(limit?: number, offset?: number): Promise<IWalletProfile[]>;
  getWalletProfile(address: string): Promise<IWalletProfile | null>;
  getHighRiskWallets(limit?: number): Promise<IWalletProfile[]>;

  // Report methods
  getReports(limit?: number, offset?: number): Promise<IReport[]>;
  getReport(id: string): Promise<IReport | null>;
  createReport(report: Partial<IReport>): Promise<IReport>;
  updateReport(id: string, updates: Partial<IReport>): Promise<IReport | null>;

  // Audit Log methods
  getAuditLogs(limit?: number, offset?: number): Promise<IAuditLog[]>;
  createAuditLog(log: Partial<IAuditLog>): Promise<IAuditLog>;

  // System methods
  getSystemStats(): Promise<any>;
  getConnectionStatus(): Promise<any>;
}

export class MongoStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password').lean();
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username }).lean();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).lean();
  }

  async createUser(userData: CreateUser): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await User.create({
      ...userData,
      password: hashedPassword
    });

    return user.toObject();
  }

  async validateUser(username: string, password: string): Promise<IUser | null> {
    const user = await User.findOne({ username });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as IUser;
  }

  // Agent methods
  async getAgents(): Promise<IAgent[]> {
    return await Agent.find().sort({ name: 1 }).lean();
  }

  async getAgent(id: string): Promise<IAgent | null> {
    return await Agent.findById(id).lean();
  }

  async updateAgent(id: string, updates: UpdateAgent): Promise<IAgent | null> {
    return await Agent.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  // Transaction methods
  async getTransactions(limit = 50, offset = 0): Promise<ITransaction[]> {
    return await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async getTransaction(id: string): Promise<ITransaction | null> {
    return await Transaction.findById(id).lean();
  }

  async getTransactionByHash(hash: string): Promise<ITransaction | null> {
    return await Transaction.findOne({ hash }).lean();
  }

  async createTransaction(transactionData: CreateTransaction): Promise<ITransaction> {
    const transaction = await Transaction.create(transactionData);
    return transaction.toObject();
  }

  async getHighRiskTransactions(limit = 20): Promise<ITransaction[]> {
    return await Transaction.find({ riskScore: { $gte: 7 } })
      .sort({ riskScore: -1, timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async getTransactionsByAddress(address: string, limit = 50): Promise<ITransaction[]> {
    return await Transaction.find({
      $or: [{ fromAddress: address }, { toAddress: address }]
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  // Alert methods
  async getAlerts(limit = 50, offset = 0): Promise<IAlert[]> {
    return await Alert.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async getAlert(id: string): Promise<IAlert | null> {
    return await Alert.findById(id).lean();
  }

  async createAlert(alertData: CreateAlert): Promise<IAlert> {
    const alert = await Alert.create(alertData);
    return alert.toObject();
  }

  async updateAlert(id: string, updates: Partial<IAlert>): Promise<IAlert | null> {
    return await Alert.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  async getOpenAlerts(): Promise<IAlert[]> {
    return await Alert.find({ status: 'open' })
      .sort({ severity: 1, createdAt: -1 })
      .lean();
  }

  // Wallet Profile methods
  async getWalletProfiles(limit = 50, offset = 0): Promise<IWalletProfile[]> {
    return await WalletProfile.find()
      .sort({ averageRiskScore: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async getWalletProfile(address: string): Promise<IWalletProfile | null> {
    return await WalletProfile.findOne({ address }).lean();
  }

  async getHighRiskWallets(limit = 20): Promise<IWalletProfile[]> {
    return await WalletProfile.find({ 
      riskLevel: { $in: ['high', 'critical'] } 
    })
      .sort({ averageRiskScore: -1 })
      .limit(limit)
      .lean();
  }

  // Report methods
  async getReports(limit = 50, offset = 0): Promise<IReport[]> {
    return await Report.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async getReport(id: string): Promise<IReport | null> {
    return await Report.findById(id).lean();
  }

  async createReport(reportData: Partial<IReport>): Promise<IReport> {
    const report = await Report.create(reportData);
    return report.toObject();
  }

  async updateReport(id: string, updates: Partial<IReport>): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  // Audit Log methods
  async getAuditLogs(limit = 100, offset = 0): Promise<IAuditLog[]> {
    return await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async createAuditLog(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    const auditLog = await AuditLog.create({
      ...logData,
      timestamp: new Date()
    });
    return auditLog.toObject();
  }

  // System methods
  async getSystemStats(): Promise<any> {
    const [collections, recentTransactions, openAlerts, processingReports] = await Promise.all([
      getCollectionStats(),
      Transaction.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Alert.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'generating' })
    ]);

    const avgRiskScore = await Transaction.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$riskScore' } } }
    ]);

    return {
      collections,
      stats: {
        transactionsMonitored: collections.transactions,
        recentTransactions,
        activeAlerts: openAlerts,
        processingReports,
        avgRiskScore: avgRiskScore[0]?.avgScore || 0
      }
    };
  }

  async getConnectionStatus(): Promise<any> {
    return getConnectionStatus();
  }
}

export const storage = new MongoStorage();
