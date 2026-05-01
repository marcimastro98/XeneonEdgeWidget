# Using Local Storage With Widgets

## Brief Description

The HTML Web Storage API (`localStorage` and `sessionStorage`) allows web applications to store data persistently on the user's computer. `localStorage` is a key-value store that typically offers 5-10 MB with no expiration date, so data persists across browser and iCUE restarts.

## Usage Motivation

In iCUE HTML widgets, `localStorage` lets developers load and save data between iCUE sessions. This data is required for widget display but is not required by iCUE core functionality.

## Data Structure and Keying

Each widget has a unique identifier (`QUuid`) used as the key for a JSON object in `localStorage`. This JSON object holds all persisted properties for that widget. The unique ID is available as the `uniqueId` variable.

Store only widget display state in `localStorage`. Do not store credentials, tokens, or personal data.

## Reading from Local Storage

```javascript
const widgetId   = uniqueId;
const storedData = localStorage.getItem(widgetId);

if (storedData) {
  const properties = JSON.parse(storedData);
  const savedValue = properties.propertyName;
  console.log(`Loaded value for propertyName: ${savedValue}`);
}
```

## Writing to Local Storage

```javascript
const widgetId   = uniqueId;
const storedData = localStorage.getItem(widgetId);
let properties   = storedData ? JSON.parse(storedData) : {};

properties.propertyName = newValue;

localStorage.setItem(widgetId, JSON.stringify(properties));
console.log(`Successfully saved new value for propertyName: ${newValue}`);
```

---

## Complete Example: Water Level Widget

A full widget for Xeneon Edge demonstrating the Local Storage save/load pattern. It renders a duck on an animated water level display, persisting the level between sessions.

