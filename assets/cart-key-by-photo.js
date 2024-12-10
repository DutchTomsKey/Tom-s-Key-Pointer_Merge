const CartKeyByPhoto = class extends HTMLElement {
  constructor () {
    super()

    this.cartAttribute = this.dataset.cartKeyByPhotoCartAttribute
    this.maxImageCount = this.dataset.cartKeyByPhotoMaxImageCount
    this.cartForm = this.querySelector('form')
    this.changeImageBtn = this.querySelector('[data-cart-key-by-photo-change]')

    this.initCartKeyByPhoto()
  }

  /**
   * Initializes all functionality
   */
  initCartKeyByPhoto () {
    if (this.cartForm) {
      this.uploadEvents()
    }

    if (this.changeImageBtn) {
      this.handleChange()
    }
  }

  /**
   * Upload-Lift widget event listeners
   */
  uploadEvents () {
    this.cartForm.addEventListener('upload:added', (event) => {
      this.updateCartAttribute()
    })

    this.cartForm.addEventListener('upload:removed', (event) => {
      this.updateCartAttribute()
    })
  }

  /**
   * Updates cart attributes
   */
  async updateCartAttribute () {
    const formFields = this.cartForm.querySelectorAll(`[name^="attributes[${this.cartAttribute}"]`)
    const formData = new FormData(this.cartForm);

    // Set all remaining photo attributes to empty string (to remove)
    for (let i = formFields.length + 1; i <= this.maxImageCount; i++) {
      formData.append(`attributes[${this.cartAttribute}_${i}]`, '')
    }

    await fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(data => {
      console.log(data)
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error)
    })
  }

  /**
   * Handles change button click, shows Upload-Lift widget
   */
  handleChange () {
    this.changeImageBtn.addEventListener('click', () => {
      this.updateCartAttribute('')
      this.classList.remove('cart-key-by-photo--cart-attribute-exists')
    })
  }
}

if (typeof window.customElements.get('cart-key-by-photo') === 'undefined') {
  window.customElements.define('cart-key-by-photo', CartKeyByPhoto)
}