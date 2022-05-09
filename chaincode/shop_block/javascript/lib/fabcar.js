/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const accounts = [
            {
                customerID: 'Alice27',
                checkingBalance: 1000000,
                customName: 'Alice',
            },
            {
                customerID: 'Bob99',
                checkingBalance: 5500000,
                customName: 'Bob',
            },
            {
                customerID: 'Mary18',
                checkingBalance: 999000,
                customName: 'Mary',
            },
            {
                customerID: 'Tony06',
                checkingBalance: 1000000,
                customName: 'Tony',
            },
            {
                customerID: 'blackknight',
                checkingBalance: 1000000,
                customName: 'Batman',
            },
            {
                customerID: 'purple',
                checkingBalance: 1000000,
                customName: 'Michel',
            },
            {
                customerID: 'white',
                checkingBalance: 1000000,
                customName: 'Aarav',
            },
            {
                customerID: 'violet',
                checkingBalance: 1000000,
                customName: 'Pari',
            },
            {
                customerID: 'indigo',
                checkingBalance: 1000000,
                customName: 'Valeria',
            },
            {
                customerID: 'brown',
                checkingBalance: 1000000,
                customName: 'Shotaro',
            },
        ];

        for (let i = 0; i < accounts.length; i++) {
            accounts[i].docType = 'account';
            await ctx.stub.putState('Account' + i, Buffer.from(JSON.stringify(accounts[i])));
            console.info('Added <--> ', accounts[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryAccount(ctx, accountNumber ) {    
        const accountAsBytes = await ctx.stub.getState(accountNumber); // get the car from chaincode state
        if (!accountAsBytes || accountAsBytes.length === 0) {
            throw new Error(`${accountNumber} does not exist`);
        }
        console.log(accountAsBytes.toString());
        return accountAsBytes.toString();

    }

    async createAccount(ctx, accountNumber, customerID, checkingBalance, customName) {
        console.info('============= START : Create Account ===========');

        const account = {
            customerID,
            docType: 'account',
            checkingBalance,
            customName,
        };

        await ctx.stub.putState(accountNumber, Buffer.from(JSON.stringify(account)));
        console.info('============= END : Create Account ===========');

    }
    async createSwapBlock(ctx, accountNumber, customerID, checkingBalance, customName,history) {
        console.info('============= START : Swapping Data ===========');

        const account = {
            customerID,
            docType: 'account',
            checkingBalance,
            customName,
            history
        };
        await ctx.stub.putState(accountNumber, Buffer.from(JSON.stringify(account)));
        console.info('============= END : Swapping Data ===========');
    }

    async deleteAccount(ctx, accountNumber) {

        await ctx.stub.deleteState(accountNumber); // get the car from chaincode state
 
    }


    async deleteAccounts(ctx, accounts) {
        const deleteAccounts = JSON.parse(accounts);
        console.log(`All accounts ${deleteAccounts}`);

        for (let accountNumber of deleteAccounts) {
            console.log(`Deleting accounts ${accountNumber} from world state`)
            await ctx.stub.deleteState(accountNumber);
        }
    }

    async queryAccountsByRangeWithPagination(ctx, startKey, batchSize) {
        let { iterator, metadata} = await ctx.stub.getStateByRangeWithPagination(startKey, undefined, parseInt(batchSize,10));

        let accountResults = [];
        let results = await iterator.next();
        let iterate = results.value ? true: false;
        while (iterate) {
            if (results.value && results.value.value.toString()) {
                const Key = results.value.key;
                accountResults.push(Key);
            }
            if (results.done) {
                iterate = false;
                await iterator.close();
                console.log('End of data.');
                console.info(accountResults);
            } else {
                results = await iterator.next();
            }
        }
        return JSON.stringify(accountResults);
    }

    async queryAllAccounts(ctx) {
        const startKey = 'Account0';
        const endKey = 'Account999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async changeAccountOwner(ctx, accountNumber, newcustomName) {
        console.info('============= START : changeCarOwner ===========');

        const accountAsBytes = await ctx.stub.getState(accountNumber); // get the account from chaincode state
        if (!accountAsBytes || accountAsBytes.length === 0) {
            throw new Error(`${accountNumber} does not exist`);
        }
        const account = JSON.parse(accountAsBytes.toString());
        account.owner = newcustomName;

        await ctx.stub.putState(accountNumber, Buffer.from(JSON.stringify(account)));
        console.info('============= END : changeAccountOwnerName ===========');
    }
    async sendPayment(ctx, sourceAccount, destAccount, amount){
        console.info('============= START : sendPayment ===========');
        const accountAsBytes = await ctx.stub.getState(sourceAccount);
        const accAsBytes = await ctx.stub.getState(destAccount);
        if (!accountAsBytes || accountAsBytes.length === 0) {
            throw new Error(`${sourceAccount} does not exist`);
        }
        if (!accAsBytes || accAsBytes.length === 0) {
            throw new Error(`${destAccount} does not exist`);
        }
        const sourceacc = JSON.parse(accountAsBytes.toString());
        const destacc = JSON.parse(accAsBytes.toString());
        const sourceBal = parseInt(sourceacc.checkingBalance) - amount;
        sourceacc.checkingBalance = sourceBal ;
        const destBal = parseInt(destacc.checkingBalance) + parseInt(amount);
        destacc.checkingBalance = destBal;
   

        await ctx.stub.putState(sourceAccount, Buffer.from(JSON.stringify(sourceacc)));
        await ctx.stub.putState(destAccount, Buffer.from(JSON.stringify(destacc)));
        console.info("============= END : sendPayment ===========");
    }
    async intershardSender(ctx, sourceAccount, amount){
        console.info('============= START : sendPayment for Sender ===========');
        const accountAsBytes = await ctx.stub.getState(sourceAccount);
       
        if (!accountAsBytes || accountAsBytes.length === 0) {
            throw new Error(`${sourceAccount} does not exist`);
        }
       
        const sourceacc = JSON.parse(accountAsBytes.toString());
       
        const sourceBal = parseInt(sourceacc.checkingBalance) - amount;
        sourceacc.checkingBalance = sourceBal ;
   
        await ctx.stub.putState(sourceAccount, Buffer.from(JSON.stringify(sourceacc)));
        console.info("============= END : sendPayment for Sender ===========");
    }
    async intershardReceiver(ctx, destAccount, amount){
        console.info('============= START : sendPayment for Receiver ===========');
     
        const accAsBytes = await ctx.stub.getState(destAccount);
       
        if (!accAsBytes || accAsBytes.length === 0) {
            throw new Error(`${destAccount} does not exist`);
        }
       
        const destacc = JSON.parse(accAsBytes.toString());
       
        const destBal = parseInt(destacc.checkingBalance) + parseInt(amount);
        destacc.checkingBalance = destBal;
   
        await ctx.stub.putState(destAccount, Buffer.from(JSON.stringify(destacc)));
        console.info("============= END : sendPayment for Receiver ===========");
    }

}

module.exports = FabCar;
