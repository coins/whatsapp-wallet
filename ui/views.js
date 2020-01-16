/*
    Views
        - Abstraction for DOM queries and bindings
        - no logic here. views are as dumb as possible
*/

import { $keyboard } from './keyboard.js';

class View {

    constructor(selector, store) {
        this.$el = document.querySelector(selector);
        this.store = store;
    }

    /* Query inside of this DOM-Element */
    $(selector) {
        return this.$el.querySelector(selector);
    }

    /* Set Attribute of root element. Removes attribute if value == false */
    setAttribute(attr, value) {
        if (value)
            this.$el.setAttribute(attr, value);
        else
            this.$el.removeAttribute(attr);
    }

    show() {
        this.$el.style.display = 'flex';
    }

    hide() {
        this.$el.style.display = 'none';
    }
}


class ViewHome extends View {

    constructor() {
        super('body');
        this.$balanceFiat = this.$('.balance--fiat');
        this.$balanceCrypto = this.$('.balance--btc');

        this.$amountFiat = this.$('.tx-value--fiat');
        this.$amountCrypto = this.$('.tx-value--btc');

        this.$btnRequest = this.$('#btn-request');
        this.$btnPay = this.$('#btn-pay');
    }

    set balanceCrypto(balance) {
        this.$balanceCrypto.textContent = balance;
    }

    set balanceFiat(balance) {
        this.$balanceFiat.textContent = balance;
    }

    set amountCrypto(amount) {
        this.$amountCrypto.textContent = amount;
    }

    set amountFiat(amount) {
        this.$amountFiat.textContent = amount;
    }

    onAmountChanged(callback) {
        $keyboard.addEventListener('value', e => callback(e.detail))
    }

    onRequest(callback) {
        this.$btnRequest.addEventListener('click', callback);
    }

    onPay(callback) {
        this.$btnPay.addEventListener('click', callback);
    }

}


class ViewRequest extends View {

    constructor() {
        super('.request--popup');
        this.$amountCrypto = this.$('.request-amount--crypto');
        this.$amountFiat = this.$('.request-amount--fiat');
        this.$confirmButton = this.$('.request--button');
        this.$declineButton = this.$('.request--decline');
    }

    set amountCrypto(amount) {
        this.$amountCrypto.textContent = amount
    }

    set amountFiat(amount) {
        this.$amountFiat.textContent = amount
    }

    onPaymentConfirmed(callback) {
        this.$confirmButton.addEventListener('click', callback);
    }

    onDecline(callback) {
        this.$declineButton.addEventListener('click', callback);
    }
}

class ViewReceive extends View {

    constructor() {
        super('.receive--popup');
        this.$receiveBtn = this.$('.receive--button');

        this.$amountFiat = this.$('.receive-value--fiat');
        this.$amountCrypto = this.$('.receive-value--btc');
    }

    onConfirmed(callback) {
        this.$receiveBtn.addEventListener('click', callback);
    }


    set amountCrypto(amount) {
        this.$amountCrypto.textContent = amount;
    }

    set amountFiat(amount) {
        this.$amountFiat.textContent = amount;
    }

}

export const Views = {
    Request: new ViewRequest(),
    Receive: new ViewReceive(),
    Home: new ViewHome(),
}