Device restrictions and interactivity are declared in `manifest.json`:
```json
{
  "supported_devices": [{ "type": "dashboard_lcd", "features": ["sensor-screen"] }],
  "interactive": true
}
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Duck</title>
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow: hidden;
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .water-widget {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 2vh 2vw;
      height: 100%;
      background-color: white;
      border-radius: 2vh;
      box-shadow: 0 0.5vh 1.5vh rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    .header-text {
      color: #333;
      margin-bottom: 2vh;
      font-size: 5vh;
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 3vw;
      margin-bottom: 2vh;
    }
    .level-button {
      background-color: #f8f8f8;
      color: #333;
      border: 0.2vh solid #ccc;
      border-radius: 1vh;
      padding: 1.5vh 3vw;
      font-size: 4vh;
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s;
      line-height: 1;
      flex-shrink: 0;
    }
    .level-button:hover { background-color: #e9e9e9; box-shadow: 0 0.25vh 0.5vh rgba(0,0,0,0.1); }
    .level-button:active { background-color: #ddd; }
    .water-container {
      width: 80%;
      flex-grow: 1;
      border: 0.3vh solid #ccc;
      border-radius: 1.5vh;
      overflow: hidden;
      position: relative;
      background-color: #f5f5f5;
      min-height: 50px;
    }
    .water {
      position: absolute;
      bottom: 0; left: 0;
      width: 100%;
      background-color: #4ac3ff;
      transition: height 0.5s ease-in-out;
    }
    .duck {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      transition: bottom 0.5s ease-in-out;
      z-index: 10;
    }
    .duck-body, .duck-head, .duck-beak, .duck-eye {
      position: absolute;
      box-sizing: border-box;
      border: 0.5vh solid #333;
    }
    .duck-body {
      background-color: #ffc107;
      width: 100%; height: 85%;
      border-radius: 50% 50% 30% 30%;
      bottom: 0; left: 0;
    }
    .duck-head {
      background-color: #ffc107;
      width: 60%; height: 60%;
      border-radius: 50%;
      top: -30%; right: -10%;
      z-index: 1;
    }
    .duck-beak {
      background-color: #ff9800;
      width: 25%; height: 12%;
      border-radius: 0 50% 50% 0;
      position: absolute;
      top: 40%; right: -5%;
      z-index: 2; border: none;
    }
    .duck-eye {
      background-color: #333;
      width: 8%; height: 8%;
      border-radius: 50%;
      position: absolute;
      top: 20%; right: 25%;
      z-index: 3; border: none;
    }
    .level-display {
      margin-top: 2vh;
      font-size: 5vh;
      color: #666;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="water-widget">
    <div class="header-text">Change water level with buttons</div>
    <div class="controls">
      <button id="levelUp" class="level-button">&#9650;</button>
      <button id="levelDown" class="level-button">&#9660;</button>
    </div>
    <div class="water-container" id="waterContainer">
      <div class="water" id="water"></div>
      <div class="duck" id="duck">
        <div class="duck-body">
          <div class="duck-head">
            <div class="duck-beak"></div>
            <div class="duck-eye"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="level-display">Water Level: <span id="currentLevelDisplay">0</span> / 5</div>
  </div>

  <script>
    const MAX_LEVEL       = 5;
    const MIN_LEVEL       = 0;
    const WIDGET_KEY      = uniqueId;
    const WATER_LEVEL_KEY = 'waterLevel';

    const waterElement          = document.getElementById('water');
    const duckElement           = document.getElementById('duck');
    const waterContainerElement = document.getElementById('waterContainer');
    const levelUpButton         = document.getElementById('levelUp');
    const levelDownButton       = document.getElementById('levelDown');
    const currentLevelDisplay   = document.getElementById('currentLevelDisplay');

    let currentLevel              = 0;
    let CONTAINER_HEIGHT          = 0;
    let DUCK_ACTUAL_HEIGHT        = 0;
    let WATER_LEVEL_STEP          = 0;
    const DUCK_CONTAINER_HEIGHT_RATIO = 0.25;

    function calculateAdaptiveSizes() {
      CONTAINER_HEIGHT   = waterContainerElement.clientHeight;
      DUCK_ACTUAL_HEIGHT = CONTAINER_HEIGHT * DUCK_CONTAINER_HEIGHT_RATIO;
      duckElement.style.height = `${DUCK_ACTUAL_HEIGHT}px`;
      duckElement.style.width  = `${DUCK_ACTUAL_HEIGHT * 1.1}px`;
      WATER_LEVEL_STEP   = CONTAINER_HEIGHT / MAX_LEVEL;
    }

    function loadLevel(animated) {
      calculateAdaptiveSizes();
      const widgetStorage = localStorage.getItem(WIDGET_KEY);
      let jsonStorage = {};
      if (widgetStorage) {
        try { jsonStorage = JSON.parse(widgetStorage); } catch (e) { jsonStorage = {}; }
      }
      const storedLevel = jsonStorage[WATER_LEVEL_KEY];
      if (storedLevel !== undefined) {
        currentLevel = Math.min(Math.max(parseInt(storedLevel, 10), MIN_LEVEL), MAX_LEVEL);
      }
      updateWidget(animated);
    }

    function updateWidget(animate = true) {
      calculateAdaptiveSizes();
      const waterHeight = currentLevel * WATER_LEVEL_STEP;

      let duckBottom;
      if (currentLevel === 0) {
        duckBottom = 0;
      } else {
        duckBottom = waterHeight - (DUCK_ACTUAL_HEIGHT / 2);
        const maxDuckBottom = CONTAINER_HEIGHT - DUCK_ACTUAL_HEIGHT;
        duckBottom = Math.min(Math.max(duckBottom, 0), maxDuckBottom);
      }

      waterElement.style.transition = animate ? 'height 0.5s ease-in-out' : 'none';
      duckElement.style.transition  = animate ? 'bottom 0.5s ease-in-out' : 'none';
      waterElement.style.height     = `${waterHeight}px`;
      duckElement.style.bottom      = `${duckBottom}px`;
      currentLevelDisplay.textContent = currentLevel;

      const widgetStorage = localStorage.getItem(WIDGET_KEY);
      let jsonStorage = widgetStorage ? JSON.parse(widgetStorage) : {};
      jsonStorage[WATER_LEVEL_KEY] = currentLevel;
      localStorage.setItem(WIDGET_KEY, JSON.stringify(jsonStorage));

      levelUpButton.disabled   = currentLevel === MAX_LEVEL;
      levelDownButton.disabled = currentLevel === MIN_LEVEL;
    }

    levelUpButton.addEventListener('click', () => { if (currentLevel < MAX_LEVEL) { currentLevel++; updateWidget(); } });
    levelDownButton.addEventListener('click', () => { if (currentLevel > MIN_LEVEL) { currentLevel--; updateWidget(); } });

    window.addEventListener('storage', (event) => { if (event.key === WIDGET_KEY) loadLevel(); });
    window.addEventListener('resize', () => updateWidget());

    loadLevel(false);
  </script>
</body>
</html>
```
