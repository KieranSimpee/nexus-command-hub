import { base44 } from 'https://cdn.jsdelivr.net/npm/@base44/api@latest/dist/index.js';

export default async function dailyPnlSummary() {
  try {
    // Get today's date in HK timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
    
    // Read all TradeLog records for today
    const trades = await base44.asServiceRole.entities.TradeLog.list({
      query: { date: today },
      limit: 100
    });

    if (!trades || trades.count === 0) {
      return {
        statusCode: 200,
        body: {
          message: `📊 No trades today (${today}). HK50 SHORT monitor still running. 🏮`,
          dailyNetPnl: 0,
          trades: []
        }
      };
    }

    let totalGrossPnl = 0;
    let totalFees = 0;
    let tradeDetails = [];

    for (const trade of trades.records) {
      const grossPnl = trade.gross_pnl_hkd || 0;
      const fees = trade.fees_hkd || 0;
      const netPnl = trade.net_pnl_hkd || grossPnl - fees;

      totalGrossPnl += grossPnl;
      totalFees += fees;

      tradeDetails.push({
        instrument: trade.instrument,
        direction: trade.direction,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        quantity: trade.quantity,
        grossPnl: grossPnl,
        fees: fees,
        netPnl: netPnl,
        platform: trade.platform
      });
    }

    const totalNetPnl = totalGrossPnl - totalFees;

    // Get monthly total from all May trades
    const allMayTrades = await base44.asServiceRole.entities.TradeLog.list({
      limit: 500
    });

    let monthlyTotal = 0;
    if (allMayTrades && allMayTrades.records) {
      for (const trade of allMayTrades.records) {
        if (trade.date && trade.date.startsWith('2026-05')) {
          monthlyTotal += trade.net_pnl_hkd || 0;
        }
      }
    }

    // Format message
    let message = `📊 DAILY P&L SUMMARY — ${today}\n\n`;
    
    for (const trade of tradeDetails) {
      message += `${trade.instrument}\n`;
      message += `📍 ${trade.direction} | Entry: ${trade.entryPrice} | Exit: ${trade.exitPrice}\n`;
      message += `📦 Qty: ${trade.quantity} | Platform: ${trade.platform}\n`;
      message += `💰 Gross: +HKD ${trade.grossPnl.toLocaleString()} | Fees: -HKD ${trade.fees.toLocaleString()} | Net: +HKD ${trade.netPnl.toLocaleString()}\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Total Gross P&L: +HKD ${totalGrossPnl.toLocaleString()}\n`;
    message += `Total Fees: -HKD ${totalFees.toLocaleString()}\n`;
    message += `Total Net P&L: +HKD ${totalNetPnl.toLocaleString()} ✅\n\n`;
    message += `📈 Monthly Total (May 2026): +HKD ${monthlyTotal.toLocaleString()}\n`;
    message += `🎯 Daily Target: HKD 24,000-30,000\n`;
    
    const hitTarget = totalNetPnl >= 24000 ? '✅ HIT TARGET' : totalNetPnl >= 18000 ? '⚠️ CLOSE' : '📊 BELOW TARGET';
    message += `📌 Status: ${hitTarget}\n`;

    return {
      statusCode: 200,
      body: {
        message,
        dailyNetPnl: totalNetPnl,
        monthlyNetPnl: monthlyTotal,
        trades: tradeDetails
      }
    };

  } catch (error) {
    console.error('Error in dailyPnlSummary:', error);
    return {
      statusCode: 500,
      body: { error: error.message }
    };
  }
}
