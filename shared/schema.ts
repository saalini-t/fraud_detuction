import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'analyst' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
}, { timestamps: true });

// Agent Schema
export interface IAgent extends Document {
  name: string;
  type: 'transaction_monitor' | 'behavior_analysis' | 'risk_scoring' | 'alerting' | 'reporting';
  status: 'active' | 'inactive' | 'processing' | 'error';
  progress: number;
  lastRun: Date;
  nextRun: Date;
  intervalSeconds: number;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['transaction_monitor', 'behavior_analysis', 'risk_scoring', 'alerting', 'reporting']
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'processing', 'error'], 
    default: 'inactive' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  lastRun: { type: Date },
  nextRun: { type: Date },
  intervalSeconds: { type: Number, required: true },
  config: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Transaction Schema
export interface ITransaction extends Document {
  hash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasPrice: string;
  gasUsed: number;
  timestamp: Date;
  riskScore: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  analyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = new Schema<ITransaction>({
  hash: { type: String, required: true, unique: true, index: true },
  blockNumber: { type: Number, required: true },
  fromAddress: { type: String, required: true, index: true },
  toAddress: { type: String, required: true, index: true },
  amount: { type: String, required: true },
  gasPrice: { type: String, required: true },
  gasUsed: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: -1 },
  riskScore: { type: Number, default: 0, min: 0, max: 10, index: -1 },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  network: { type: String, required: true },
  analyzedAt: { type: Date },
}, { timestamps: true });

// Alert Schema
export interface IAlert extends Document {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'fraud_detection' | 'pattern_analysis' | 'risk_threshold' | 'bot_activity' | 'compliance';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  transactionHash?: string;
  walletAddress?: string;
  riskScore?: number;
  metadata: Record<string, any>;
  assignedTo?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const AlertSchema = new Schema<IAlert>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    index: 1
  },
  type: { 
    type: String, 
    required: true,
    enum: ['fraud_detection', 'pattern_analysis', 'risk_threshold', 'bot_activity', 'compliance']
  },
  status: { 
    type: String, 
    enum: ['open', 'investigating', 'resolved', 'false_positive'], 
    default: 'open',
    index: 1
  },
  transactionHash: { type: String, index: true },
  walletAddress: { type: String, index: true },
  riskScore: { type: Number, min: 0, max: 10 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  assignedTo: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

// Wallet Profile Schema
export interface IWalletProfile extends Document {
  address: string;
  totalTransactions: number;
  totalValue: string;
  averageRiskScore: number;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  behaviorPatterns: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const WalletProfileSchema = new Schema<IWalletProfile>({
  address: { type: String, required: true, unique: true, index: true },
  totalTransactions: { type: Number, default: 0 },
  totalValue: { type: String, default: '0' },
  averageRiskScore: { type: Number, default: 0, index: -1 },
  firstSeen: { type: Date, required: true },
  lastSeen: { type: Date, required: true },
  tags: [{ type: String }],
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  behaviorPatterns: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Report Schema
export interface IReport extends Document {
  title: string;
  type: 'daily_summary' | 'risk_analysis' | 'compliance' | 'audit_trail' | 'custom';
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  progress: number;
  filePath?: string;
  format: 'pdf' | 'excel' | 'json' | 'csv';
  parameters: Record<string, any>;
  generatedBy: string;
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = new Schema<IReport>({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['daily_summary', 'risk_analysis', 'compliance', 'audit_trail', 'custom']
  },
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed', 'scheduled'], 
    default: 'scheduled' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  filePath: { type: String },
  format: { type: String, enum: ['pdf', 'excel', 'json', 'csv'], required: true },
  parameters: { type: Schema.Types.Mixed, default: {} },
  generatedBy: { type: String, required: true },
  scheduledFor: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

// Audit Log Schema
export interface IAuditLog extends Document {
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  createdAt: Date;
}

export const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  action: { type: String, required: true, index: 1 },
  resource: { type: String, required: true },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: -1 },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Zod validation schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
});

export const createTransactionSchema = z.object({
  hash: z.string().min(1),
  blockNumber: z.number().positive(),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  amount: z.string(),
  gasPrice: z.string(),
  gasUsed: z.number().positive(),
  timestamp: z.date(),
  network: z.string(),
});

export const createAlertSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum(['fraud_detection', 'pattern_analysis', 'risk_threshold', 'bot_activity', 'compliance']),
  transactionHash: z.string().optional(),
  walletAddress: z.string().optional(),
  riskScore: z.number().min(0).max(10).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateAgentSchema = z.object({
  status: z.enum(['active', 'inactive', 'processing', 'error']).optional(),
  progress: z.number().min(0).max(100).optional(),
  config: z.record(z.any()).optional(),
});

// Export types
export type User = IUser;
export type Agent = IAgent;
export type Transaction = ITransaction;
export type Alert = IAlert;
export type WalletProfile = IWalletProfile;
export type Report = IReport;
export type AuditLog = IAuditLog;

export type CreateUser = z.infer<typeof createUserSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type CreateAlert = z.infer<typeof createAlertSchema>;
export type UpdateAgent = z.infer<typeof updateAgentSchema>;
