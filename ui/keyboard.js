export const $keyboard = document.querySelector('.tx-value--keyboard');
let value = '';

$keyboard.addEventListener('click', e => {
    if (e.target.tagName !== 'A') return;
    const key = e.target.textContent;
    switch (key) {
        case '<':
            value = value.substr(0, value.length - 1);
            break;
        case '.':
            {
                if (value.indexOf('.') > -1) return;
                if (value === '') {
                    value = '0.';
                    return;
                }
            }

        default:
            value += key;
    }

    let event = new CustomEvent('value', { detail: value });
    $keyboard.dispatchEvent(event);
});