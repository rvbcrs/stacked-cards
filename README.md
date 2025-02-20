# Stacked Cards for Home Assistant

![Stacked Cards](https://via.placeholder.com/800x400/6699CC/FFFFFF?text=Stacked+Cards)

A custom card that displays multiple Lovelace cards in a beautiful 3D stack with interactive animations and controls.

## Features

- Display multiple Lovelace cards in a 3D stack
- Smooth animations when switching between cards
- Navigation buttons and indicators
- Works with all standard Lovelace cards and compatible with most custom cards
- Simple configuration in the Lovelace UI

## Installation

### HACS (Recommended)

1. Make sure you have [HACS](https://hacs.xyz/) installed in your Home Assistant instance
2. Go to HACS → Frontend → "+" button
3. Search for "Stacked Cards" and install it
4. Restart Home Assistant

### Manual Installation

1. Download the `stacked-cards.js` file from the [latest release](https://github.com/yourusername/stacked-cards/releases/latest)
2. Upload the file to your `config/www` folder
3. Add a reference to the resource in your Lovelace configuration:
   ```yaml
   resources:
     - url: /local/stacked-cards.js
       type: module
   ```
4. Restart Home Assistant

## Usage

Add the card to your Lovelace UI:

```yaml
type: custom:stacked-cards
cards:
  - type: entities
    title: Living Room
    entities:
      - light.living_room
      - switch.tv
  - type: thermostat
    entity: climate.living_room
  - type: weather-forecast
    entity: weather.home
```

## Options

| Name  | Type  | Default | Description                            |
| ----- | ----- | ------- | -------------------------------------- |
| cards | array | []      | List of card configurations to display |

Each item in the cards array can be any valid Lovelace card configuration.

## Developer Notes

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Support

If you find any issues or have feature requests, please [open an issue](https://github.com/yourusername/stacked-cards/issues) on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
