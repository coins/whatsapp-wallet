export function parseBitcoinUri(uri) {
    const r = /^bitcoin:([a-zA-Z0-9]{27,34})(?:\?(.*))?$/;
    const legalKeys = ['address', 'amount', 'value', 'message', 'send', 'tx'];
    const match = r.exec(uri);
    if (!match) return null;

    const parsed = { uri: uri }
    if (match[2]) {
        const queries = match[2].split('&');
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i].split('=');
            const key = query[0];
            if (query.length === 2 && legalKeys.includes(key)) {
                parsed[key] = decodeURIComponent(query[1].replace(/\+/g, '%20'));
            }
        }
    }

    parsed.address = match[1];
    return parsed;
}