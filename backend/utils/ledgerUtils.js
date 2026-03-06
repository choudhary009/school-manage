const LedgerParty = require('../models/LedgerParty');
const LedgerTransaction = require('../models/LedgerTransaction');

/**
 * Recalculates the currentBalance for a LedgerParty and the balanceAfter 
 * for all its transactions. Uses bulkWrite for high performance.
 */
const recalcPartyBalances = async (companyId, partyId) => {
    if (!partyId) return;

    const party = await LedgerParty.findOne({ _id: partyId, companyId });
    if (!party) return;

    const transactions = await LedgerTransaction.find({ companyId, partyId })
        .sort({ date: 1, createdAt: 1 });

    let balance = party.openingBalance || 0;
    const updates = [];

    for (const tx of transactions) {
        if (party.type === 'supplier') {
            // Supplier logic: recovery (credit) adds to balance, sale (debit) subtracts
            if (tx.type === 'debit') {
                balance -= tx.amount;
            } else if (tx.type === 'credit') {
                balance += tx.amount;
            }
        } else {
            // Customer / other logic: original behaviour (debit adds, credit subtracts)
            if (tx.type === 'debit') {
                balance += tx.amount;
            } else if (tx.type === 'credit') {
                balance -= tx.amount;
            }
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

    // Use bulkWrite for performance - eliminates N sequential requests
    if (updates.length > 0) {
        await LedgerTransaction.bulkWrite(updates);
    }

    if (party.currentBalance !== balance) {
        party.currentBalance = balance;
        await party.save();
    }

    return balance;
};

module.exports = {
    recalcPartyBalances
};
