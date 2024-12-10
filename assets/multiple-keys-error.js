const MultipleKeysError = class extends HTMLElement {
  constructor () {
    super()

    this.checkoutButtons = document.querySelectorAll('button[name="checkout"]')

    this.initKeyByPhotoCartOptIn()
  }

  /**
   * Initializes all functionality
   */
  initKeyByPhotoCartOptIn () {
    try {
      this.disableCheckoutButtons()
    } catch (error) {
      console.error('There was an issue with the Multiple Keys Error snippet:', error)
    }
  }

  /**
   * Disables checkout buttons
   */
  disableCheckoutButtons () {
    if (this.checkoutButtons.length < 1) { return }

    this.checkoutButtons.forEach((checkoutButton) => {
      checkoutButton.disabled = true
      checkoutButton.classList.add('button--subdued')
    })
  }
}

if (typeof window.customElements.get('multiple-keys-error') === 'undefined') {
  window.customElements.define('multiple-keys-error', MultipleKeysError)
}