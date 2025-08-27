import mongoose from 'mongoose';
import { UserSchema, AgentSchema, TransactionSchema, AlertSchema, WalletProfileSchema, ReportSchema, AuditLogSchema } from '@shared/schema';
import type { IUser, IAgent, ITransaction, IAlert, IWalletProfile, IReport, IAuditLog } from '@shared/schema';

// MongoDB connection
export async function connectToMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
    
    // Initialize default agents if they don't exist
    await initializeDefaultAgents();
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Initialize default agents
async function initializeDefaultAgents() {
  const defaultAgents = [
    {
      name: 'Transaction Monitor',
      type: 'transaction_monitor' as const,
      intervalSeconds: 5,
      config: { batchSize: 100, networks: ['ethereum', 'bitcoin'] }
    },
    {
      name: 'Behavior Analysis',
      type: 'behavior_analysis' as const,
      intervalSeconds: 10,
      config: { lookbackHours: 24, minTransactions: 5 }
    },
    {
      name: 'Risk Scoring',
      type: 'risk_scoring' as const,
      intervalSeconds: 8,
      config: { models: ['ml_model_v1', 'rule_based'], threshold: 7.0 }
    },
    {
      name: 'Alert Processing',
      type: 'alerting' as const,
      intervalSeconds: 6,
      config: { severityThreshold: 'medium', autoResolve: false }
    },
    {
      name: 'Report Generation',
      type: 'reporting' as const,
      intervalSeconds: 30,
      config: { formats: ['pdf', 'excel'], retention: 90 }
    }
  ];

  for (const agentData of defaultAgents) {
    const existingAgent = await Agent.findOne({ type: agentData.type });
    if (!existingAgent) {
      const nextRun = new Date(Date.now() + agentData.intervalSeconds * 1000);
      await Agent.create({ ...agentData, status: 'active', nextRun });
      console.log(`Initialized agent: ${agentData.name}`);
    }
  }
}

// Model exports
export const User = mongoose.model<IUser>('User', UserSchema);
export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
export const WalletProfile = mongoose.model<IWalletProfile>('WalletProfile', WalletProfileSchema);
export const Report = mongoose.model<IReport>('Report', ReportSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Connection status
export function getConnectionStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
}

// Collection stats
export async function getCollectionStats() {
  try {
    const [
      usersCount,
      agentsCount,
      transactionsCount,
      alertsCount,
      walletsCount,
      reportsCount,
      auditLogsCount
    ] = await Promise.all([
      User.countDocuments(),
      Agent.countDocuments(),
      Transaction.countDocuments(),
      Alert.countDocuments(),
      WalletProfile.countDocuments(),
      Report.countDocuments(),
      AuditLog.countDocuments()
    ]);

    return {
      users: usersCount,
      agents: agentsCount,
      transactions: transactionsCount,
      alerts: alertsCount,
      wallet_profiles: walletsCount,
      reports: reportsCount,
      audit_logs: auditLogsCount
    };
  } catch (error) {
    console.error('Error getting collection stats:', error);
    throw error;
  }
}
