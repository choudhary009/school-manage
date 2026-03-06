const Bank = require('../models/Bank');
const BankTransaction = require('../models/BankTransaction');

/**
 * Recalculates the currentBalance for a Bank and the balanceAfter 
 * for all its transactions. Uses bulkWrite for high performance.
 */
const recalcBankBalances = async (companyId, bankId) => {
    if (!bankId) return;

    const bank = await Bank.findOne({ _id: bankId, companyId });
    if (!bank) return;

    const transactions = await BankTransaction.find({ bankId: bank._id })
        .sort({ date: 1, createdAt: 1 });

    let balance = bank.openingBalance || 0;
    const updates = [];

    for (const tx of transactions) {
        if (tx.type === 'deposit') {
            balance += tx.amount;
        } else {
            balance -= tx.amount;
        }

        if (tx.balanceAfter !== balance) {
            updates.push({
                updateOne: {
                    filter: { _id: tx._id },
                    update: { $set: { balanceAfter: balance } }
                }
            });
        }
    }

    // Use bulkWrite for performance
    if (updates.length > 0) {
        await BankTransaction.bulkWrite(updates);
    }

    if (bank.currentBalance !== balance) {
        bank.currentBalance = balance;
        await bank.save();
    }

    return balance;
};

module.exports = {
    recalcBankBalances
};
