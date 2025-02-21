// Create navigation controls
const controls = document.createElement("div");
controls.className = "controls"; // stacked-cards.js

console.log("Stacked Cards Card is being loaded...");
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

  // No custom editor, Home Assistant will use the standard YAML editor

  static getStubConfig() {
    return {
      cards: [
        {
          type: "custom:mini-graph-card",
          entity: "sensor.temperature",
          name: "Temperature",
        },
        {
          type: "entities",
          title: "Living Room",
          entities: ["light.living_room", "switch.tv"],
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
    box-sizing: border-box;
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
    touch-action: pan-y;
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
    background: red; /* Duidelijk zichtbare kleur */
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px; /* Groter */
    height: 40px; /* Groter */
    cursor: pointer;
    opacity: 1; /* Volledig zichtbaar */
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }

  .nav-button:hover {
    background: darkred;
  }

  .nav-button.prev {
    left: -20px; /* Verder naar buiten */
  }

  .nav-button.next {
    right: -20px; /* Verder naar buiten */
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

    // Add touch swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;

    stack.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    stack.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true }
    );

    const handleSwipe = () => {
      const swipeThreshold = 50; // Minimum distance for a swipe
      if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left, go to next card
        this.nextCard();
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right, go to previous card
        this.previousCard();
      }
    };

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

// Use the standard Home Assistant YAML editor
// We don't need to define a custom editor

// Register the card
window.customCards = window.customCards || [];
window.customCards.push({
  type: "stacked-cards",
  name: "Stacked Cards",
  description: "A card stack with 3D transition effects",
});
console.info(
  "%c STACKED-CARDS %c 2024.05.05.0",
  "Color: white; font-weight: bold; background: blue;",
  ""
);
