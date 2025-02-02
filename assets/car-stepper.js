/**
 * Handles the car selection process by fetching data, filtering it based on user input,
 * and managing the UI state of the selection process.
 */
class CarSelector {
  constructor() {
    this.data = null;
    this.currentMake = null;
    this.currentModel = null;
    this.selectedVehicle = {}
    this.step = 1;
    this.totalActualSteps = 14;
    this.isOptionSelected = false;
    this.init();
    this.inMMY = true;
    this.inCartBuilder = false;
    this.cartBuilderStep = null;
    this.cartBuilder = {
      whichKey: {
        selected: false,
        value: null,
        title: window.stepperSettings.which_key_title,
        copy: window.stepperSettings.which_key_description,
        type: 'selectWhich'
      },
      whichFob: {
        selected: false,
        value: null,
        title: window.stepperSettings.which_fob_title,
        copy: window.stepperSettings.which_fob_description,
        type: 'selectWhich'
      },
      howManyKeys: {
        selected: false,
        value: null,
        title: window.stepperSettings.how_many_keys_title,
        copy: window.stepperSettings.how_many_keys_description,
        image: window.stepperSettings.how_many_keys_image,
        type: 'media_with_options',
        options: {
          one: '1',
          two: '2',
          more: 'More'
        }
      },
      howManyFobs: {
        selected: false,
        value: null,
        title: window.stepperSettings.how_many_fobs_title,
        copy: window.stepperSettings.how_many_fobs_description,
        image: window.stepperSettings.how_many_fobs_image,
        type: 'media_with_options',
        options: {
          one: '1',
          two: '2',
          more: 'More'
        }
      },
      keyByPhoto: {
        selected: false,
        value: null,
        title: window.stepperSettings.key_by_photo_title,
        copy: window.stepperSettings.key_by_photo_description,
        video: window.stepperSettings.key_by_photo_video,
        type: 'media_with_options',
        options: {
          yes: "Add Key By Photo",
          no: "No thanks"
        }
      },
      extras: {
        selected: false,
        value: null,
        title: window.stepperSettings.extras_title,
        copy: window.stepperSettings.extras_description,
        type: 'products'
      },
      yourResults: {
        selected: false,
        value: null,
        title: window.stepperSettings.your_results_title,
        copy: window.stepperSettings.your_results_description,
        type: 'products',
        yourResults: true
      },
      importantInformation: {
        selected: false,
        value: null,
        title: window.stepperSettings.important_information_title,
        copy: '',
        type: 'informational'
      }
    };
    this.searchResults = null;
    this.vehicleImage = null;
    this.showExtras = window.stepperSettings.extras.length;
  }

  /**
   * Initializes the car selector by fetching data and setting up UI event listeners.
   */
  async init() {
    try {
      await this.fetchYMM();
      this.setupEventListeners();
      this.populateButtons();
      this.updateProgressBar();
      this.updateReportProblemLink();
      this.updateVehicleFromUrlParams();
      this.reportProblemLinkInit()
    } catch (error) {
      console.error('Failed to initialize car selector:', error);
    }
  }

  /**
   * Checks if convermax vehicle facets are set as URL params and updates the stepper.
   */
  updateVehicleFromUrlParams () {
    const urlParams = new URLSearchParams(window.location.search);
    const make = urlParams.get('Make');
    const model = urlParams.get('Model');
    const year = urlParams.get('Year');

    if (!make && !model && !year) return false

    // Remove search params from URL
    window.history.replaceState({}, document.title, window.location.pathname);

    this.setConvermaxVechicle(make, model, year)
  }

  /**
   * Sets the convermax vehicle and updates the stepper
   * @param {string} make The vehicle make.
   * @param {string} model The vehicle model.
   * @param {string} year The vehicle year.
   */
  setConvermaxVechicle(make, model, year) {
    if (!make && !model && !year) return false

    const convermaxVehicles = window.Convermax?.getVehicleList() || [];
    const vehicle = convermaxVehicles.find(vehicle => vehicle.Make === make && vehicle.Model === model && vehicle.Year === year);

    if (vehicle) {
      Object.keys(vehicle).forEach(key => {
        if (key === 'Make') {
          this.selectedVehicle.make = vehicle[key];
        } else if (key === 'Model') {
          this.selectedVehicle.model = vehicle[key];
        } else if (key === 'Year') {
          this.selectedVehicle.year = vehicle[key];
        } else {
          this.selectedVehicle[key.toLowerCase()] = vehicle[key];
        }
      })
    } else {
      this.selectedVehicle.make = make;
      this.selectedVehicle.model = model;
      this.selectedVehicle.year = year;
    }

    this.reInitStepper();
    this.expandStepper();
  }

  /**
   * Updates the stepper to the selected Convermax vehicle or MMY.
   */
  reInitStepper() {
    const {make, model, year} = this.selectedVehicle;

    const prevBtn = document.getElementById('stepperPrevBtn');

    this.currentMake = make ? this.data.find(car => String(car.make).trim() === String(make).trim()) : null;
    this.selectedVehicle.make = make;
    this.currentModel = (model && this.currentMake?.modelList.length) ? this.currentMake.modelList.find(_model =>  String(_model.model).trim() === model) : null;
    this.selectedVehicle.model = model;
    this.selectedVehicle.year = year;

    if (make && model && year) {
      this.step = Object.keys(this.selectedVehicle).length + 1;
    } else if (make && model) {
      this.step = 3;
    } else if (make) {
      this.step = 2;
    }

    prevBtn.disabled = false;

    this.populateButtons();
    this.updateProgressBar();
    this.updateReportProblemLink();
  }

  /**
   * Asynchronously fetches data from a given URL and returns the parsed JSON data.
   * @returns {Promise<Object>} A promise that resolves to the fetched JSON data.
   */
  async fetchYMM() {
    const response = await fetch("//tomskey.com/cdn/shop/t/45/assets/ymm-tomskey.json?v=62678035578945609441723232137");

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    this.data = await response.json();
  }

  /**
   * Sets up event listeners for UI interactions.
   */
  setupEventListeners() {
    const searchInput = document.getElementById('stepperSearchInput');
    const prevBtn = document.getElementById('stepperPrevBtn');
    const nextBtn = document.getElementById('stepperNextBtn');
    const expander = document.getElementById('stepperExpander');
    const exitStepperButton = document.querySelector('[data-car-stepper] [data-exit-stepper]');
    const exitReturnButton = document.querySelector('[data-close-stepper-modal] [data-return-button]');
    const exitReturnHeaderButton = document.querySelector('[data-close-stepper-modal] [data-close-button]');
    const exitViewAllButton = document.querySelector('[data-close-stepper-modal] [data-view-all-button]');
    const changeVehicleReturn = document.querySelector('[data-stepper-change-vehicle] [data-return-button]');
    const changeVehicleChange = document.querySelector('[data-stepper-change-vehicle] [data-change-button]');
    const openChangeVehicle = document.querySelector('[data-selected-vehicle-container] [data-change-trigger]');
    const closeChangeVehicle = document.querySelector('[data-stepper-change-vehicle] [data-close-button]');
    const allResultsExitButton = document.querySelector('[data-all-results-state] [data-close-button]');
    const allResultsReturnButton = document.querySelector('[data-all-results-state] [data-return-button]');
    const unableToProceedCloseButton = document.querySelector('[data-unable-to-proceed-stepper-modal] [data-close-button]');
    const unableToProceedReturnButton = document.querySelector('[data-unable-to-proceed-stepper-modal] [data-return-button]');
    const educateReturnButton = document.querySelector('[data-stepper-educate] [data-educate-return-button]');
    const addAllToCartButton = document.querySelector('[data-add-all-to-cart]');
    const allAvailableLink = document.querySelector('[data-all-available-link]');
    const noResultsBackButton = document.querySelector('[data-no-results-back-button]');
    const continueToInstructionsButton = document.querySelector('[data-continue-to-instructions]');
    const mmyContainer = document.querySelector('[data-mmy-container] [data-buttons-container]');

    searchInput.addEventListener('input', () => this.handleInput(searchInput.value));
    prevBtn.addEventListener('click', () => this.handlePrevClick());
    nextBtn.addEventListener('click', () => this.handleNextClick());
    searchInput.addEventListener('focus', () => this.expandStepper());
    expander.addEventListener('click', () => this.expandStepper());
    mmyContainer.addEventListener('click', () => this.expandStepper());
    exitStepperButton.addEventListener('click', () => this.openExitStepperModal());
    exitReturnButton.addEventListener('click', () => this.closeExitStepperModal());
    exitReturnHeaderButton.addEventListener('click', () => this.closeExitStepperModal());
    changeVehicleReturn.addEventListener('click', () => this.exitChangeVehicle());
    changeVehicleChange.addEventListener('click', () => {
      this.exitChangeVehicle();
      this.resetStepper();
    });
    openChangeVehicle.addEventListener('click', () => {
      const changeVehicleModal = document.querySelector('[data-stepper-change-vehicle]');
      changeVehicleModal.style.display = 'flex';
    });
    closeChangeVehicle.addEventListener('click', () => this.exitChangeVehicle());
    exitViewAllButton.addEventListener('click', () => this.openShowAllResultsModal());
    allResultsExitButton.addEventListener('click', () => this.closeShowAllResultsModal());
    allResultsReturnButton.addEventListener('click', () => this.closeShowAllResultsModal());
    unableToProceedCloseButton.addEventListener('click', () => this.closeUnableToProceedModal());
    unableToProceedReturnButton.addEventListener('click', () => this.closeUnableToProceedModal());
    addAllToCartButton.addEventListener('click', () => this.addAllToCart());
    allAvailableLink.addEventListener('click', () => this.openShowAllResultsModal());
    noResultsBackButton.addEventListener('click', () => this.hideNoResultsState());
    educateReturnButton.addEventListener('click', () => this.closeEducateState());
    continueToInstructionsButton.addEventListener('click', () => this.handleNextClick());
  }

