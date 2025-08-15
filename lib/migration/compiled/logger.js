"use strict";
/**
 * Logging system for image migration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 4] = "VERBOSE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(level = LogLevel.INFO) {
        this.logLevel = level;
        this.startTime = Date.now();
    }
    static getInstance(level) {
        if (!Logger.instance) {
            Logger.instance = new Logger(level);
        }
        return Logger.instance;
    }
    setLevel(level) {
        this.logLevel = level;
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        let formatted = `[${timestamp}] [+${elapsed}s] ${level}: ${message}`;
        if (context) {
            formatted += ` ${JSON.stringify(context)}`;
        }
        return formatted;
    }
    error(message, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('ERROR', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage('INFO', message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('DEBUG', message, context));
        }
    }
    verbose(message, context) {
        if (this.shouldLog(LogLevel.VERBOSE)) {
            console.log(this.formatMessage('VERBOSE', message, context));
        }
    }
    progress(current, total, message) {
        if (this.shouldLog(LogLevel.INFO)) {
            const percentage = ((current / total) * 100).toFixed(1);
            const progressBar = this.createProgressBar(current, total);
            const msg = message ? ` - ${message}` : '';
            console.log(`\r🔄 Progress: ${progressBar} ${percentage}% (${current}/${total})${msg}`);
        }
    }
    createProgressBar(current, total, width = 20) {
        const filled = Math.floor((current / total) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
    }
    success(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage('✅ SUCCESS', message, context));
        }
    }
    failure(message, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('❌ FAILURE', message, context));
        }
    }
    section(title) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log('');
            console.log(`${'='.repeat(50)}`);
            console.log(`🔧 ${title}`);
            console.log(`${'='.repeat(50)}`);
        }
    }
    subsection(title) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log('');
            console.log(`📋 ${title}`);
            console.log(`${'-'.repeat(30)}`);
        }
    }
    summary(stats) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log('');
            console.log('📊 Migration Summary:');
            console.log(`   Total Items: ${stats.total}`);
            console.log(`   ✅ Successful: ${stats.successful}`);
            console.log(`   ❌ Failed: ${stats.failed}`);
            console.log(`   ⏭️ Skipped: ${stats.skipped}`);
            console.log(`   ⏱️ Duration: ${stats.duration.toFixed(2)}s`);
            console.log('');
        }
    }
}
exports.Logger = Logger;
