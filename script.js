import { WalletStore } from './bitcoin/bitcoin.js';
import { BitcoinLink } from './bitcoin/bitcoin-link.js';
import { formatAmountSatoshis, formatAmountUsd, formatUSD } from './ui/formats.js';
import { whatsappShareUri } from './ui/share-uris.js';
import { Views } from './ui/views.js';
import './ui/clipboard.js';
import { parseBitcoinUri } from './bitcoin/bitcoin-uri.js';

let balance = 0;
let txAmount = 0;
let exchangeRate = 0;

const isTestnet = true;

const wallet = WalletStore.loadOrCreate(isTestnet);


function walletHook(url) {
    const baseUrl = document.location.origin
    return `${baseUrl}/#${url}`
}

function parseBitcoinUriRoute(route) {
    const uri = decodeURIComponent(route);
    return parseBitcoinUri(uri);
}

function onHashChange() {
    const hash = location.hash.substr(1);

    if (hash.startsWith('pay')) {
        processReceive(hash);
        return;
    }

    if (hash.startsWith('request')) {
        processRequest(hash);
        return;
    }
}

async function processRequest(hash) {
    const bitcoinUri = hash.replace('request/', '');
    const request = parseBitcoinUriRoute(bitcoinUri);
    window.request = request;
    const exchangeRate = await wallet.exchangeRate 
    setRequestAmount(request.amount, exchangeRate);
    Views.Request.show();
}

async function processReceive(hash) {
    const bitcoinUri = hash.replace('pay/', '');
    const receive = parseBitcoinUriRoute(bitcoinUri);
    const secret = receive.send;
    const tx = receive.tx;
    console.log('Received', receive)
    const exchangeRate = await wallet.exchangeRate 
    setReceiveAmount(receive.amount, exchangeRate);
    Views.Receive.show();
    try {
        await BitcoinLink.redeem(secret, wallet.address, tx, isTestnet);
        wallet.poll();
    } catch (e) {
        Views.Receive.hide();
        console.error(e)
        alert('Link is empty');
        location = '#';
    }
}

function setBalance(balance) {
    const formatted = formatAmountSatoshis(balance, exchangeRate);
    Views.Home.balanceFiat = formatted.fiat;
    Views.Home.balanceCrypto = formatted.crypto;
}

function setValue(amountUsd) {
    txAmount = amountUsd
    const formatted = formatAmountUsd(amountUsd, exchangeRate);
    Views.Home.amountFiat = formatted.fiat;
    Views.Home.amountCrypto = formatted.crypto;
}

function setRequestAmount(amount, exchangeRate) {
    const formatted = formatAmountSatoshis(amount, exchangeRate);
    Views.Request.amountFiat = formatted.fiat;
    Views.Request.amountCrypto = formatted.crypto;
}

function setReceiveAmount(amount, exchangeRate) {
    const formatted = formatAmountSatoshis(amount, exchangeRate);
    Views.Receive.amountFiat = formatted.fiat;
    Views.Receive.amountCrypto = formatted.crypto;
}


Views.Home.onPay(async _ => {
    if (!txAmount) {
        console.warn('Amount is zero');
        return;
    }
    const amountUsd = formatUSD(txAmount);
    const amountCrypto = Math.round(txAmount / exchangeRate * 1e8);
    if (amountCrypto > balance) {
        console.warn('Amount too large');
        return;
    }

    // generate a temporary wallet
    const tempWallet = BitcoinLink.generate(amountCrypto, isTestnet);
    console.log(tempWallet.serialize());

    await tempWallet.fundWith(wallet, amountCrypto);

    const hookUri = walletHook(`pay/${encodeURIComponent(tempWallet.serialize())}`);
    // descriptive text and link
    const text = `${hookUri}

    Here are *~${amountUsd}* in Bitcoin for you.
    `



    // open Whatsapp
    const uri = whatsappShareUri(text);

    navigator.clipboard.writeText(hookUri);

    if (uri.startsWith('whatsapp:')) {
        window.location = uri;
    } else {
        window.open(uri, '_blank')
    }
})

Views.Home.onRequest(_ => {
    const usdValue = formatUSD(txAmount);
    const btcValue = Math.round(1e8 * Number(txAmount) / exchangeRate);
    const myAddress = wallet.address;
    const bitcoinUri = `bitcoin:${ myAddress }?amount=${ btcValue }`;
    const hookUri = walletHook(`request/${encodeURIComponent( bitcoinUri ) }`)
    const text = `${ hookUri }

    Please pay me *~${usdValue}* in Bitcoin.
    `;

    navigator.clipboard.writeText(hookUri);
    setTimeout(_ => alert('copied to clipboard'), 1000)

    // open Whatsapp
    const uri = whatsappShareUri(text);
    if (uri.startsWith('whatsapp:')) {
        window.location = uri;
    } else {
        window.open(uri, '_blank')
    }
});

Views.Home.onAmountChanged(amount => {
    setValue(amount);
});

Views.Request.onPaymentConfirmed(_ => {
    const request = window.request;

    const recipient = request.address;
    const amount = request.amount;
    const fee = 300;

    wallet.sendTransaction(recipient, amount, fee);
    wallet.poll();

    Views.Request.hide();
    location = '#';
});

Views.Request.onDecline(_ => {
    Views.Request.hide()
    location = '#';
})

Views.Receive.onConfirmed(_ => {
    Views.Receive.hide();
    location = '#';
})

wallet.onExchangeRate(rate => {
    exchangeRate = rate
    setBalance(balance)
});

wallet.onBalance(b => {
    balance = b.total
    setBalance(balance)
});

wallet.startWatching();

window.addEventListener('hashchange', onHashChange);
onHashChange()