  /**
   * Handles user input to filter car data based on the selection step.
   * @param {string} input The user input for filtering the data.
   */
  handleInput(input) {
    const filteredData = this.filterData(input);
    this.updateButtonsContainer(filteredData, input);
  }

  /**
   * Toggles the visibility of the stepper container.
   */
  expandStepper() {
    const stepperContainer = document.querySelector('[data-stepper-container] [data-car-stepper-inner]');
    const stepperExpander = document.getElementById('stepperExpander');
    stepperContainer.classList.remove('collapsed');
    stepperExpander.classList.remove('collapsed');
  }

  /**
   * Filters the car data based on the input and the current step in the selection process.
   * @param {string} input The user input for filtering the data.
   * @returns {Array<Object>} An array of filtered car data based on the current step.
   */
  filterData(input) {
    let lowerInput = input.toLowerCase();
    switch (this.step) {
      case 1:
        return this.data.filter(car => car?.make?.toLowerCase().startsWith(lowerInput));
      case 2:
        return this.currentMake.modelList.filter(model => model.model.toLowerCase().startsWith(lowerInput));
      case 3:
        return this.currentModel.yearsList.filter(year => year.toLowerCase().startsWith(lowerInput));
      default:
        return [];
    }
  }

  /**
   * Updates the buttons container with filtered data or resets it based on user input.
   * @param {Array<Object>} filteredData The filtered data to display.
   * @param {string} input The user input.
   */
  updateButtonsContainer(filteredData, input) {
    const buttonsContainer = document.querySelector('[data-mmy-container] [data-buttons-container]');
    buttonsContainer.innerHTML = '';

    if (input === '') {
      this.populateButtons();
      return;
    }

    let container = document.createElement('div');
    filteredData.forEach(item => {
      const text = this.step === 1 ? item.make : this.step === 2 ? item.model : item;
      container.appendChild(this.createButton(text));
    });

    container.classList.add('button-options');
    buttonsContainer.appendChild(container);
  }

  /**
   * Handles the event when the "Previous" button is clicked.
   */
  handlePrevClick() {
    const searchInput = document.getElementById('stepperSearchInput');
    const prevBtn = document.getElementById('stepperPrevBtn');

    const mobileSkipButtonContainer = document.querySelector('[data-mobile-skip-button-container]');
    mobileSkipButtonContainer.innerHTML = '';

    searchInput.value = '';
    if (this.step > 1) {
      prevBtn.disabled = false

      if (this.step === this.totalActualSteps) {
        document.querySelector('[data-add-all-to-cart-container]').style.display = 'none';
        document.querySelector('[data-selected-vehicle-container]').style.display = 'flex';

        this.updateNextButtonOriginalState();
      }

      if(this.step === this.cartBuilderStep) {
        this.inCartBuilder = false;
        this.cartBuilderStep = null;
      }

      this.step--;

      if (this.step === 1) {
        this.currentModel = null;
        this.selectedVehicle.model = null;
        prevBtn.disabled = true;
      } else if (this.step === 2) {
        this.selectedVehicle.year = null;
      }

      if (this.inCartBuilder) {
        const keys = Object.keys(this.cartBuilder).reverse();
        
        let lastSelectedKey = null;
        for (const key of keys) {
          if (this.cartBuilder[key].selected) {
            lastSelectedKey = key;
            break;
          }
        }

        console.log('last selected key is', lastSelectedKey)

        if (lastSelectedKey) {
          const lastSelectedIndex = keys.indexOf(lastSelectedKey);
          const previousSelectedKey = null//keys[lastSelectedIndex + 1];

          this.cartBuilder[lastSelectedKey].selected = false;

          if (previousSelectedKey) {
            this.cartBuilder[previousSelectedKey].selected = false;
          }
        }

        if (this.cartBuilderStep === this.step) {
          this.inCartBuilder = false;
          this.cartBuilderStep = null;
        }
      } else if (!this.inMMY) {
        document.querySelector('[data-product-finder-container] [data-buttons-container]').style.display = 'flex';
        document.querySelector('[data-products-container]').style.display = 'none';
      }

      const addAllToCartButton = document.querySelector('[data-add-all-to-cart]');
      addAllToCartButton.textContent = 'Add All To Cart';
      addAllToCartButton.disabled = false;

      this.populateButtons();
      this.updateProgressBar();
    }
  }

  /**
   * Handles the event when the "Next" button is clicked.
   */
  handleNextClick() {
    const searchInput = document.getElementById('stepperSearchInput');
    const nextBtn = document.getElementById('stepperNextBtn');
    const prevBtn = document.getElementById('stepperPrevBtn');
    const buttonsContainer = document.querySelector('[data-product-finder-container] [data-buttons-container');
    buttonsContainer.classList.remove('image-options');

    nextBtn.disabled = true;

    const mobileSkipButtonContainer = document.querySelector('[data-mobile-skip-button-container]');
    mobileSkipButtonContainer.innerHTML = '';

    if (nextBtn.dataset.cart === 'true') {
      window.location.href = '/cart';
      return;
    }

    if (this.isOptionSelected) {
      searchInput.value = '';
      this.step++;
      prevBtn.disabled = false;
      this.updateProgressBar();

      if (this.inMMY) {
        this.populateButtons();
      } else if (this.inCartBuilder) {
        const selectedButton = document.querySelector('.button-selected');
        const cartBuilderKey = selectedButton.dataset.cartBuilderKey;
        const inputElement = document.querySelector('[data-product-finder-container] input');

        if (inputElement && inputElement.value) {
          this.cartBuilder[cartBuilderKey].value = inputElement.value;
        } else if (selectedButton.textContent) {
          this.cartBuilder[cartBuilderKey].value = selectedButton.textContent;
        }

        this.cartBuilder[cartBuilderKey].selected = true;

        this.displayCurrentQuestion();
      } else {
        this.displayCurrentQuestion();
      }

      this.isOptionSelected = false;
    }
  }

  setVehicle(data) {
    if (!data?.Facets) return

    // Create new vehicle
    const vehicleData = {}

    for (const facet of data.Facets) {
      if (facet.Selection.length) {
        vehicleData[facet.FieldName] = facet.Selection[0].Value;
      }
    }

    window.Convermax.setVehicle(vehicleData);
  }

  /**
   * Populates the buttons container based on the current selection step and the available data.
   */
  populateButtons() {
    const buttonsContainer = document.querySelector('[data-mmy-container] [data-buttons-container');
    this.clearContainers();
    const nextBtn = document.getElementById('stepperNextBtn');
    nextBtn.classList.remove('disabled');

    const topBrands = ['Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC', 'Honda', 'Jeep', 'Nissan', 'RAM', 'Toyota'];
    const allCarData = this.data.filter(car => !!car.make);
    const topBrandsData = allCarData.filter(car => topBrands.includes(car.make.trim()));

    const appendSection = (title, items, itemHandler, options = {}) => {
      const { showAllYearsButton = false } = options;
      const section = this.createSection(title, items, itemHandler, showAllYearsButton);
      buttonsContainer.appendChild(section);
    };

    switch (this.step) {
      case 1:
        document.querySelector('[data-mmy-container]').style.display = 'block';
        document.querySelector('[data-product-finder-container]').style.display = 'none';
        this.inMMY = true;
        if (topBrandsData.length > 0) {
          appendSection('Top Brands', topBrandsData, car => this.createButton(car.make, null, car.make === this.currentMake?.make));
        }
        if (allCarData.length > 0) {
          appendSection('All Makes', allCarData, car => this.createButton(car.make, null, car.make === this.currentMake?.make));
        }
        break;
      case 2:
        if (this.currentMake) {
          appendSection('All Models', this.currentMake.modelList, model => this.createButton(model.model, null, model.model === this.currentModel?.model));
        }
        break;
      case 3:
        document.querySelector('[data-mmy-container]').style.display = 'block';
        document.querySelector('[data-product-finder-container]').style.display = 'none';
        this.displayQuestionTitle(window.stepperSettings.stepper_title);
        this.inMMY = true;
        const yearsReversed = this.currentModel.yearsList.slice().reverse();
        if (this.currentModel) {
          appendSection('All Years', yearsReversed, year => this.createButton(year), { showAllYearsButton: true });
        }
        break;
      default:
        this.displayCurrentQuestion();
    }

    this.displaySelected();

    document.querySelector('[data-mmy-container] [data-buttons-container]').scrollTop = 0;
  }

