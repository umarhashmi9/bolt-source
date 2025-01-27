import { writeFile, readFile } from 'fs/promises';
import { mkdir } from 'fs/promises';

class TroubleshootingUtility {
    constructor() {
        this.logDir = './logs/troubleshooting_logs';
        this.screenshotDir = './logs/screenshots';
        this.setupDirectories();
    }

    async setupDirectories() {
        try {
            await mkdir(this.logDir, { recursive: true });
            await mkdir(this.screenshotDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create directories:', error);
        }
    }

    async logAction(action, details) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            action,
            details,
            success: true
        };
        await this.writeLog(logEntry);
    }

    async logError(action, error) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            action,
            error: error.message,
            stack: error.stack,
            success: false
        };
        await this.writeLog(logEntry);
    }

    async writeLog(logEntry) {
        try {
            const logFile = `${this.logDir}/troubleshooting_${new Date().toISOString().split('T')[0]}.json`;
            let logs = [];
            
            try {
                const existingLogs = await readFile(logFile, { encoding: 'utf8' });
                logs = JSON.parse(existingLogs);
            } catch (error) {
                // File doesn't exist or is empty, start with empty array
            }
            
            logs.push(logEntry);
            await writeFile(logFile, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    async analyzeErrors(timeframe = '24h') {
        try {
            const logs = await this.getRecentLogs(timeframe);
            const errors = logs.filter(log => !log.success);
            const errorAnalysis = {
                total: errors.length,
                byType: {},
                mostCommon: null
            };

            errors.forEach(error => {
                const type = error.error || 'Unknown';
                errorAnalysis.byType[type] = (errorAnalysis.byType[type] || 0) + 1;
            });

            if (Object.keys(errorAnalysis.byType).length > 0) {
                errorAnalysis.mostCommon = Object.entries(errorAnalysis.byType)
                    .sort((a, b) => b[1] - a[1])[0];
            }

            return errorAnalysis;
        } catch (error) {
            console.error('Error analysis failed:', error);
            return null;
        }
    }

    async getRecentLogs(timeframe) {
        const now = new Date();
        const hours = parseInt(timeframe);
        const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));

        try {
            const logFile = `${this.logDir}/troubleshooting_${now.toISOString().split('T')[0]}.json`;
            const logs = await readFile(logFile, { encoding: 'utf8' })
                .then(content => JSON.parse(content))
                .catch(() => []);

            return logs.filter(log => new Date(log.timestamp) >= cutoff);
        } catch (error) {
            console.error('Failed to get recent logs:', error);
            return [];
        }
    }

    async attemptRecovery(error) {
        const recoveryStrategies = {
            'ConnectionError': async () => {
                await this.logAction('Recovery Attempt', 'Attempting to reconnect');
                // Implement reconnection logic here
                return 'Reconnection attempted';
            },
            'TimeoutError': async () => {
                await this.logAction('Recovery Attempt', 'Attempting timeout recovery');
                // Implement timeout recovery logic here
                return 'Timeout recovery attempted';
            }
        };

        const strategy = recoveryStrategies[error.type];
        if (strategy) {
            try {
                const result = await strategy();
                await this.logAction('Recovery attempt', { error: error.type, result });
                return result;
            } catch (recoveryError) {
                await this.logError('Recovery failed', recoveryError);
                throw recoveryError;
            }
        }
        return null;
    }
}

export default TroubleshootingUtility;