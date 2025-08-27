import { Transaction, WalletProfile } from './mongoose';
import { broadcastTransactionUpdate } from './websocket';

interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasPrice: string;
  gasUsed: number;
  timestamp: Date;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
}

class BlockchainService {
  private networks = ['ethereum', 'bitcoin', 'polygon', 'bsc'];
  private isMonitoring = false;

  async startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    console.log('Starting blockchain monitoring...');
    
    // Simulate transaction monitoring for each network
    this.networks.forEach(network => {
      this.simulateNetworkMonitoring(network);
    });
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    console.log('Stopped blockchain monitoring');
  }

  private async simulateNetworkMonitoring(network: string) {
    if (!this.isMonitoring) return;

    try {
      // Generate simulated transactions
      const transactions = this.generateSimulatedTransactions(network, 1 + Math.floor(Math.random() * 5));
      
      for (const txData of transactions) {
        await this.processTransaction(txData);
      }

      // Schedule next monitoring cycle
      setTimeout(() => {
        if (this.isMonitoring) {
          this.simulateNetworkMonitoring(network);
        }
      }, 5000 + Math.random() * 5000); // 5-10 seconds interval

    } catch (error) {
      console.error(`Error monitoring ${network} network:`, error);
      
      // Retry after longer delay on error
      setTimeout(() => {
        if (this.isMonitoring) {
          this.simulateNetworkMonitoring(network);
        }
      }, 15000);
    }
  }

  private generateSimulatedTransactions(network: string, count: number): BlockchainTransaction[] {
    const transactions: BlockchainTransaction[] = [];
    
    for (let i = 0; i < count; i++) {
      const tx: BlockchainTransaction = {
        hash: this.generateTransactionHash(),
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        fromAddress: this.generateAddress(),
        toAddress: this.generateAddress(),
        amount: this.generateAmount(),
        gasPrice: this.generateGasPrice(network),
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        timestamp: new Date(),
        network,
        status: Math.random() > 0.95 ? 'failed' : 'confirmed'
      };
      
      transactions.push(tx);
    }
    
    return transactions;
  }

  private generateTransactionHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateAddress(): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  private generateAmount(): string {
    // Generate amounts with various ranges to simulate different types of transactions
    const ranges = [
      { min: 0.001, max: 1 },      // Small transactions
      { min: 1, max: 100 },        // Medium transactions  
      { min: 100, max: 10000 },    // Large transactions
      { min: 10000, max: 1000000 } // Very large transactions (potentially suspicious)
    ];
    
    const weights = [0.6, 0.25, 0.1, 0.05]; // Probability weights
    let range = ranges[0];
    
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        range = ranges[i];
        break;
      }
    }
    
    const amount = range.min + Math.random() * (range.max - range.min);
    return amount.toFixed(6);
  }

  private generateGasPrice(network: string): string {
    // Different networks have different gas price ranges
    const gasPrices = {
      ethereum: { min: 10, max: 100 },
      polygon: { min: 1, max: 50 },
      bsc: { min: 5, max: 20 },
      bitcoin: { min: 1, max: 10 }
    };
    
    const range = gasPrices[network as keyof typeof gasPrices] || gasPrices.ethereum;
    const price = range.min + Math.random() * (range.max - range.min);
    return (price * 1e9).toString(); // Convert to wei/gwei equivalent
  }

  private async processTransaction(txData: BlockchainTransaction) {
    try {
      // Check if transaction already exists
      const existingTx = await Transaction.findOne({ hash: txData.hash });
      if (existingTx) {
        return;
      }

      // Create new transaction record
      const transaction = await Transaction.create({
        ...txData,
        riskScore: 0, // Will be calculated by risk scoring agent
      });

      console.log(`New transaction processed: ${transaction.hash} on ${transaction.network}`);

      // Broadcast transaction update
      broadcastTransactionUpdate({
        id: transaction._id,
        hash: transaction.hash,
        network: transaction.network,
        amount: transaction.amount,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        timestamp: transaction.timestamp,
        status: transaction.status
      });

    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  // Get network statistics
  async getNetworkStats() {
    const stats = {};
    
    for (const network of this.networks) {
      const count = await Transaction.countDocuments({ network });
      const recentCount = await Transaction.countDocuments({
        network,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      stats[network] = {
        totalTransactions: count,
        last24Hours: recentCount
      };
    }
    
    return stats;
  }

  // Get transaction by hash
  async getTransaction(hash: string) {
    return await Transaction.findOne({ hash }).lean();
  }

  // Get transactions by address
  async getTransactionsByAddress(address: string, limit = 50) {
    return await Transaction.find({
      $or: [
        { fromAddress: address },
        { toAddress: address }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  }

  // Get high-risk transactions
  async getHighRiskTransactions(limit = 20) {
    return await Transaction.find({
      riskScore: { $gte: 7 }
    })
    .sort({ riskScore: -1, timestamp: -1 })
    .limit(limit)
    .lean();
  }
}

export const blockchainService = new BlockchainService();