  /**
   * Clears all button elements and titles from the buttons container.
   */
  clearContainers() {
    const buttonsContainer = document.querySelector('[data-mmy-container] [data-buttons-container]');
    const productFinderQuestion = document.querySelector('[data-product-finder-container] [data-question-container]');
    const productFinderButons = document.querySelector('[data-product-finder-container] [data-buttons-container]');
    buttonsContainer.innerHTML = '';
    productFinderQuestion.innerHTML = '';
    productFinderButons.innerHTML = '';
    const titles = document.querySelectorAll('.buttons-title');
    titles.forEach(title => title.remove());
  }

  /**
   * Displays the currently selected make and model as badges in the selected container.
   */
  displaySelected() {
    const selectedContainer = document.querySelector('[data-selected-container]');
    selectedContainer.innerHTML = '';
    if (this.currentMake && this.step > 1) {
      const makeBadge = document.createElement('span');
      makeBadge.textContent = this.currentMake.make;
      makeBadge.className = 'badge';
      selectedContainer.appendChild(makeBadge);
    }
    if (this.currentModel && this.step > 2) {
      const modelBadge = document.createElement('span');
      modelBadge.textContent = this.currentModel.model;
      modelBadge.className = 'badge';
      selectedContainer.appendChild(modelBadge);
    }
  }

  /**
   * Creates a button element with the specified text and click handler.
   * @param {string} text The text to display on the button.
   * @param {Function} [onClick=null] The function to call when the button is clicked.
   * @param {boolean} [isActive=false] Flag to set the button as active.
   * @param {string} [cartBuilderKey=null] The key for updating cartBuilder when in cart builder phase.
   * @returns {HTMLButtonElement} The created button element.
   */
  createButton(text, onClick = null, isActive = false, cartBuilderKey = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = isActive ? 'button-selected' : '';

    if (cartBuilderKey) {
      button.dataset.cartBuilderKey = cartBuilderKey;
    }

    if (isActive) {
      this.isOptionSelected = true;
      this.handleOptionSelection();
    }

    button.onclick = (e) => {
      if (onClick) {
        onClick(e);
      } else {
        const currentlySelected = document.querySelector('.button-selected');
        if (currentlySelected) {
          currentlySelected.classList.remove('button-selected');
        }

        button.classList.add('button-selected');

        if (this.step === 1) {
          this.currentMake = this.data.find(car => car.make === text);
          this.selectedVehicle.make = text;
          button.dataset.facetName = 'make';
          button.dataset.facetValue = text.trim();
        } else if (this.step === 2) {
          this.currentModel = this.currentMake.modelList.find(model => model.model === text);
          this.selectedVehicle.model = text;
          button.dataset.facetName = 'model';
          button.dataset.facetValue = text.trim();
        } else if (this.step === 3) {
          this.selectedVehicle.year = text;
          button.dataset.facetName = 'year';
          button.dataset.facetValue = text.trim();
        }

        this.handleOptionSelection(e);
        this.updateReportProblemLink();
        this.handleNextClick();
      }
    };
    return button;
  }

  /**
   * Creates a button element with an image above and the specified text below.
   * @param {Object} option The option object containing the image source and text.
   * @returns {HTMLButtonElement} The created button element with an image and text.
   */
  createImageButton(option) {
    const button = document.createElement('button');
    button.className = 'image-button';

    const img = document.createElement('img');
    img.src = this.getSizedImageUrl(option.facet_image, 500);
    button.appendChild(img);

    const text = document.createElement('span');
    text.textContent = option.value;
    button.appendChild(text);

    button.onclick = (e) => {
      const currentlySelected = document.querySelector('.button-selected');
      if (currentlySelected) {
        currentlySelected.classList.remove('button-selected');
      }

      button.classList.add('button-selected');
      this.handleOptionSelection(e);
      this.handleNextClick();
    };

    return button;
  }

