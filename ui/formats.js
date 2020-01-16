export function formatAmountSatoshis(amountSatoshis, exchangeRate) {
    const amountBtc = amountSatoshis / 1e8;
    const amountUsdRaw = amountBtc * exchangeRate;
    const fiat = formatUSD(amountUsdRaw);
    const crypto = formatBTC(amountBtc);
    return { fiat, crypto }
}

export function formatAmountUsd(amountUsd, exchangeRate) {
    amountUsd = Number(amountUsd) 
    const amountBtc = amountUsd / exchangeRate;
    const fiat = formatUSD(amountUsd);
    const crypto = formatBTC(amountBtc);
    return { fiat, crypto }
}

export function formatUSDRaw(amount) {
    return new Intl.NumberFormat('en-EN', {
            maximumFractionDigits: 2
        })
        .format(amount);
}

export function formatUSD(amount) {
    return new Intl.NumberFormat('en-EN', {
            style: 'currency',
            currency: 'USD'
        })
        .format(amount);
}

export function formatBTC(amount) {
    return new Intl.NumberFormat('en-EN', {
            style: 'currency',
            currency: 'BTC',
            maximumFractionDigits: 7
        })
        .format(amount)
        .substr(0, 12)
}

