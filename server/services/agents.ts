import { Agent, Transaction, Alert, WalletProfile, Report } from './mongoose';
import { broadcastAgentUpdate } from './websocket';
import type { IAgent } from '@shared/schema';

class AgentManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  async start() {
    if (this.running) return;
    this.running = true;
    
    console.log('Starting agent manager...');
    
    // Get all active agents
    const agents = await Agent.find({ status: 'active' });
    
    for (const agent of agents) {
      this.scheduleAgent(agent);
    }
    
    console.log(`Scheduled ${agents.length} agents`);
  }

  async stop() {
    this.running = false;
    
    // Clear all intervals
    for (const [agentId, interval] of this.intervals) {
      clearTimeout(interval);
      this.intervals.delete(agentId);
    }
    
    console.log('Agent manager stopped');
  }

  private scheduleAgent(agent: IAgent) {
    const agentId = agent._id.toString();
    
    // Clear existing interval if any
    if (this.intervals.has(agentId)) {
      clearTimeout(this.intervals.get(agentId)!);
    }
    
    const executeAgent = async () => {
      try {
        await this.executeAgent(agent);
        
        // Schedule next run
        if (this.running) {
          const timeout = setTimeout(executeAgent, (agent.intervalSeconds || 30) * 1000);
          this.intervals.set(agentId, timeout);
        }
      } catch (error) {
        console.error(`Error executing agent ${agent.name}:`, error);
        
        // Mark agent as error and try again later
        await Agent.findByIdAndUpdate(agentId, {
          status: 'error',
          progress: 0
        });
        
        broadcastAgentUpdate({
          id: agentId,
          status: 'error',
          progress: 0,
          lastRun: new Date()
        });
        
        if (this.running) {
          const timeout = setTimeout(executeAgent, (agent.intervalSeconds || 30) * 2000); // Double interval on error
          this.intervals.set(agentId, timeout);
        }
      }
    };

    // Start immediately or schedule for next run
    const now = new Date();
    const delay = agent.nextRun && agent.nextRun > now 
      ? agent.nextRun.getTime() - now.getTime() 
      : 0;
    
    const timeout = setTimeout(executeAgent, delay);
    this.intervals.set(agentId, timeout);
  }

  private async executeAgent(agent: IAgent) {
    const agentId = agent._id.toString();
    const now = new Date();
    
    // Update agent status to processing
    const nextRunTime = new Date(now.getTime() + (agent.intervalSeconds || 30) * 1000);
    
    await Agent.findByIdAndUpdate(agentId, {
      status: 'processing',
      progress: 0,
      lastRun: now,
      nextRun: nextRunTime
    });

    broadcastAgentUpdate({
      id: agentId,
      status: 'processing',
      progress: 0,
      lastRun: now
    });

    // Simulate processing with progress updates
    const progressUpdates = [10, 25, 40, 55, 70, 85, 95, 100];
    const stepDelay = ((agent.intervalSeconds || 30) * 1000) / progressUpdates.length;

    for (let i = 0; i < progressUpdates.length; i++) {
      const progress = progressUpdates[i];
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      
      // Update progress
      await Agent.findByIdAndUpdate(agentId, { progress });
      
      broadcastAgentUpdate({
        id: agentId,
        status: 'processing',
        progress,
        lastRun: now
      });

      // Execute agent-specific logic at certain progress points
      if (progress === 50) {
        await this.executeAgentLogic(agent);
      }
    }

    // Mark as active and reset progress
    await Agent.findByIdAndUpdate(agentId, {
      status: 'active',
      progress: 0
    });

    broadcastAgentUpdate({
      id: agentId,
      status: 'active',
      progress: 0,
      lastRun: now
    });
  }

  private async executeAgentLogic(agent: IAgent) {
    switch (agent.type) {
      case 'transaction_monitor':
        await this.executeTransactionMonitor(agent);
        break;
      case 'behavior_analysis':
        await this.executeBehaviorAnalysis(agent);
        break;
      case 'risk_scoring':
        await this.executeRiskScoring(agent);
        break;
      case 'alerting':
        await this.executeAlerting(agent);
        break;
      case 'reporting':
        await this.executeReporting(agent);
        break;
    }
  }

  private async executeTransactionMonitor(agent: IAgent) {
    // Simulate blockchain monitoring by creating some transactions
    const networks = agent.config.networks || ['ethereum'];
    const batchSize = agent.config.batchSize || 100;

    // In real implementation, this would fetch from blockchain APIs
    console.log(`Transaction Monitor: Monitoring ${networks.join(', ')} networks for new transactions`);
  }

  private async executeBehaviorAnalysis(agent: IAgent) {
    // Analyze recent transactions for suspicious patterns
    const lookbackHours = agent.config.lookbackHours || 24;
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    const suspiciousTransactions = await Transaction.find({
      timestamp: { $gte: cutoffTime },
      riskScore: { $gte: 7 }
    }).limit(10);

    console.log(`Behavior Analysis: Analyzed ${suspiciousTransactions.length} high-risk transactions`);

    // Create alerts for suspicious patterns
    for (const tx of suspiciousTransactions) {
      const existingAlert = await Alert.findOne({ transactionHash: tx.hash });
      
      if (!existingAlert && tx.riskScore >= 8) {
        await Alert.create({
          title: 'High Risk Transaction Pattern',
          description: `Transaction ${tx.hash} shows suspicious behavioral patterns`,
          severity: tx.riskScore >= 9 ? 'critical' : 'high',
          type: 'pattern_analysis',
          transactionHash: tx.hash,
          walletAddress: tx.fromAddress,
          riskScore: tx.riskScore,
          metadata: {
            amount: tx.amount,
            network: tx.network,
            analysisTimestamp: new Date()
          }
        });
      }
    }
  }

  private async executeRiskScoring(agent: IAgent) {
    // Update risk scores for recent transactions
    const unanalyzedTransactions = await Transaction.find({
      analyzedAt: { $exists: false },
      riskScore: { $lte: 0 }
    }).limit(50);

    console.log(`Risk Scoring: Processing ${unanalyzedTransactions.length} transactions`);

    for (const tx of unanalyzedTransactions) {
      // Simulate ML-based risk scoring
      const riskScore = this.calculateRiskScore(tx);
      
      await Transaction.findByIdAndUpdate(tx._id, {
        riskScore,
        analyzedAt: new Date()
      });

      // Update wallet profile
      await this.updateWalletProfile(tx.fromAddress, tx);
    }
  }

  private calculateRiskScore(transaction: any): number {
    // Simulate risk scoring algorithm
    let score = 0;
    
    // High amounts increase risk
    const amount = parseFloat(transaction.amount);
    if (amount > 100000) score += 3;
    else if (amount > 50000) score += 2;
    else if (amount > 10000) score += 1;
    
    // Night time transactions increase risk slightly
    const hour = transaction.timestamp.getHours();
    if (hour >= 22 || hour <= 4) score += 1;
    
    // Add some randomness for simulation
    score += Math.random() * 2;
    
    return Math.min(10, Math.max(0, score));
  }

  private async updateWalletProfile(address: string, transaction: any) {
    const existingProfile = await WalletProfile.findOne({ address });
    
    if (existingProfile) {
      const totalTransactions = existingProfile.totalTransactions + 1;
      const totalValue = (parseFloat(existingProfile.totalValue) + parseFloat(transaction.amount)).toString();
      const averageRiskScore = (existingProfile.averageRiskScore * existingProfile.totalTransactions + transaction.riskScore) / totalTransactions;
      
      await WalletProfile.findByIdAndUpdate(existingProfile._id, {
        totalTransactions,
        totalValue,
        averageRiskScore,
        lastSeen: transaction.timestamp,
        riskLevel: averageRiskScore >= 8 ? 'critical' : averageRiskScore >= 6 ? 'high' : averageRiskScore >= 4 ? 'medium' : 'low'
      });
    } else {
      await WalletProfile.create({
        address,
        totalTransactions: 1,
        totalValue: transaction.amount,
        averageRiskScore: transaction.riskScore,
        firstSeen: transaction.timestamp,
        lastSeen: transaction.timestamp,
        riskLevel: transaction.riskScore >= 8 ? 'critical' : transaction.riskScore >= 6 ? 'high' : transaction.riskScore >= 4 ? 'medium' : 'low',
        behaviorPatterns: {
          timePattern: { [transaction.timestamp.getHours()]: 1 },
          amountPattern: { range: this.getAmountRange(parseFloat(transaction.amount)) }
        }
      });
    }
  }

  private getAmountRange(amount: number): string {
    if (amount >= 100000) return 'very_high';
    if (amount >= 50000) return 'high';
    if (amount >= 10000) return 'medium';
    if (amount >= 1000) return 'low';
    return 'very_low';
  }

  private async executeAlerting(agent: IAgent) {
    // Process open alerts and create new ones based on thresholds
    const openAlerts = await Alert.find({ status: 'open' }).limit(20);
    
    console.log(`Alerting: Processing ${openAlerts.length} open alerts`);

    // Check for new high-risk transactions that need alerts
    const highRiskTransactions = await Transaction.find({
      riskScore: { $gte: agent.config.severityThreshold === 'high' ? 8 : 6 },
      analyzedAt: { $exists: true }
    }).limit(10);

    for (const tx of highRiskTransactions) {
      const existingAlert = await Alert.findOne({ transactionHash: tx.hash });
      
      if (!existingAlert) {
        await Alert.create({
          title: 'Risk Threshold Exceeded',
          description: `Transaction ${tx.hash} exceeded risk threshold with score ${tx.riskScore}`,
          severity: tx.riskScore >= 9 ? 'critical' : tx.riskScore >= 7 ? 'high' : 'medium',
          type: 'risk_threshold',
          transactionHash: tx.hash,
          walletAddress: tx.fromAddress,
          riskScore: tx.riskScore,
          metadata: {
            amount: tx.amount,
            network: tx.network,
            threshold: agent.config.severityThreshold
          }
        });
      }
    }
  }

  private async executeReporting(agent: IAgent) {
    // Generate scheduled reports
    const pendingReports = await Report.find({ 
      status: 'scheduled',
      scheduledFor: { $lte: new Date() }
    }).limit(5);

    console.log(`Reporting: Generating ${pendingReports.length} scheduled reports`);

    for (const report of pendingReports) {
      await this.generateReport(report);
    }

    // Auto-generate daily summary if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailySummaryExists = await Report.findOne({
      type: 'daily_summary',
      createdAt: { $gte: today }
    });

    if (!dailySummaryExists) {
      await Report.create({
        title: `Daily Summary - ${today.toISOString().split('T')[0]}`,
        type: 'daily_summary',
        status: 'generating',
        format: 'pdf',
        parameters: { date: today.toISOString() },
        generatedBy: 'system'
      });
    }
  }

  private async generateReport(report: any) {
    // Update report status to generating
    await Report.findByIdAndUpdate(report._id, {
      status: 'generating',
      progress: 0
    });

    // Simulate report generation progress
    const progressSteps = [20, 40, 60, 80, 100];
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await Report.findByIdAndUpdate(report._id, { progress });
    }

    // Mark as completed
    await Report.findByIdAndUpdate(report._id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      filePath: `/reports/${report.type}_${Date.now()}.${report.format}`
    });
  }

  async updateAgentStatus(agentId: string, updates: Partial<IAgent>) {
    const agent = await Agent.findByIdAndUpdate(agentId, updates, { new: true });
    
    if (agent) {
      broadcastAgentUpdate({
        id: agentId,
        status: agent.status,
        progress: agent.progress,
        lastRun: agent.lastRun
      });

      // Reschedule if status changed
      if (updates.status === 'active' && !this.intervals.has(agentId)) {
        this.scheduleAgent(agent);
      } else if (updates.status === 'inactive' && this.intervals.has(agentId)) {
        clearTimeout(this.intervals.get(agentId)!);
        this.intervals.delete(agentId);
      }
    }

    return agent;
  }
}

export const agentManager = new AgentManager();
