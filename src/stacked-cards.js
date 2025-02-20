// stacked-cards.js
class StackedCards extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    // Update hass object for all child cards
    if (this._cardElements) {
      this._cardElements.forEach((cardEl) => {
        if (cardEl.card) {
          cardEl.card.hass = hass;
        }
      });
    }
  }

  static getConfigElement() {
    return document.createElement("stacked-cards-editor");
  }

  static getStubConfig() {
    return {
      cards: [
        {
          show_name: true,
          show_state: true,
          type: "button",
          tap_action: {
            action: "toggle",
          },
          entity: "light.kitchen",
        },
        {
          type: "thermostat",
          entity: "climate.living_room",
        },
      ],
    };
  }

  setConfig(config) {
    if (!config.cards || !Array.isArray(config.cards)) {
      throw new Error("Please define cards as an array in the configuration");
    }
    this.config = config;
    this._createCards();
  }

  async _createCards() {
    if (!this.config || !this.config.cards) return;

    // Create all card elements
    this._cardElements = await Promise.all(
      this.config.cards.map(async (cardConfig) => {
        const element = document.createElement("div");
        element.className = "card-wrapper";

        try {
          // Create the card element using createCardElement from hui-view
          const card = await window
            .loadCardHelpers()
            .then((helpers) => helpers.createCardElement(cardConfig));

          if (this._hass) {
            card.hass = this._hass;
          }

          element.card = card;
          element.appendChild(card);
          return element;
        } catch (err) {
          console.error("Error creating card:", err);
          const errorElement = document.createElement("div");
          errorElement.className = "error-card";
          errorElement.innerHTML = `Error creating card: ${err.message}`;
          element.appendChild(errorElement);
          return element;
        }
      })
    );

    this.render();
  }

  render() {
    if (!this._cardElements) return;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 400px;
        padding: 16px;
      }

      .card-stack {
        position: relative;
        width: 100%;
        height: 100%;
        perspective: 1200px;
      }

      .card-wrapper {
        position: absolute;
        width: 100%;
        height: 100%;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
        cursor: pointer;
      }

      .card-wrapper > * {
        width: 100%;
        height: 100%;
        margin: 0;
        border-radius: 12px;
        overflow: hidden;
        background: var(--card-background-color, var(--ha-card-background, white));
        box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2));
      }

      .error-card {
        padding: 16px;
        color: var(--error-color);
      }

      .controls {
        position: absolute;
        bottom: -40px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
      }

      .nav-dots {
        display: flex;
        gap: 8px;
      }

      .nav-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary-color);
        opacity: 0.5;
        cursor: pointer;
        transition: opacity 0.3s;
      }

      .nav-dot.active {
        opacity: 1;
      }

      .nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: var(--primary-color);
        color: var(--primary-text-color);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.3s;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-button:hover {
        opacity: 1;
      }

      .nav-button.prev {
        left: -16px;
      }

      .nav-button.next {
        right: -16px;
      }
    `;

    const stack = document.createElement("div");
    stack.className = "card-stack";

    // Add cards to stack
    this._cardElements.forEach((element, index) => {
      const zOffset = -100;
      const xOffset = 10;
      element.style.transform = `translateZ(${zOffset * index}px) translateX(${
        xOffset * index
      }px)`;
      element.style.zIndex = this._cardElements.length - index;
      stack.appendChild(element);
    });

    // Create navigation controls
    const controls = document.createElement("div");
    controls.className = "controls";

    const prevButton = document.createElement("button");
    prevButton.className = "nav-button prev";
    prevButton.innerHTML = "&lt;";
    prevButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.previousCard();
    });

    const nextButton = document.createElement("button");
    nextButton.className = "nav-button next";
    nextButton.innerHTML = "&gt;";
    nextButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.nextCard();
    });

    const navDots = document.createElement("div");
    navDots.className = "nav-dots";

    this._cardElements.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = "nav-dot";
      if (index === 0) dot.classList.add("active");
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showCard(index);
      });
      navDots.appendChild(dot);
    });

    // Clear and update shadow DOM
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(prevButton);
    this.shadowRoot.appendChild(stack);
    this.shadowRoot.appendChild(nextButton);
    controls.appendChild(navDots);
    this.shadowRoot.appendChild(controls);

    this.currentIndex = 0;
  }

  showCard(index) {
    if (!this._cardElements || index < 0 || index >= this._cardElements.length)
      return;

    const zOffset = -100;
    const xOffset = 10;

    this._cardElements.forEach((element, i) => {
      const distance = i - index;
      element.style.transform = `translateZ(${
        zOffset * Math.abs(distance)
      }px) translateX(${xOffset * distance}px)`;
      element.style.zIndex = this._cardElements.length - Math.abs(distance);
    });

    const dots = this.shadowRoot.querySelectorAll(".nav-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    this.currentIndex = index;
  }

  previousCard() {
    const newIndex = this.currentIndex - 1;
    if (newIndex >= 0) {
      this.showCard(newIndex);
    }
  }

  nextCard() {
    const newIndex = this.currentIndex + 1;
    if (newIndex < this._cardElements.length) {
      this.showCard(newIndex);
    }
  }
}

customElements.define("stacked-cards", StackedCards);

// Configuration editor
class StackedCardsEditor extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .editor {
          padding: 16px;
        }
        .card-config {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
        }
        textarea {
          width: 100%;
          min-height: 120px;
          font-family: monospace;
          padding: 8px;
          margin: 8px 0;
          resize: vertical;
        }
        .error {
          color: var(--error-color);
          margin-top: 8px;
        }
      </style>
      <div class="editor">
        <h3>Stacked Cards Configuration</h3>
        <div class="cards-config">
          ${this.config.cards
            .map(
              (card, index) => `
            <div class="card-config">
              <h4>Card ${index + 1}</h4>
              <textarea
                id="card-${index}"
                .value='${JSON.stringify(card, null, 2)}'
              ></textarea>
              <mwc-button @click="${() => this.deleteCard(index)}">
                Delete Card
              </mwc-button>
            </div>
          `
            )
            .join("")}
        </div>
        <mwc-button @click="${this.addCard}">
          Add Card
        </mwc-button>
      </div>
    `;

    // Add event listeners after rendering
    this.querySelectorAll("textarea").forEach((textarea, index) => {
      textarea.addEventListener("change", (e) =>
        this.updateCard(index, e.target.value)
      );
    });
  }

  updateCard(index, value) {
    try {
      const cardConfig = JSON.parse(value);
      this.config.cards[index] = cardConfig;
      this.fireEvent();

      // Remove any existing error message
      const errorEl = this.querySelector(`#card-${index}-error`);
      if (errorEl) errorEl.remove();
    } catch (e) {
      // Show error message
      const textarea = this.querySelector(`#card-${index}`);
      let errorEl = this.querySelector(`#card-${index}-error`);
      if (!errorEl) {
        errorEl = document.createElement("div");
        errorEl.id = `card-${index}-error`;
        errorEl.className = "error";
        textarea.parentNode.insertBefore(errorEl, textarea.nextSibling);
      }
      errorEl.textContent = `Invalid card configuration: ${e.message}`;
    }
  }

  deleteCard(index) {
    this.config.cards.splice(index, 1);
    this.fireEvent();
    this.render();
  }

  addCard() {
    if (!this.config.cards) this.config.cards = [];
    this.config.cards.push({
      type: "button",
      entity: "light.example",
    });
    this.fireEvent();
    this.render();
  }

  fireEvent() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this.config },
      })
    );
  }
}

customElements.define("stacked-cards-editor", StackedCardsEditor);

// Register the card
window.customCards = window.customCards || [];
window.customCards.push({
  type: "stacked-cards",
  name: "Stacked Cards",
  description: "A card stack with 3D transition effects",
});
