import { bitcoinJS as bitcoin } from './bitcoin.min.js';
import { Esplora as BitcoinBackend } from './esplora-api/esplora-api.js';

/**
 * High Level Bitcoin API
 *
 */
export class BitcoinWallet {

    constructor(keyPair) {
        this._keyPair = keyPair;
        if (this.isTestnet) BitcoinBackend.useTestnet();
        this._watcher = new WalletWatcher(this.address);
    }

    get isTestnet() {
        return this._keyPair.network === bitcoin.networks.testnet;
    }

    get network() {
        return this._keyPair.network
    }

    get address() {
        return this._keyPair.getAddress();
    }

    async sendTransaction(recipient, value, fee) {
        const tx = await this.buildTransaction(recipient, value, fee);
        return BitcoinBackend.broadcastTransaction(tx);
    }

    async buildTransaction(recipient, value, fee) {
        value = Number(value)
        if (value <= 0)
            throw Error('amount not positive')
        // Fetch our unspent outputs 
        const address = this._keyPair.getAddress();
        const inputs = await BitcoinBackend.fetchUnspentOutputs(address);
        // Build transaction
        const tx = buildTransaction(recipient, value, fee, inputs, this._keyPair, this.network);
        // return transaction
        return tx
    }


    sendMax(recipient, fee) {
        return sendMax(recipient, fee, this._keyPair, this.network)
    }

    toWIF() {
        return this._keyPair.toWIF();
    }

    static generate(isTestnet = false) {
        const network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
        const keyPair = bitcoin.ECPair.makeRandom({ network });
        return new BitcoinWallet(keyPair, isTestnet);
    }

    static fromWIF(secretKeyWIF, isTestnet = false) {
        // Initialize a private key using "Wallet Import Format" (WIF)
        const network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
        const keyPair = bitcoin.ECPair.fromWIF(secretKeyWIF, network);
        return new BitcoinWallet(keyPair);
    }

    onTransaction(callback) {
        this._watcher.addEventListener(EVENTS.TRANSACTION, callback);
    }

    onBalance(callback) {
        this._watcher.addEventListener(EVENTS.BALANCE, callback);
    }

    onExchangeRate(callback) {
        this._watcher.addEventListener(EVENTS.EXCHANGE_RATE, callback);
    }

    startWatching() {
        this._watcher.start();
    }

    poll() {
        setTimeout(_ => this._watcher.poll(), 500);
    }

    get exchangeRate(){
        return fetchExchangeRate();
    }
}


// async function sendTransaction(recipient, value, fee, keyPair, network) {
//     // Fetch our unspent outputs 
//     const address = keyPair.getAddress();
//     const inputs = await BitcoinBackend.fetchUnspentOutputs(address);
//     // Build transaction
//     const tx = buildTransaction(recipient, value, fee, inputs, keyPair, network);
//     // Broadcast transaction
//     await BitcoinBackend.broadcastTransaction(tx);
// }


async function sendMax(recipient, fee, keyPair, network) {
    // Fetch our unspent outputs 
    const address = keyPair.getAddress();
    const inputs = await BitcoinBackend.fetchUnspentOutputs(address);
    const value = inputs.reduce((sum, input) => sum + input.value, 0) - fee;
    // Build transaction
    const tx = buildTransaction(recipient, value, fee, inputs, keyPair, network);
    // Broadcast transaction
    await BitcoinBackend.broadcastTransaction(tx);
}


function buildTransaction(recipient, value, fee, inputs, keyPair, network) {
    // TODO: This function consolidates all our inputs into one. Do we want that? 

    console.log('BUILD TRANSACTION', inputs, keyPair, recipient, value, fee);

    // We reuse the same address for change
    const changeAddress = keyPair.getAddress();

    // Build a transaction
    const tx = new bitcoin.TransactionBuilder(network);

    // Add the inputs (who is paying):
    inputs.forEach(input => tx.addInput(input.txid, input.vout));

    // Add the output (who to pay to):
    // [payee's address, amount in satoshis]
    tx.addOutput(recipient, value);

    // Add the change output
    const inputsSum = inputs.reduce((sum, input) => sum + input.value, 0);
    const change = inputsSum - value - fee;

    // We do not create dust outputs 
    // The change is miners' fee if it's too small
    if (change > 546) {
        tx.addOutput(changeAddress, change);
    }

    // Sign every input with the private key
    inputs.forEach((input, index) => tx.sign(index, keyPair));

    // return in hex format
    const hex = tx.build().toHex();
    return hex;
}

async function fetchExchangeRate(currency = 'USD') {
    const response = await fetch(`https://api.coindesk.com/v1/bpi/currentprice.json`)
    const json = await response.json();
    return json.bpi[currency].rate_float;
}

export async function validateAddress(address) {
    // TODO: verify checksum
    // TODO: add bech32 format 
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}

class WalletWatcher {

    constructor(address) {
        this._callbacks = {};
        this._address = address;
    }

    fire(type, data) {
        const event = new CustomEvent(type, { detail: data });
        window.dispatchEvent(event);
    }

    start() {
        const seconds = 30;
        console.log(`Watcher active on address ${this._address}
        Polling every ${seconds} seconds...`)
        this.stop();
        this._pollTimer = setInterval(_ => this.poll(), seconds * 1000);
        this.poll(this._address);
    }

    stop() {
        clearInterval(this._pollTimer);
    }

    poll() {
        this.fetchBalance();
        this.fetchTransactions();
        this.fetchExchangeRate();
    }

    async fetchBalance() {
        const balance = await BitcoinBackend.fetchBalance(this._address);
        this._fire(EVENTS.BALANCE, balance);
    }

    async fetchTransactions() {
        const transactions = await BitcoinBackend.fetchTransactions(this._address);
        this._fire(EVENTS.TRANSACTION, transactions);
    }

    async fetchExchangeRate() {
        const exchangeRate = await fetchExchangeRate();
        this._fire(EVENTS.EXCHANGE_RATE, exchangeRate);
    }

    _fire(type, data) {
        if (!this._callbacks[type]) return;
        this._callbacks[type](data);
    }

    addEventListener(type, callback) {
        this._callbacks[type] = callback;
    }
}

const EVENTS = {
    BALANCE: 'balance',
    TRANSACTION: 'transaction',
    EXCHANGE_RATE: 'exchange-rate',
    ERROR: 'error'
}

BitcoinWallet.EVENTS = EVENTS;


export class WalletStore {

    static get KEY() {
        return 'secret';
    }

    static store(wallet) {
        const secret = wallet.toWIF();
        localStorage.setItem(WalletStore.KEY, secret);
    }

    static load(isTestnet) {
        const secret = localStorage.getItem(WalletStore.KEY);
        if (!secret) return;
        return BitcoinWallet.fromWIF(secret, isTestnet);
    }

    static loadOrCreate(isTestnet = false) {
        let wallet = WalletStore.load(isTestnet);
        if (!wallet) {
            wallet = BitcoinWallet.generate(isTestnet);
            WalletStore.store(wallet);
        }
        return wallet;
    }
}