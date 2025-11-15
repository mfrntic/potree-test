# PotreeViewer

Modern, framework-agnostic JavaScript library for visualizing large-scale point clouds in web browsers. Built on [potree-core](https://github.com/tentone/potree-core) and [Three.js](https://threejs.org/).

## Features

- 🚀 **Modern ESM architecture** - Clean imports, no global variables
- 🎯 **Framework-agnostic** - Works with vanilla JS, React, Vue, or any framework
- 📏 **Built-in measurements** - Distance and height measurements with interactive UI
- 🎨 **Customizable** - Extensive configuration options for materials, views, and behavior
- 📦 **Lightweight** - No jQuery or legacy dependencies
- 🔧 **Full API** - Programmatic control over viewer, measurements, and camera
- 🎬 **Event-driven** - Subscribe to viewer events for custom integrations

## Installation

```bash
npm install potree-core three
```

Copy the `viewer-lib` directory to your project or install as a local package.

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #viewer-container {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="viewer-container"></div>

  <script type="module">
    import { PotreeViewer } from './viewer-lib/src/index.js';

    const viewer = new PotreeViewer({
      container: document.getElementById('viewer-container'),
      pointCloudUrl: 'path/to/your/cloud/metadata.json',
      pointCloudName: 'My Point Cloud',
    });
  </script>
</body>
</html>
```

### With Toolbar

```javascript
import { PotreeViewer, Toolbar } from './viewer-lib/src/index.js';

const viewer = new PotreeViewer({
  container: document.getElementById('viewer-container'),
  pointCloudUrl: 'path/to/cloud/metadata.json',
  language: 'hr',
  pointBudget: 1_000_000,
  initialView: 'right',
  autoFitOnLoad: true,
});

const toolbar = new Toolbar(viewer, {
  position: 'top',
  showMeasurements: true,
  showViews: true,
});
```

## Configuration

### Viewer Options

```javascript
const viewer = new PotreeViewer({
  // Required
  container: HTMLElement,              // DOM element to render into

  // Point cloud settings
  pointCloudUrl: string,               // Path to metadata.json
  pointCloudName: string,              // Display name (default: 'pointcloud')
  description: string,                 // Description text

  // Viewer settings
  language: 'en' | 'hr',               // UI language (default: 'en')
  pointBudget: number,                 // Max visible points (default: 1,000,000)
  fov: number,                         // Field of view in degrees (default: 80)

  // Initial view
  initialView: 'top' | 'front' | 'right' | 'isometric' | { position, target },

  // Material settings
  material: {
    size: number,                      // Point size (default: 0.6)
    minSize: number,                   // Min point size (default: 0.4)
    pointSizeType: 'FIXED' | 'ATTENUATED' | 'ADAPTIVE',
    shape: 'SQUARE' | 'CIRCLE',
  },

  // Background
  background: 'black' | 'white' | 'gradient' | '#hexcolor',

  // Behavior
  autoFitOnLoad: boolean,              // Auto-fit camera to point cloud
  loadSettingsFromUrl: boolean,        // Load settings from URL params

  // Callbacks
  onReady: (viewer) => void,
  onPointCloudLoaded: (pointCloud) => void,
  onError: (error) => void,
});
```

## API Reference

### Viewer Methods

#### Camera & View Control

```javascript
// Set camera position and target
viewer.setView(
  { x: 10, y: 10, z: 10 },  // position
  { x: 0, y: 0, z: 0 }      // target
);

// Set predefined view
viewer.setNamedView('top' | 'front' | 'right' | 'isometric');

// Get current view name
const viewName = viewer.getNamedView(); // 'top' | 'front' | ... | 'custom'

// Fit point cloud to screen
viewer.fitToScreen();
```

#### Point Cloud Management

```javascript
// Load additional point cloud
await viewer.loadPointCloud('path/to/metadata.json', 'cloud-name');

// Set point budget
viewer.setPointBudget(2_000_000);

// Set background
viewer.setBackground('white');
viewer.setBackground('#87CEEB');
```

#### Measurements

```javascript
// Set measurement mode
viewer.setMeasurementMode('distance');  // Start distance measurement
viewer.setMeasurementMode('height');    // Start height measurement
viewer.setMeasurementMode('none');      // Return to navigation mode

// Get current mode
const mode = viewer.getMeasurementMode(); // 'none' | 'distance' | 'height'

// Programmatic measurement control
const measurement = viewer.startMeasurement('distance');
viewer.finishMeasurement(measurement.id);
viewer.removeMeasurement(measurement.id);
viewer.clearMeasurements();

// Get all measurements
const measurements = viewer.getMeasurements();
// Returns: [{ id, type, points, result }, ...]
```

#### Advanced Access

```javascript
// Get underlying instances (escape hatch for advanced use)
const potree = viewer.getPotree();      // Potree instance
const scene = viewer.getScene();        // Three.js scene
const camera = viewer.getCamera();      // Three.js camera
const renderer = viewer.getRenderer();  // Three.js renderer
```

#### Cleanup

```javascript
// Dispose viewer and free resources
viewer.dispose();
```

### Events

Subscribe to viewer events using the event emitter API:

```javascript
// Viewer lifecycle
viewer.on('ready', (viewerInstance) => {
  console.log('Viewer initialized');
});

viewer.on('error', (error) => {
  console.error('Error:', error);
});

// Point cloud events
viewer.on('pointcloud-loaded', (pointCloud) => {
  console.log('Point cloud loaded:', pointCloud.name);
});

// View events
viewer.on('view-changed', ({ namedView, position, target }) => {
  console.log('Camera moved to:', namedView);
});

// Measurement events
viewer.on('measurement-started', (measurement) => {
  console.log('Measurement started:', measurement.type);
});

viewer.on('measurement-updated', (measurement) => {
  console.log('Point added to measurement');
});

viewer.on('measurement-finished', (measurement) => {
  console.log('Measurement complete:', measurement.result);
});

viewer.on('measurement-cleared', () => {
  console.log('All measurements cleared');
});

// Unsubscribe
viewer.off('ready', handler);
```

### Measurement Results

#### Distance Measurement

```javascript
{
  id: 'measurement-123',
  type: 'distance',
  points: [{ x, y, z }, { x, y, z }, ...],
  result: {
    distanceTotal: 45.67  // meters
  }
}
```

#### Height Measurement

```javascript
{
  id: 'measurement-456',
  type: 'height',
  points: [{ x, y, z }, { x, y, z }],
  result: {
    deltaZ: 12.34,        // vertical difference in meters
    distance3D: 15.67     // 3D distance in meters
  }
}
```

## Toolbar

The `Toolbar` class provides a minimal UI for common viewer operations.

```javascript
import { Toolbar } from './viewer-lib/src/index.js';

const toolbar = new Toolbar(viewer, {
  position: 'top',              // 'top' | 'bottom' | 'left' | 'right'
  showMeasurements: true,       // Show measurement controls
  showViews: true,              // Show view controls
  showControls: true,           // Show navigation controls
});

// Clean up
toolbar.dispose();
```

### Toolbar Controls

- **Navigate** - Return to normal navigation mode
- **Fit** - Fit point cloud to screen
- **Distance** - Start distance measurement (click points to measure)
- **Height** - Start height measurement (click 2 points for vertical difference)
- **Clear** - Clear all measurements
- **Top/Front/Right/Iso** - Switch to predefined views

### Measurement Workflow

1. Click a measurement button (Distance or Height)
2. Click on the point cloud to add points
3. For distance: click multiple points, press **Enter** to finish
4. For height: click 2 points (auto-finishes)
5. Press **ESC** to cancel
6. Measurement result displays in the toolbar

## Browser Compatibility

- Modern browsers with WebGL support (Chrome, Firefox, Edge, Safari)
- Requires ES module support
- No IE11 support

## Point Cloud Data Preparation

Use [PotreeConverter](https://github.com/potree/PotreeConverter/releases) to prepare your point cloud data:

```bash
./PotreeConverter input.laz -o output_directory
```

Supported input formats: LAS, LAZ, PLY, PTX, XYZ (via TXT2LAS)

## Examples

### Load Multiple Point Clouds

```javascript
const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
});

