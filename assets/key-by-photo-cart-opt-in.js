const KeyByPhotoCartOptIn = class extends HTMLElement {
  constructor () {
    super()

    this.lineItemKey = this.dataset.lineItemKey
    this.optOutBtn = this.querySelector('[data-key-by-photo-cart-opt-out]')

    this.initKeyByPhotoCartOptIn()
  }

  /**
   * Initializes all functionality
   */
  initKeyByPhotoCartOptIn () {
    try {
      this.optOutFunctionality()
    } catch (error) {
      console.error('There was an issue with the Key By Photo Opt-In:', error)
    }
  }

  /**
   * Setup event listener for opt-out button
   */
  optOutFunctionality () {
    if (!this.optOutBtn) { return }

    this.optOutBtn.addEventListener('click', () => {
      this.optOutBtn.setAttribute('aria-busy', true)
      this.addOptedOutProperty()
    })
  }

  /**
   * Add '_no-key-by-photo' line item property to prevent warning from reappearing
   */
  async addOptedOutProperty () {
    const data = {
      id: this.lineItemKey,
      properties: { '_no-key-by-photo': true }
    }

    await fetch(window.Shopify.routes.root + 'cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(data => {
      console.log(data)

      this.optOutBtn.removeAttribute('aria-busy')
      this.classList.add('hidden')
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error)
    })
  }
}

if (typeof window.customElements.get('key-by-photo-cart-opt-in') === 'undefined') {
  window.customElements.define('key-by-photo-cart-opt-in', KeyByPhotoCartOptIn)
}