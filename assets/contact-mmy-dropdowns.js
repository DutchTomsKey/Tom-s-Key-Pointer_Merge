(() => {
  if (typeof window.customElements.get('contact-mmy-dropdowns') !== 'undefined') { return }
  window.customElements.define('contact-mmy-dropdowns', class ContactMMYDropdowns extends HTMLElement {
    constructor () {
      super()

      this.mmyData = null
      this.makeSelect = this.querySelector('select[name="contact[make]"]')
      this.modelSelect = this.querySelector('select[name="contact[model]"]')
      this.yearSelect = this.querySelector('select[name="contact[year]"]')
      this.stepperProgressInput = this.querySelector('input[name="contact[stepper-progress]"]')

      this.mmyDropdownsInit()
    }

    /**
     * Initializes all functionality
     */
    async mmyDropdownsInit () {
      try {
        await this.fetchMMY()
        this.setupMakeDropdown()
        this.setupDropdownListeners()
        this.checkMMYQueryParams()
        this.checkStepperProgressParam()
      } catch (error) {
        console.error('Failed to initialize MMY dropdowns:', error)
      }
    }

    /**
     * Asynchronously fetches data from a given URL and returns the parsed JSON data.
     * @returns {Promise<Object>} A promise that resolves to the fetched JSON data.
     */
    async fetchMMY () {
      const response = await fetch('//tomskey.com/cdn/shop/t/45/assets/ymm-tomskey.json?v=62678035578945609441723232137')

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      this.mmyData = await response.json()
    }

    /**
     * Build make dropdown with fetched MMY data.
     */
    setupMakeDropdown () {
      this.mmyData.forEach((make) => {
        if (!make.make) { return }

        const option = document.createElement('option')

        option.value = make.make.trim()
        option.textContent = make.make.trim()

        this.makeSelect.appendChild(option)
      })
    }

    /**
     * Listen for make/model changes and build model/year dropdowns with filtered MMY data.
     */
    setupDropdownListeners () {
      this.makeSelect.addEventListener('change', () => {
        this.modelSelect.innerHTML = '<option value="" disabled selected></option>'
        this.yearSelect.innerHTML = '<option value="" disabled selected></option>'

        const selectedMake = this.makeSelect.value
        const models = this.mmyData.find(m => m.make && m.make.trim() === selectedMake)?.modelList || []

        models.forEach((model) => {
          if (!model.model) { return }

          const option = document.createElement('option')

          option.value = model.model.trim()
          option.textContent = model.model.trim()

          this.modelSelect.appendChild(option)
        })
      })

      this.modelSelect.addEventListener('change', () => {
        this.yearSelect.innerHTML = '<option value="" disabled selected></option>'

        const selectedMake = this.makeSelect.value
        const selectedModel = this.modelSelect.value
        const years = this.mmyData.find(m => m.make && m.make.trim() === selectedMake)
          ?.modelList.find(md => md.model.trim() === selectedModel)
          ?.yearsList || []

        years.forEach((year) => {
          const option = document.createElement('option')

          option.value = year.trim()
          option.textContent = year.trim()

          this.yearSelect.appendChild(option)
        })
      })

      this.yearSelect.addEventListener('change', () => {
        this.setStepperProgressInput()
      })
    }

    /**
     * Checks for MMY query params and pre-selects dropdowns if they exist.
     * Example: ?make=Honda&model=Accord&year=2008
     */
    checkMMYQueryParams () {
      const searchParams = new URLSearchParams(window.location.search)

      const setSelectOption = (select, paramName) => {
        if (!searchParams.has(paramName)) { return false }

        const paramValue = searchParams.get(paramName)
        const matchingOption = Array.from(select.options).some(option => option.value === paramValue)

        if (!matchingOption) { return false }

        select.value = paramValue
        select.dispatchEvent(new Event('change', { 'bubbles': true }))

        return true
      }

      if (!setSelectOption(this.makeSelect, 'make')) { return }
      if (!setSelectOption(this.modelSelect, 'model')) { return }

      setSelectOption(this.yearSelect, 'year')

      this.setStepperProgressInput()
    }

    /**
     * Sets hidden input value with Convermax vehicle data.
     */
    setStepperProgressInput () {
      const convermaxVehicles = window.Convermax?.getVehicleList() || []
      const vehicle = convermaxVehicles.find(v => v.Make === this.makeSelect.value && v.Model === this.modelSelect.value && v.Year === this.yearSelect.value)

      console.log('contact', {vehicle})

      if (!vehicle) {
        this.stepperProgressInput.value = ''
        return
      } else {
        const convermaxEncoded = JSON.stringify(vehicle).replace(/"/g, '&quot;')
        this.stepperProgressInput.value = convermaxEncoded
      }
    }

    /**
     * Checks for stepperProgress query param and sets up hidden input with convermax data if exists.
     * Example:
     *  ?stepperProgress=true
     *  <input type="hidden" name="contact[stepperProgress]" value="{"Year":"2015","Make":"Ford","Model":"F-150"}">
     */
    checkStepperProgressParam () {
      const searchParams = new URLSearchParams(window.location.search)

      if (!searchParams.has('stepperProgress')) { return }

      // Verify convermax is loaded and has the getVehicle method
      if (!window.Convermax || typeof window.Convermax.getVehicle !== 'function') { return }

      try {
        const convermaxVehicleData = window.Convermax.getVehicle()

        if (!convermaxVehicleData) { return }

        const convermaxString = JSON.stringify(convermaxVehicleData)
        const convermaxEncoded = convermaxString.replace(/"/g, '&quot;')

        this.stepperProgressInput.value = convermaxEncoded
      } catch (error) {
        console.error('Failed to fetch vehicle data from Convermax', error)
      }
    }

    /**
     * Programmatically sets the make, model, and year dropdowns.
     * @param {string} make - The make to set.
     * @param {string} model - The model to set.
     * @param {string} year - The year to set.
     */
    setMakeModelYear(make, model, year) {
      const setSelectOption = (select, value) => {
        const matchingOption = Array.from(select.options).some(option => option.value === value);

        if (!matchingOption) { return false; }

        select.value = value;
        select.dispatchEvent(new Event('change', { 'bubbles': true }));

        return true;
      }

      if (!setSelectOption(this.makeSelect, make)) { return; }
      if (!setSelectOption(this.modelSelect, model)) { return; }

      setSelectOption(this.yearSelect, year);
    }
  })
})()