await viewer.loadPointCloud('cloud1/metadata.json', 'Building A');
await viewer.loadPointCloud('cloud2/metadata.json', 'Building B');
```

### Custom View on Load

```javascript
const viewer = new PotreeViewer({
  container: document.getElementById('viewer'),
  pointCloudUrl: 'cloud/metadata.json',
  initialView: {
    position: { x: 100, y: 50, z: 100 },
    target: { x: 0, y: 0, z: 0 }
  }
});
```

### React Integration

```jsx
import { useEffect, useRef } from 'react';
import { PotreeViewer, Toolbar } from './viewer-lib/src/index.js';

function PointCloudViewer({ pointCloudUrl }) {
  const containerRef = useRef();
  const viewerRef = useRef();
  const toolbarRef = useRef();

  useEffect(() => {
    // Initialize viewer
    viewerRef.current = new PotreeViewer({
      container: containerRef.current,
      pointCloudUrl,
      autoFitOnLoad: true,
    });

    // Create toolbar
    toolbarRef.current = new Toolbar(viewerRef.current);

    // Cleanup
    return () => {
      toolbarRef.current?.dispose();
      viewerRef.current?.dispose();
    };
  }, [pointCloudUrl]);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

## Comparison with Original Potree

### What's Different

- ✅ Modern ES modules instead of global scripts
- ✅ No jQuery dependency
- ✅ Encapsulated API instead of global `window.viewer`
- ✅ Framework-agnostic design
- ✅ Built on potree-core (lightweight)
- ❌ No full GUI sidebar (intentional - use Toolbar or build your own)
- ❌ No EDL shading (not supported by potree-core)
- ⏳ Limited measurement types (distance and height only for now)

### When to Use This Library

- Building modern web applications (React, Vue, etc.)
- Need clean API and encapsulation
- Want minimal UI with custom controls
- Prefer lightweight bundle size

### When to Use Original Potree

- Need full-featured GUI out of the box
- Require EDL shading
- Need advanced features (classification, clipping, annotations)

## License

MIT

## Credits

- Based on [potree-core](https://github.com/tentone/potree-core) by tentone
- Original [Potree](https://github.com/potree/potree) by Markus Schütz
- Built with [Three.js](https://threejs.org/)