  /**
   * Handles the event of selecting an option by enabling the "Next" button and setting a flag.
   */
  handleOptionSelection(e = null) {
    const currentlySelected = document.querySelector('.button-selected');

    if (!this.inCartBuilder && e !== null) {
      if (currentlySelected && currentlySelected.dataset.facetName) {
        this.selectedVehicle[currentlySelected.dataset.facetName] = currentlySelected.dataset.facetValue;
      }

      for (let i = this.step; i < Object.keys(this.selectedVehicle).length; i++) {
        delete this.selectedVehicle[Object.keys(this.selectedVehicle)[i]];
      }
    } else {
      if (e !== null) {
        const button = e.target;

        if (button.dataset.cartBuilderKey) {
          this.cartBuilder[button.dataset.cartBuilderKey].selected = true;
          this.cartBuilder[button.dataset.cartBuilderKey].value = button.textContent;
          if (button.dataset.cartBuilderKey === 'keyByPhoto' && button.textContent === "Add Key By Photo") {
            this.addKeyByPhotoProductToCart();
          }
        }
      }
    }

    this.isOptionSelected = true;
    const nextBtn = document.getElementById('stepperNextBtn');
    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');

    if (window.innerWidth < 768) {
      document.querySelector('[data-car-stepper]').scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Creates a section with a title, a list of items, and an optional button to handle all other years.
   * @param {string} titleText The title of the section.
   * @param {Array<Object>} items The items to create buttons for.
   * @param {Function} itemHandler The function to handle item button creation.
   * @param {boolean} [showAllYearsButton=false] Flag to show an "All Other Years" button.
   * @returns {HTMLDivElement} The created section element.
   */
  createSection(titleText, items, itemHandler, showAllYearsButton = false) {
    let sectionTitle = this.createTitle(titleText);
    let sectionContainer = document.createElement('div');
    sectionContainer.appendChild(sectionTitle);

    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('button-options');

    if (items && items.length > 0) {
      items.forEach(item => buttonsContainer.appendChild(itemHandler(item)));
    }
    if (showAllYearsButton) {
      const allOtherYearsButton = this.createButton("All Other Years", this.allYearsButtonClicked.bind(this));
      buttonsContainer.appendChild(allOtherYearsButton);
    }

    sectionContainer.appendChild(buttonsContainer);
    return sectionContainer;
  }

  /**
   * Redirects the user to the contact page. Intended as a click handler for the "All Other Years" button.
   */
  allYearsButtonClicked(e) {
    window.location.href = window.stepperSettings.all_other_years_link ?? '/pages/dont-see-my-car';
  }

  updateProgressBar() {
    const progressBar = document.querySelector('[data-stepper-progress-bar]');
    const totalSteps = this.totalActualSteps;
    const currentStep = this.step;
    const existingSegments = progressBar.querySelectorAll('div');

    const existingSegmentsData = [];
    existingSegments.forEach(segment => {
      existingSegmentsData.push({
        step: parseInt(segment.dataset.step),
        width: parseFloat(segment.dataset.width)
      });
    });

    progressBar.innerHTML = '';

    const createSegment = (widthPercentage, isActive, step) => {
      let segment = document.createElement('div');
      segment.style.width = `${widthPercentage}%`;
      segment.style.height = '6px';
      segment.dataset.width = widthPercentage;
      segment.dataset.step = step;
      segment.style.backgroundColor = isActive ? '#23234C' : '#fff';
      progressBar.appendChild(segment);
    };

    let totalWidth = 0;
    let segmentWidths = [];

    for (let i = 1; i <= totalSteps; i++) {
      let widthPercentage;

      const existingSegment = existingSegmentsData.find(segment => segment.step === i);
      if (existingSegment) {
        widthPercentage = existingSegment.width;
      } else {
        widthPercentage = 100 / totalSteps;
      }

      segmentWidths.push(widthPercentage);
      totalWidth += widthPercentage;
    }

    if (Math.abs(totalWidth - 100) > 0.01) {
      const adjustment = 100 - totalWidth;
      segmentWidths[segmentWidths.length - 1] += adjustment;
    }

    for (let i = 1; i <= currentStep; i++) {
      createSegment(segmentWidths[i - 1], i <= currentStep, i);
    }
  }

  /**
   * Creates a title element with the specified text.
   * @param {string} text The text for the title.
   * @returns {HTMLHeadingElement} The created title element.
   */
  createTitle(text) {
    let title = document.createElement('h2');
    title.className = 'buttons-title';
    title.textContent = text;
    return title;
  }

  /**
   * Updates the UI to display the current question with options, including handling for images and videos.
   */
  async displayCurrentQuestion() {
    this.clearContainers();
    this.inMMY = false;
    document.querySelector('[data-mmy-container]').style.display = 'none';
    document.querySelector('[data-product-finder-container]').style.display = 'block';
    let question;

    if (!this.inCartBuilder) {
      try {
        question = await this.getCurrentQuestion();
      } catch (error) {
        question = await this.generateCartBuilderQuestions();
      }
    } else {
      question = await this.generateCartBuilderQuestions();
    }

    this.displayQuestionTitle(question.title);
    this.displaySupportingCopy(question.copy);

    if (question.image) {
      this.displayMedia({type: 'image', src: question.image});
    }

    if (question.video) {
      const ytVideoId = this._extractYoutubeVideoId(question.video);

      if (typeof question.video === 'object') {
        const videoSource = question.video.sources.reduce((acc, source) => {
          if (source.format === 'mp4') {
            if (!acc.height || source.height > acc.height) {
              acc = source;
            }
          }
          return acc;
        });

        this.displayMedia({type: 'video', src: videoSource.url});
      } else if (ytVideoId) {
        this.displayMedia({type: 'video', src: `https://www.youtube.com/embed/${ytVideoId}?rel=0&modestbranding`, iframe: true});
      } else {
        this.displayMedia({type: 'video', src: question.video});
      }
    }

    if (!this.inCartBuilder) {
      this.displayAnswerOptions(question);
    } else {
      this.displayCartBuilderOptions(question);
    }

    if (question.type === 'informational') {
      // in our searchResults items, find the keytype product and show that video
      const keyTypeProduct = this.searchResults.Items.find(product => this.isProductKeyType(product) && product.VideoLink);
      if (keyTypeProduct) {
        const videoUrl = keyTypeProduct.VideoLink;
        const videoId = this._extractYoutubeVideoId(videoUrl);

        if (videoId) {
          this.displayMedia({type: 'video', src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding`, iframe: true});
        }
      }

      const mediaContainer = document.querySelector('[data-product-finder-container] [data-question-container]');
      const goToCartButton = `<a href="/cart" class="btn" style="margin-bottom: 20px;">Continue to Cart</a>`
      mediaContainer.insertAdjacentHTML('beforeend', goToCartButton);

      this.updateNextButtonForCart();
    }

    const selectedVechicleContainer = document.querySelector('[data-selected-vehicle-container]')
    selectedVechicleContainer.querySelector('.carIcon').src = this.vehicleImage;
    selectedVechicleContainer.querySelector('.selected').innerHTML = `
      ${this.selectedVehicle.year}
      ${this.selectedVehicle.make}
      ${this.selectedVehicle.model}
    `

    this.updateProgressBar();
  }


  /**
   * Retrieves the next question data based on the selected vehicle and any previous answers.
   * Utilizes the Convermax API to fetch relevant questions dynamically.
   * @returns {Promise<Object>} A promise that resolves to the next question object.
   */
  async getCurrentQuestion() {
    const baseUrl = 'https://toms-key-company.myconvermax.com/facets.json';

    const apiUrl = new URL(`${baseUrl}?facet.0.field=Year&facet.0.selection=${this.selectedVehicle.year}&facet.1.field=Make&facet.1.selection=${this.selectedVehicle.make}&facet.2.field=Model&facet.2.selection=${this.selectedVehicle.model}`);

    for (let i = 3; i < this.step - 1; i++) {
      if (this.selectedVehicle[Object.keys(this.selectedVehicle)[i]]) {
        apiUrl.searchParams.set(`facet.${i}.field`, Object.keys(this.selectedVehicle)[i]);
        apiUrl.searchParams.set(`facet.${i}.selection`, this.selectedVehicle[Object.keys(this.selectedVehicle)[i]]);
      }
    }

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    this.setVehicle(data)

    const modelFacet = data.Facets.find(facet => facet.FieldName === "Model");
    if (modelFacet && modelFacet.Selection[0]?.Selected && modelFacet.Selection[0].ImageUrl) {
      this.vehicleImage = modelFacet.Selection[0].ImageUrl;
    } else {
      this.vehicleImage = null;
    }

    const nextFacet = data.Facets.find(facet => !facet.Selection[0]?.Selected);

    let mismatchFound = false;
    if (this.step < 4) { 
      data.Facets.forEach(facet => {
        if (facet.Selection.length === 0 && this.selectedVehicle[String(facet.FieldName).toLowerCase()]) {
          console.log(`Mismatch found: ${facet.FieldName} is set in selectedVechicle but not selected in facets`);
          mismatchFound = true;
          return;
        }
      });
    }

    if (mismatchFound) {
      this.showNoResultsState();
      return;
    }

    if (!nextFacet) {
      this.inCartBuilder = true;
      this.cartBuilderStep = this.step;
      if(this.showKeyByPhoto) {
        this.totalActualSteps = this.step + 5;
      } else {
        this.totalActualSteps = this.step + 4;
      }
      throw new Error('No more questions available.');
    }

    const supportingInfo = data.Extra.QuestionExtra

    let options 

    if ('Values' in nextFacet) {
      // do all the options have an ImageUrl?
      const allOptionsHaveImage = nextFacet.Values.every(option => option.ImageUrl);
      options = nextFacet.Values.map(selection => ({
        type: allOptionsHaveImage ? 'image' : 'text',
        value: selection.Value,
        facet_name: nextFacet.FieldName,
        facet_value: selection.Term,
        facet_image: selection?.ImageUrl
      }))
    } else {
      const allOptionsHaveImage = nextFacet.Selection.every(selection => selection.ImageUrl);
      options = nextFacet.Selection.map(selection => ({
        type: allOptionsHaveImage ? 'image' : 'text',
        value: selection.Value,
        facet_name: nextFacet.FieldName,
        facet_value: selection.Term,
        facet_image: selection?.ImageUrl
      }))
    }

    const question = {
      title: `Do you have a ${nextFacet.DisplayName}?`,
      copy: supportingInfo.MainText,
      image: supportingInfo.Image ?? null,
      video: supportingInfo.Video ?? null,
      options: options,
      extraOptions: supportingInfo.ExtraOptions ?? []
    };

    return question;
  }

  /**
   * Displays the question title on the page.
   * @param {string} title The question title.
   */
  displayQuestionTitle(title) {
    const titleElement = document.querySelector('[data-question-title]');
    titleElement.textContent = title;
  }

  /**
   * Displays the supporting copy for the question.
   * @param {string} copy The supporting text.
   */
  displaySupportingCopy(copy) {
    const questionContainer = document.querySelector('[data-product-finder-container] [data-question-container]');
    const copyElement = document.createElement('p');
    copyElement.innerHTML = copy;
    questionContainer.appendChild(copyElement);
  }

  /**
   * Displays media content based on the type specified in the option.
   * @param {Object} option - An object containing the type of media, the source path, and optional handler.
   */
  displayMedia(option) {
    const mediaContainer = document.querySelector('[data-product-finder-container] [data-question-container]');
    let mediaElement;

    switch (option.type) {
      case 'image':
        mediaElement = document.createElement('img');
        mediaElement.src = this.getSizedImageUrl(option.src, 1200);
        break;
      case 'video':
        if (option.iframe) {
          mediaElement = document.createElement('iframe');
          mediaElement.src = option.src;
        } else {
          mediaElement = document.createElement('video');
          mediaElement.src = option.src;
          mediaElement.controls = true;
        }

        break;
      default:
        console.warn('Unsupported media type');
        return;
    }

    mediaContainer.appendChild(mediaElement);
  }

  displayExitStepperState(option) {
    if (option.Exit.match(/^(http|https)/)) {
      window.location.href = option.Exit;
    } else {
      const exitStepperStateModal = document.querySelector('[data-unable-to-proceed-stepper-modal]')
      exitStepperStateModal.style.display = 'flex';
      exitStepperStateModal.querySelector('h2').textContent = 'Unable to proceed'
      exitStepperStateModal.querySelector('p').textContent = option.Exit
    }
  }

  /**
   * Displays the educate state for an Educate option.
   * @param option 
   */
  displayEducateState(question, option) {
    const educateContainer = document.querySelector('[data-educate-container]')
    const educateCotinueButton = document.querySelector('[data-stepper-educate] [data-educate-continue-button]');

    educateContainer.innerHTML = `
      <header>
        <h2>${question.title}</h2>
        <h3>${option.Text}</h3>
      </header>
      <p>${option.Educate}</p>
    `;

    if (option.EducateMedia) {
      // check if Youtube video or image
      const ytVideoId = this._extractYoutubeVideoId(option.EducateMedia);
      if (ytVideoId) {
        const mediaElement = document.createElement('iframe');
        mediaElement.src = `https://www.youtube.com/embed/${ytVideoId}?rel=0&modestbranding`;
        educateContainer.insertAdjacentElement('beforeend', mediaElement);
      } else {
        const imageElement = document.createElement('img');
        imageElement.src = this.getSizedImageUrl(option.EducateMedia, 1200);
        educateContainer.insertAdjacentElement('beforeend', imageElement);
      }
    }

    if (option.Video) {
      const ytVideoId = this._extractYoutubeVideoId(option.Video);
      mediaElement = document.createElement('iframe');
      mediaElement.src = option.src;

      educateContainer.insertAdjacentElement('beforeend', mediaElement);
    }

    const optionHasExitUrl = option.Exit?.match(/^(http|https)/);
    educateCotinueButton.hidden === !optionHasExitUrl
    
    if (optionHasExitUrl) {
      educateCotinueButton.href = option.Exit;
    }

    document.querySelector('[data-car-stepper-inner]').style.display = 'none';

    const educateModal = document.querySelector('[data-stepper-educate]')
    educateModal.style.display = 'flex';
  }

  /**
   * Hides the educate step and returns to the current step
   * @returns {void}
   */
  closeEducateState() {
    document.querySelector('[data-car-stepper-inner]').style.display = 'block';
    document.querySelector('[data-stepper-educate]').style.display = 'none';
  }

  /**
   * Displays the answer options for the current question.
   * @param {Array<Object>} options The answer options for the current question.
   * @param {Array<Object>} extraOptions Additional options to display.
   */
  displayAnswerOptions(question) {
    const { options, extraOptions } = question;

    const buttonsContainer = document.querySelector('[data-product-finder-container] [data-buttons-container]');
    let button

    if (!options) {
      this.showNoResultsState();
      return;
    }

    options.forEach(option => {
      if (option.type == 'text') {
        buttonsContainer.classList.remove('image-options');
        button = this.createButton(option.value);
      } else if (option.type == 'image') {
        buttonsContainer.classList.add('image-options');

        const widthClasses = ['width-2', 'width-3', 'width-4', 'width-5'];
        widthClasses.forEach(widthClass => {
          if (buttonsContainer.classList.contains(widthClass)) {
            buttonsContainer.classList.remove(widthClass);
          }
        });

        if(options.length > 4) {
          buttonsContainer.classList.add('width-5');
        } else {
          buttonsContainer.classList.add(`width-${options.length}`);
        }
        
        button = this.createImageButton(option);
      }

      button.dataset.facetName = option.facet_name;
      button.dataset.facetValue = option.facet_value;

      if (this.selectedVehicle[option.facet_name] === option.facet_value && option.facet_value !== undefined) {
        button.classList.add('button-selected');
        this.handleOptionSelection()
      }

      const extraOption = extraOptions?.find(extra => extra.Term === option.facet_value);

      if (extraOption) {
        if (extraOption.Exit && !extraOption.Educate) {
          console.log('Exit option found');
          console.log(extraOptions, option)

          button.onclick = () => this.displayExitStepperState(extraOption);
        } else if (extraOption.Educate) {
          console.log('Educate option found');
          
          button.onclick = () => this.displayEducateState(question, extraOption);
        }
      }

      buttonsContainer.appendChild(button);
    });
  }

  /**
   * Closes the exit stepper modal and returns to the current step
   */
  closeExitStepperModal() {
    const stepperModal = document.querySelector('[data-close-stepper-modal]');
    stepperModal.style.display = 'none';
  }

  /**
   * Opens the exit stepper modal
   */
  openExitStepperModal() {
    const stepperModal = document.querySelector('[data-close-stepper-modal]');
    stepperModal.style.display = 'flex';
  }

  /**
   * Closes the change vehicle modal.
   */
  exitChangeVehicle() {
    const changeVehicleModal = document.querySelector('[data-stepper-change-vehicle]');
    changeVehicleModal.style.display = 'none';
  }

  /**
   * Closes the unable to proceed modal
   */
  closeUnableToProceedModal() {
    const unableToProceedModal = document.querySelector('[data-unable-to-proceed-stepper-modal]');
    unableToProceedModal.style.display = 'none';
  }

  /**
   * Resets the stepper
   */
  resetStepper() {
    this.step = 1;
    this.inMMY = true;
    this.inCartBuilder = false;
    this.isOptionSelected = false;
    this.totalActualSteps = 14;
    this.searchResults = null;

    this.currentMake = null;
    this.currentModel = null;

    this.selectedVehicle = {
      make: null,
      year: null,
      model: null
    };

    for (const option in this.cartBuilder) {
      this.cartBuilder[option].selected = false;
      this.cartBuilder[option].value = null;
    }

    this.clearContainers();

    this.populateButtons();
    this.updateProgressBar();
    this.displayQuestionTitle(window.stepperSettings.stepper_title);
    
    document.querySelector('[data-mmy-container]').style.display = 'block';
    document.querySelector('[data-product-finder-container]').style.display = 'none';
    document.querySelector('[data-selected-container]').innerHTML = '';
    document.querySelector('[data-product-finder-container] [data-question-container]').innerHTML = '';
    document.querySelector('[data-product-finder-container] [data-buttons-container]').innerHTML = '';
    document.querySelector('[data-product-finder-container] [data-products-container]').innerHTML = '';
    document.querySelector('[data-add-all-to-cart-container]').style.display = 'none';
    document.querySelector('[data-product-finder-container] [data-buttons-container]').style.display = 'flex';
  }

  /**
   * Fetches search results based on the selected vehicle
   * @returns {Object} The search results data.
   */
  async fetchSearchResults() {
    const baseUrl = 'https://toms-key-company.myconvermax.com/search.json';
    let apiUrl = new URL(`${baseUrl}?facet.0.field=Year&facet.0.selection=${this.selectedVehicle.year}&facet.1.field=Make&facet.1.selection=${this.selectedVehicle.make}&facet.2.field=Model&facet.2.selection=${this.selectedVehicle.model}`)

    for (let i = 3; i < this.step; i++) {
      const key = Object.keys(this.selectedVehicle)[i];
      if (this.selectedVehicle[key]) {
        // apiUrl += `&facet.${i}.field=${key}&facet.${i}.selection=${this.selectedVehicle[key]}`;
        apiUrl.searchParams.set(`facet.${i}.field`, key)
        apiUrl.searchParams.set(`facet.${i}.selection`, this.selectedVehicle[key])
      }
    }
    
    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    this.searchResults = data;

    this.showKeyByPhoto = this.hasRequiredTags(data.Items, ['KBP-Standard-Edge', 'KBP-HS-Laser']);
    this.showWhichKey = this.hasRequiredKeyProductTypes(data.Items);
    this.showWhichFob = this.hasRequiredFobProductTypes(data.Items);

    return data;
  }

  /**
   * Creates a product card element.
   * @param {Object} product The product object.
   * @param {boolean} isQuestionExtras Flag indicating if the question is for your results.
   * @param {Array<Object>} cartItems The items currently in the cart.
   * @param {Function} handleClick The function to handle the product click event.
   * @returns {HTMLDivElement} The created product card element.
   */
  createProductCard(product, isQuestionExtras, cartItems, handleClick, isSelectWhichType = false, questionName = '') {
    const productElement = document.createElement('div');
    productElement.className = 'product';

    const productImage = document.createElement('img');
    const productImageSrc = isQuestionExtras ? product.featured_image : product.image;
    productImage.src = this.getSizedImageUrl(productImageSrc, 700)
    productImage.alt = product.title;
    productElement.appendChild(productImage);

    const { keyItemProgrammer, fobItemProgrammer, keyItemSingle, fobItemSingle } = this.getSelectedKeysAndFobs();

    let qty = 0;
    if (this.isProductProgrammerType(product)) {
      qty = 1
    } else if (this.isProductKitType(product)) {
      qty = 1
    } else if (this.isProductKeyType(product)) {
      qty = product === keyItemSingle || (keyItemProgrammer && this.isProductKitType(keyItemProgrammer))
        ? this.cartBuilder.howManyKeys.value - 1
        : this.cartBuilder.howManyKeys.value;
    } else if (this.isProductFobType(product)) {
      qty = product === fobItemSingle || (fobItemProgrammer && this.isProductKitType(fobItemProgrammer))
        ? this.cartBuilder.howManyFobs.value - 1
        : this.cartBuilder.howManyFobs.value;
    }

    if (qty > 0 && questionName === 'yourResults') {
      const qtyIndicator = document.createElement('div');
      qtyIndicator.className = 'qty-indicator';
      qtyIndicator.textContent = qty;
      productElement.appendChild(qtyIndicator);
    }

    const productInfo = document.createElement('div');
    productInfo.className = 'info';

    if (window.stepperSettings.hide_product_titles === false) {
      const productTitle = document.createElement('a');
      productTitle.href = isQuestionExtras ? `/products/${product.handle}` : product.url;
      productTitle.className = 'product-title';
      productTitle.textContent = product.title;
      productInfo.appendChild(productTitle);
    }

    if (!isQuestionExtras && window.stepperSettings.hide_product_prices === false) {
      const productPrice = document.createElement('div');
      productPrice.className = 'prices';
      const compareAtPrice = document.createElement('span');
      compareAtPrice.className = 'compare-at-price';
      compareAtPrice.textContent = `$${product.compare_at_price}`;
      const currentPrice = document.createElement('span');
      currentPrice.className = 'product-price';
      currentPrice.textContent = `$${product.price}`;

      if (product.on_sale) {
        currentPrice.classList.add('on-sale');
        currentPrice.textContent += ' Sale';
        productPrice.appendChild(compareAtPrice);
      }

      productPrice.appendChild(currentPrice);
      productInfo.appendChild(productPrice);
    }

    if(!isSelectWhichType) {
      const addToCartButton = document.createElement('button');
      addToCartButton.textContent = "Add to Cart";
      addToCartButton.className = 'add-to-cart-button';

      let isInCart = false;
      const select = document.createElement('select');
      const variantIds = isQuestionExtras ? product.variants.map(_variant => _variant.id) : product.variant_ids;
      variantIds.forEach((variantId, index) => {
        select.options[index] = new Option(variantId, variantId);
      })
      select.value = variantIds[0];
      select.hidden = true

      addToCartButton.onclick = () => handleClick(addToCartButton, select.value, qty);
      isInCart = cartItems.some(item => String(item.id) === String(select.value));

      if (isInCart) {
        addToCartButton.innerHTML = "<img src='//tomskey.com/cdn/shop/t/45/assets/shopping-cart-icon.svg?v=47252457336233449231723232135' class='cart-icon' />In Cart";
        addToCartButton.classList.add('in-cart');
        addToCartButton.disabled = true;
      }

      productInfo.appendChild(select);
      productInfo.appendChild(addToCartButton);
    } else {
      productElement.onclick = handleClick;
    }

    if (productInfo.innerHTML) {
      productElement.appendChild(productInfo);
    }
    return productElement;
  }

  /**
   * Returns the selected Key and Fob products and their associated programmers.
   * If the selected key or fob is a kit, the single product is also returned.
   * @returns {Object} The selected keys and fobs.
   */
  getSelectedKeysAndFobs() {
    const keyItem = this.searchResults.Items.find(item => item.sku === this.cartBuilder.whichKey.value);
    const fobItem = this.searchResults.Items.find(item => item.sku === this.cartBuilder.whichFob.value);
    const keyItemProgrammer = this.searchResults.Items.find(item => item.sku === keyItem?.ProgrammingTool);
    const fobItemProgrammer = this.searchResults.Items.find(item => item.sku === fobItem?.ProgrammingTool);
    const keyItemSingle = keyItem && this.isProductKitType(keyItem)
      ? this.searchResults.Items.find(item => item.ProgrammingTool === keyItem?.sku)
      : null
    const fobItemSingle = fobItem && this.isProductKitType(fobItem)
      ? this.searchResults.Items.find(item => item.ProgrammingTool === fobItem?.sku)
      : null

    return {
      keyItem,
      fobItem,
      keyItemProgrammer,
      fobItemProgrammer,
      keyItemSingle,
      fobItemSingle
    }
  }

  /**
   * Opens the all results modal
   */
  async openShowAllResultsModal() {
    this.closeExitStepperModal();
    this.closeEducateState();

    const allResultsModal = document.querySelector('[data-all-results-state]');
    const productsContainer = allResultsModal.querySelector('[data-all-products]');
    productsContainer.innerHTML = '';
    allResultsModal.style.display = 'flex';

    document.querySelector('[data-car-stepper]').style.height = '850px';

    const searchResults = await this.fetchSearchResults();
    const cartItems = await this.fetchCart().then(cart => cart.items).catch(error => []);

    searchResults.Items.forEach(item => {
      const productElement = this.createProductCard(item, false, cartItems, this.handleAddToCartClick.bind(this));
      productsContainer.appendChild(productElement);
    });
  }

  /**
   * Closes the all results modal
   */
  closeShowAllResultsModal() {
    const allResultsModal = document.querySelector('[data-all-results-state]');
    allResultsModal.style.display = 'none';
    document.querySelector('[data-car-stepper]').style.height = 'auto'
  }

  /**
   * Generates questions for the cart builder.
   * @returns {Promise<Object>} A promise that resolves to the cart builder questions object.
   */
  async generateCartBuilderQuestions() {
    if (this.searchResults === null || this.searchResultFacets !== JSON.stringify(this.selectedVehicle)) {
      this.searchResults = await this.fetchSearchResults();
      this.searchResultFacets = JSON.stringify(this.selectedVehicle)
    }

    let question = Object.keys(this.cartBuilder).find(key => {
      if (key === 'extras' && !this.showExtras) {
        return false;
      }

      if (key === 'keyByPhoto' && !this.showKeyByPhoto) {
        return false;
      }

      if (key === 'whichKey' && !this.showWhichKey) {
        return false;
      }

      if (key === 'whichFob' && !this.showWhichFob) {
        return false;
      }

      if (key === 'howManyKeys' && (!this.showWhichKey || this.cartBuilder.whichKey.value === 'Skipped')) {
          return false;
      }

      if (key === 'howManyFobs' && (!this.showWhichFob || this.cartBuilder.whichFob.value === 'Skipped')) {
          return false;
      }

      if (key === 'importantInformation' && !this.showInformation) {
        return false;
      }

      return !this.cartBuilder[key].selected;
    });

    if (question) {
      this.cartBuilder[question].name = question;
      return this.cartBuilder[question];
    }
  }

  /**
   * Displays options for the cart builder.
   * @param {Object} question The question object containing options.
   */
  displayCartBuilderOptions(question) {
    let moreButton;

    if (question.type === 'selectWhich') {
      this.displaySelectWhich(question);
    } else if (question.type === 'media_with_options') {
      const productsContainer = document.querySelector('[data-product-finder-container] [data-products-container]');
      const buttonsContainer = document.querySelector('[data-product-finder-container] [data-buttons-container]');
      productsContainer.innerHTML = '';
      productsContainer.style.display = 'none';
      buttonsContainer.style.display = 'flex';

      Object.keys(question.options).forEach(name => {
        let button;

        if (name !== 'more') {
          button = this.createButton(question.options[name], null, false, question.name);
        } else {
          button = this.createButton(question.options[name], () => {
            if (document.querySelector('[data-product-finder-container] [data-buttons-container] input')) {
              return;
            }

            const input = this.createQtyInput(button);

            document.querySelector('[data-product-finder-container] [data-buttons-container').appendChild(input);
          }, false, question.name);

          moreButton = button;
        }

        if (this.cartBuilder[question.name].value === question.options[name]) {
          button.classList.add('button-selected');
          this.isOptionSelected = true;
          this.handleOptionSelection();
        }

        document.querySelector('[data-product-finder-container] [data-buttons-container').appendChild(button);
      });

      if (this.cartBuilder[question.name].value && !document.querySelector('.button-selected')) {
        const input = this.createQtyInput(moreButton);
        input.value = this.cartBuilder[question.name].value;

        moreButton.classList.add('button-selected');

        document.querySelector('[data-product-finder-container] [data-buttons-container').appendChild(input);
      }

    } else if (question.type === 'products') {
      this.displayProducts(question);
      this.handleOptionSelection();
    } else if (question.type === 'informational') {
      document.querySelector('[data-add-all-to-cart-container]').style.display = 'none';
      document.querySelector('[data-products-container]').style.display = 'none';
    } else {
      console.error('Unsupported question type');
    }
  }

  /**
   * Displays "Select Which" options for the cart builder.
   * @param {Object} question The question object containing select which options.
   */
  async displaySelectWhich(question) {
    const productsContainer = document.querySelector('[data-product-finder-container] [data-products-container]');
    const buttonsContainer = document.querySelector('[data-product-finder-container] [data-buttons-container]');
    const keyProductTypes = window.themeVariables.tk.keyProductTypes.split(',')
    const fobProductTypes = window.themeVariables.tk.fobProductTypes.split(',')
    productsContainer.innerHTML = '';

    const productTypes = question.name === 'whichKey' 
      ? keyProductTypes
      : fobProductTypes;

    const products = this.searchResults.Items.filter(product => 
      productTypes.includes(product.product_type)
    );

    if (!products || products.length === 0) {
      console.warn('No products found for the specified product types.');
      return;
    }

    const cartItems = await this.fetchCart().then(cart => cart.items).catch(error => []);

    products.forEach(product => {
      const productElement = this.createProductCard(product, false, cartItems, () => this.handleProductClick(product.sku, question.name), true, question.name);
      productsContainer.appendChild(productElement);
    });

    const selectedButton = document.createElement('button');
    selectedButton.classList.add('button-selected');
    selectedButton.classList.add('hidden');
    selectedButton.dataset.cartBuilderKey = question.name;
    productsContainer.appendChild(selectedButton);

    if (question.name === 'whichKey' && this.hasRequiredFobProductTypes(this.searchResults.Items)) {
      this.createSkipButton(question.name);
    } else if (question.name !== 'whichKey') {
      this.createSkipButton(question.name);
    }
    
    buttonsContainer.style.display = 'none';
    productsContainer.style.display = 'grid';
  }

  /**
   * Handles the event of clicking a product.
   * @param {Event} e The event object.
   * @param {string} sku The product SKU.
   * @param {string} questionName The question name.
   */
  handleProductClick(sku, questionName) {
    this.cartBuilder[questionName].value = sku;
    this.cartBuilder[questionName].selected = true;
    this.isOptionSelected = true;

    this.handleNextClick();
  }

  /**
   * Creates a skip button for the cart builder.
   * @param {string} questionName The question name.
   */
  createSkipButton(questionName) {
    const productsContainer = document.querySelector('[data-product-finder-container] [data-products-container]');

    if (questionName === 'whichKey' && !this.hasRequiredFobProductTypes(this.searchResults.Items)) {
      return;
    }

    const skipButton = document.createElement('div');
    skipButton.className = 'product skip-button';
    skipButton.onclick = () => this.handleSkipClick(questionName);

    const skipText = document.createElement('div');
    skipText.className = 'skip-text';

    const boldContainer = document.createElement('div');
    boldContainer.classList.add('bold-container');
    const boldText = document.createElement('strong');
    boldText.textContent = "Skip";
    const arrowRight = document.querySelector('.arrow-right').cloneNode(true);
    boldContainer.appendChild(boldText)
    boldContainer.appendChild(arrowRight);
    skipText.appendChild(boldContainer);

    const parenthesisText = document.createElement('div');
    parenthesisText.classList.add('parenthesis-text');
    if (questionName === 'whichKey') {
      parenthesisText.textContent = "(I don’t need a key, I only need a fob)";
    } else if (questionName === 'whichFob') {
      parenthesisText.textContent = "(I don’t need a fob, I only need a key)";
    } else if (questionName === 'extras') {
      parenthesisText.textContent = "(I don’t need any extras)";
    }
    
    skipText.appendChild(parenthesisText);
    skipButton.appendChild(skipText);
    productsContainer.appendChild(skipButton);

    // if we're on mobile we need to move the skip button up one element into the parent container
    const mobileSkipButtonContainer = document.querySelector('[data-product-finder-container] [data-mobile-skip-button-container]');
    if (window.innerWidth < 768) {
      mobileSkipButtonContainer.style.display = 'block';
      mobileSkipButtonContainer.appendChild(skipButton);
    } else {
      mobileSkipButtonContainer.style.display = 'none';
    }
  }

  /**
   * Handles the event of clicking the skip button.
   * @param {string} questionName The question name.
   */
  handleSkipClick(questionName) {
    const selectedButton = document.querySelector('.button-selected[data-cart-builder-key="' + questionName + '"]');
    
    if (questionName === 'whichKey') {
      this.cartBuilder.whichKey.selected = true;
      this.cartBuilder.whichKey.value = 'Skipped';
      this.totalActualSteps -= 1;
    } else if (questionName === 'whichFob') {
      this.cartBuilder.whichFob.selected = true;
      this.cartBuilder.whichFob.value = 'Skipped';
      this.totalActualSteps -= 1;
    } else if (questionName === 'extras') {
      this.cartBuilder.extras.selected = true;
    }

    if (selectedButton) {
      this.isOptionSelected = true;
      selectedButton.classList.add('button-selected');
      selectedButton.classList.add('hidden');
      this.handleNextClick();
    }
  }

  /**
   * Checks if the product is of key type.
   * @param {Object} product The product object.
   * @returns {boolean} True if the product is of key type, false otherwise.
   */
  isProductKeyType(product) {
    const keyTypes = window.themeVariables.tk.keyProductTypes.split(',');
    return keyTypes.includes(product.product_type);
  }

  /**
   * Checks if the product is of programmer type.
   * @param {Object} product The product object.
   * @returns {boolean} True if the product is of key type, false otherwise.
   */
  isProductProgrammerType(product) {
    const keyTypes = window.themeVariables.tk.programmerProductTypes.split(',');
    return keyTypes.includes(product.product_type);
  }

  /**
   * Checks if the product is of fob type.
   * @param {Object} product The product object.
   * @returns {boolean} True if the product is of fob type, false otherwise.
   */
  isProductFobType(product) {
    const fobTypes = window.themeVariables.tk.fobProductTypes.split(',');
    return fobTypes.includes(product.product_type);
  }

   /**
   * Checks if the product is of key Kit.
   * @param {Object} product The product object.
   * @returns {boolean} True if the product is of key type, false otherwise.
   */
   isProductKitType(product) {
    const keyTypes = window.themeVariables.tk.kitProductTypes.split(',');
    return keyTypes.includes(product.product_type);
  }

  /**
   * Displays products for the cart builder.
   * @param {Object} question The question object containing product options.
   */
  async displayProducts(question) {
    const productsContainer = document.querySelector('[data-product-finder-container] [data-products-container]');
    const buttonsContainer = document.querySelector('[data-product-finder-container] [data-buttons-container]');
    productsContainer.innerHTML = '';

    const selectedButton = document.createElement('button');
    selectedButton.classList.add('button-selected');
    selectedButton.dataset.cartBuilderKey = question.name;

    let products;

    const cartItems = await this.fetchCart().then(cart => cart.items).catch(error => []);

    if (question.yourResults) {
      productsContainer.classList.add('your-results');

      this.showInformation = this.searchResults.Items.some(product => this.isProductKeyType(product) && product.VideoLink);
      this.straightToCart = !this.showInformation;

      const {
        keyItem: selectedKeyItem,
        fobItem: selectedFobItem,
        keyItemProgrammer: selectedKeyItemProgrammer,
        fobItemProgrammer: selectedFobItemProgrammer,
        keyItemSingle,
        fobItemSingle
      } = this.getSelectedKeysAndFobs();

      const resultSkus = [selectedKeyItem?.sku, selectedFobItem?.sku, selectedKeyItemProgrammer?.sku, selectedFobItemProgrammer?.sku, keyItemSingle?.sku, fobItemSingle?.sku].filter(Boolean);

      products = this.searchResults.Items.filter(product => {
        if (resultSkus.includes(product.sku)) {
          return true;
        }

        if (!this.isProductFobType(product) && !this.isProductKeyType(product) && !this.isProductProgrammerType(product)) {
          return true
        }

        return false;
      });

      document.querySelector('[data-add-all-to-cart-container]').style.display = 'flex';
      document.querySelector('[data-selected-vehicle-container]').style.display = 'none';
      document.querySelector('[data-exit-stepper]').style.display = 'none';

      const productIds = products.map(product => Number(product.id));
      const itemsInCart = cartItems.filter(item => productIds.includes(item.product_id));

      if (itemsInCart && this.straightToCart) {
        this.updateNextButtonForCart()
      } else {
        const nextBtn = document.querySelector('#stepperNextBtn');
        nextBtn.disabled = !itemsInCart.length;
        nextBtn.classList.toggle('disabled', !itemsInCart.length);
      }
    } else {
      products = window.stepperSettings.extras;
      document.querySelector('[data-add-all-to-cart-container]').style.display = 'none';
      document.querySelector('[data-selected-vehicle-container]').style.display = 'flex';
      document.querySelector('[data-exit-stepper]').style.display = 'block';
    }

    if (!products || products.length === 0) {
      console.warn('No products found in stepper settings.');
      return;
    }

    products.forEach(product => {
      const productElement = this.createProductCard(product, !question.yourResults, cartItems, this.handleAddToCartClick.bind(this), false, question.name);
      productsContainer.appendChild(productElement);
    });

    if (question.name === 'extras') {
      this.createSkipButton(question.name);
      this.totalActualSteps = this.step + 2;
    }

    productsContainer.appendChild(selectedButton);
    buttonsContainer.style.display = 'none';
    productsContainer.style.display = 'grid';
  }

  /**
   * Handles the event of clicking the add to cart button.
   * @param {HTMLButtonElement} button The button element.
   * @param {string} variantId The variant ID.
   * @param {number} [qty=1] The quantity to add.
   * @returns {Promise<void>}
   */
  async handleAddToCartClick(button, variantId, qty = 1) {
    button.textContent = "Adding...";
    button.disabled = true;

    const nextBtn = document.querySelector('#stepperNextBtn');
    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');

    const searchResultsItem = this.searchResults.Items.find(item => item.variant_ids.includes(variantId));

    const programmerSku = searchResultsItem?.ProgrammingTool;
    const programmerItem = this.searchResults.Items.find(item => item.sku === programmerSku);
    const singleKeyItem = this.searchResults.Items.find(item => item.ProgrammingTool === searchResultsItem.sku);
    
    try {
      await this.addToCart(variantId, qty)

      button.innerHTML = "<img src='//tomskey.com/cdn/shop/t/45/assets/shopping-cart-icon.svg?v=47252457336233449231723232135' class='cart-icon' />In Cart";
      button.classList.add('in-cart');
    } catch (error) {
      console.error('Error adding product to cart:', error);
      button.textContent = "Add to Cart";
      button.disabled = false;
    }
  }

  /**
   * Adds a product to the cart.
   * @param {string} variantId The variant ID.
   * @param {number} [qty=1] The quantity to add.
   * @returns {Promise<void>}
   */
  addToCart(variantId, qty = 1) {
    const make = this.selectedVehicle.make.trim();
    const model = this.selectedVehicle.model.trim();
    const year = this.selectedVehicle.year.trim();

    const lineItemProperties = {
      _make_model_year: `${make},${model},${year}`,
      '_added-through-stepper': true
    };

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: variantId,
        quantity: qty > 0 ? qty : 1,
        properties: lineItemProperties
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Product added to cart:', data);
    })
    .catch(error => {
      console.error('Error adding product to cart:', error);
      throw error;
    });
  }

  /**
   * Fetches the current cart data.
   * @returns {Promise<Object>} A promise that resolves to the cart data.
   */
  fetchCart() {
    return fetch('/cart.js')
      .then(response => response.json())
      .then(data => data)
      .catch(error => {
        console.error('Error fetching cart:', error);
      });
  }

  /**
   * Creates a quantity input element.
   * @param {HTMLButtonElement} button The button element.
   * @returns {HTMLInputElement} The created input element.
   */
  createQtyInput(button) {
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('quantity-input');
    input.placeholder = "0";
    input.max = 10;
    input.min = 3;

    input.addEventListener('input', () => {
      if (input.value) {
        const currentlySelected = document.querySelector('.button-selected');
        if (currentlySelected) {
          currentlySelected.classList.remove('button-selected');
        }

        button.classList.add('button-selected');
        this.handleOptionSelection();
      } else {
        button.classList.remove('button-selected');
      }
    });

    return input;
  }

  /**
   * Adds all products to the cart.
   * @returns {Promise<void>}
   */
  async addAllToCart() {
    const addToCartButton = document.querySelector('[data-add-all-to-cart]');
    addToCartButton.textContent = "Adding...";
    addToCartButton.disabled = true;

    const cartData = await this.fetchCart();
    const cartItems = cartData.items;

    const products = document.querySelectorAll('[data-product-finder-container] [data-products-container] .product');

    for (const product of products) {
      const variantSelect = product.querySelector('select');
      const variantId = variantSelect.value;
      const qty = product.querySelector('.qty-indicator') ? Number(product.querySelector('.qty-indicator').textContent) : 1;
      const isInCart = cartItems.some(item => String(item.id) === String(variantId));
      const button = product.querySelector('.add-to-cart-button');

      if (!isInCart) {
        await this.handleAddToCartClick(button, variantId, qty);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    addToCartButton.textContent = "Added to Cart";

    if (this.straightToCart) {
      this.updateNextButtonForCart()
    } else {
      this.handleNextClick();
    }
  }

  /**
   * Sends a report problem request to Google Sheets then forwards to Reprot a Problem page.
   */
  reportProblemLinkInit () {
    const reportProblemLink = document.querySelector('[data-report-problem-link]');

    reportProblemLink.addEventListener('click', (event) => {
      event.preventDefault();

      const errorData = new FormData();
      errorData.append("Click", new Date());
      
      Object.entries(this.selectedVehicle).forEach(([key, value]) => {
        errorData.append(key, value);
      })

      reportProblemLink.textContent = 'Sending...';
           
      fetch("https://script.google.com/macros/s/AKfycbwfEa3NbKQ8bL5O2jvyOf1pDdcddwrxLBWGAETZIpFMstXqk1fstEcBtbU273JnrJSUlg/exec", {
        method: 'POST',
        body: errorData
      })
      .then(response => console.log(response.json()))
      .catch(error => console.error('Error:', error))
      .finally(() => {
        reportProblemLink.textContent = 'Report a Problem';
        window.location.href = reportProblemLink.href
      });
    })
  }

  /**
   * Updates the report problem link based on the selected vehicle.
   */
  updateReportProblemLink() {
    const reportProblemLink = document.querySelector('[data-report-problem-link]');
    const {make, model, year} = this.selectedVehicle;

    let url = 'https://tomskey.com/pages/report-a-problem';
    const params = [];

    if (make) {
      params.push(`make=${encodeURIComponent(make.trim())}`);
    }
    if (model) {
      params.push(`model=${encodeURIComponent(model.trim())}`);
    }
    if (year) {
      params.push(`year=${encodeURIComponent(year.trim())}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    reportProblemLink.href = url;
  }

  /**
   * Shows the no results state.
   */
  showNoResultsState() {
    document.querySelector('[data-stepper-inner]').style.display = 'none';
    
    const noResultsModal = document.querySelector('[data-stepper-no-results-container]');
    noResultsModal.style.display = 'flex';

    document.querySelector('[data-question-title]').textContent = 'No results found';

    const copy = document.createElement('p');
    copy.textContent = 'We apologize that we do not currently have specific products available for your vehicle. However, our team of experts is here to help. Please fill out the following form and we’ll gladly explore other options and provide guidance to ensure you can obtain a suitable spare key or fob for your vehicle.';
    document.querySelector('[data-stepper-header').appendChild(copy);

    document.querySelector('contact-mmy-dropdowns').setMakeModelYear(this.selectedVehicle.make, this.selectedVehicle.model, this.selectedVehicle.year);

    const submitButton = noResultsModal.querySelector('[type="submit"]');
    submitButton.onclick = async (e) => {
      e.preventDefault();
      const form = noResultsModal.querySelector('form');

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });

      if (response.ok) {
        const formHeader = document.querySelector('[data-stepper-header]');
        noResultsModal.querySelector('form').style.display = 'none';
        formHeader.querySelector('p').textContent = 'Thank you for reaching out to us. We will get back to you as soon as possible.';
        formHeader.querySelector('h2').textContent = 'We have received your request';
      }
    }
  }

  /**
   * Hides the no results state.
   */
  hideNoResultsState() {
    document.querySelector('[data-stepper-no-results-container]').style.display = 'none';
    document.querySelector('[data-stepper-inner]').style.display = 'block';
    document.querySelector('[data-stepper-header').querySelector('p').remove();

    this.resetStepper();
  }

  /**
   * Checks if any product in the search results has the required tags.
   * @param {Array<Object>} products The array of products to check.
   * @param {Array<String>} tags The array of tags to check.
   * @returns {boolean} True if any product has the required tags, false otherwise.
   */
  hasRequiredTags(products, requiredTags) {
    return products.some(product => {
      return product.tags && product.tags.some(tag => requiredTags.includes(tag));
    });
  }

  /**
   * Adds the appropriate Key by Photo product to the cart based on the tag.
   */
  async addKeyByPhotoProductToCart() {
    let productId = null;

    if (this.showKeyByPhoto) {
      const addStandardProdudct = this.searchResults.Items.some(product => {
        return product.tags && product.tags.includes('KBP-Standard-Edge');
      });

      const addLaserProduct = this.searchResults.Items.some(product => {
        return product.tags && product.tags.includes('KBP-HS-Laser');
      });

      if (addStandardProdudct) {
        productId = window.stepperSettings.kbpStandardEdgeVariantId;
      } else if (addLaserProduct) {
        productId = window.stepperSettings.kbpHsLaserVariantId;
      }

      if (productId) {
        await this.addToCart(productId, this.cartBuilder.howManyKeys.value);
      }
    }
  }

  /**
   * Checks if any product in the search results has the required key product_type.
   * @param {Array<Object>} products The array of products to check.
   * @returns {boolean} True if any product has the required product_type, false otherwise.
   */
  hasRequiredKeyProductTypes(products) {
    const requiredProductTypes =  window.themeVariables.tk.keyProductTypes.split(',')
    return products.some(product => {
      return requiredProductTypes.includes(product.product_type);
    });
  }

  /**
   * Checks if any product in the search results has the required product_type for FOB.
   * @param {Array<Object>} products The array of products to check.
   * @returns {boolean} True if any product has the required product_type, false otherwise.
   */
  hasRequiredFobProductTypes(products) {
    const requiredFobProductTypes = window.themeVariables.tk.fobProductTypes.split(',')
    return products.some(product => {
      return requiredFobProductTypes.includes(product.product_type);
    });
  }

  /**
   * Updates the next button to redirect to the cart page.
   */
  updateNextButtonForCart() {
    const nextBtn = document.getElementById('stepperNextBtn');
    const nextBtnSvg = nextBtn.querySelector('svg');
    nextBtn.textContent = "Continue to Cart";
    nextBtn.dataset.cart = true;
    nextBtn.appendChild(nextBtnSvg);
    nextBtn.disabled = false;
  }

  /**
   * Updates the next button to its original state.
   */
  updateNextButtonOriginalState() {
    const nextBtn = document.getElementById('stepperNextBtn');
    const nextBtnSvg = nextBtn.querySelector('svg');
    nextBtn.textContent = "Next";
    nextBtn.appendChild(nextBtnSvg);
    nextBtn.disabled = true;
    nextBtn.dataset.cart = false;
  }

  /**
   * Gets video ID from youtube video URL
   * @param videoUrl 
   * @returns string | null
   */
  _extractYoutubeVideoId (videoUrl) {
    if (typeof videoUrl !== 'string') { return null }

    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = videoUrl.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src String
   * @param size Integer or 'master'
   * @returns {*}
   */
  getSizedImageUrl (src, size) {
    if (size === null || !src.includes('/files/')) {
      return src
    }

    if (size === 'master') {
      return this.removeProtocol(src)
    }

    const match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif|webp)(\?v=\d+)?$/i)

    if (match) {
      const prefix = src.split(match[0])
      const suffix = match[0]

      return this.removeProtocol(`${prefix[0]}_${size}x${suffix}`)
    } else {
      return null
    }
  }

  removeProtocol (path) {
    return path.replace(/http(s)?:/, '')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const carSelector = new CarSelector();

  window.stepper = {}

  window.stepper.changeStep = function(step) {
    carSelector.step = step;
    carSelector.populateButtons();
    carSelector.updateProgressBar();
  }

  window.stepper.setMakeModelYear = carSelector.setConvermaxVechicle.bind(carSelector);
  window.stepper.toggleStepper = carSelector.expandStepper.bind(carSelector);
});