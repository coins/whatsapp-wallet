import { bitcoinJS as bitcoin } from './bitcoin.min.js';
import { BitcoinWallet } from './bitcoin.js';
import { Esplora as BitcoinBackend } from './esplora-api/esplora-api.js';

export class BitcoinLink {

    constructor(keyPair, amount) {
        this._keyPair = keyPair
        this._amount = amount;
    }

    get address() {
        return this._keyPair.getAddress();
    }

    get secret() {
        return this._keyPair.toWIF();
    }

    get amount() {
        return this._amount;
    }

    async fundWith(wallet, amount) {
        // fund the wallet
        const tx = await wallet.buildTransaction(this.address, amount, 667);
        this._tx = tx;
    }

    static generate(amount, isTestnet = false) {
        const network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
        const keyPair = bitcoin.ECPair.makeRandom({ network });
        return new BitcoinLink(keyPair, amount);
    }

    serialize() {
        return `bitcoin:${this.address}?send=${this.secret}&amount=${this.amount}&tx=${this._tx}`;
    }

    static async redeem(secret, recipient, tx, isTestnet) {
        await BitcoinBackend.broadcastTransaction(tx);
        return new Promise(async (resolve, error) => {
            const wallet = BitcoinWallet.fromWIF(secret, isTestnet);
            wallet.onBalance(balance => {
                if (!balance.total) return error('bitcoinlink already redeemed');
                wallet.sendMax(recipient, 300);
                resolve();
            });
            wallet.poll();
        })
    }

}



/*

    See: 
    https://github.com/bitcoin/bips/blob/master/bip-0020.mediawiki#sending-money-via-private-key

*/