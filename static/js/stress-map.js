// ============================================
// CITY RESOURCE STRESS MAP - LEAFLET IMPLEMENTATION
// ============================================

// Global variables
let map;
let allGrids = [];
let gridLayer;
let gridMarkers = [];
let activeLayers = {
    combined: true,
    electricity: true,
    water: true,
    waste: true,
    solar: true
};
let currentOpacity = 0.8;
let gridData = null;

// Kailash Colony coordinates
const KAILASH_COLONY = {
    lat: 28.5244,
    lng: 77.2011,
    name: "Kailash Colony, Delhi"
};

// Initialize map on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadGridData();
    setupEventListeners();
});

// Initialize Leaflet map
function initializeMap() {
    map = L.map('map').setView([KAILASH_COLONY.lat, KAILASH_COLONY.lng], 15);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        className: 'map-tiles'
    }).addTo(map);
    
    // Add center marker
    L.marker([KAILASH_COLONY.lat, KAILASH_COLONY.lng], {
        icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            shadowSize: [41, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowAnchor: [12, 41]
        }),
        title: KAILASH_COLONY.name
    }).bindPopup(`<strong>${KAILASH_COLONY.name}</strong><br>Center Point`).addTo(map);
    
    // Create SVG layer group for grid cells
    gridLayer = L.featureGroup().addTo(map);
}

// Load grid data from JSON
function loadGridData() {
    fetch('../data/kailash-grid-data.json')
        .then(response => response.json())
        .then(data => {
            gridData = data;
            renderGridCells();
        })
        .catch(error => console.error('Error loading grid data:', error));
}

// Calculate stress color based on percentage
function getStressColor(percentage) {
    if (percentage <= 25) {
        return {
            color: '#10B981',
            class: 'low-stress',
            label: 'Low'
        };
    } else if (percentage <= 50) {
        return {
            color: '#FBBF24',
            class: 'moderate-stress',
            label: 'Moderate'
        };
    } else if (percentage <= 75) {
        return {
            color: '#F97316',
            class: 'high-stress',
            label: 'High'
        };
    } else {
        return {
            color: '#EF4444',
            class: 'critical-stress',
            label: 'Critical'
        };
    }
}

// Calculate weighted stress score
function calculateCombinedStress(grid) {
    const stress = (0.4 * grid.electricity + 0.3 * grid.water + 0.2 * grid.waste + 0.1 * grid.solar);
    return Math.round(stress);
}

// Create grid cells as rectangles on the map
function renderGridCells() {
    gridLayer.clearLayers();
    gridMarkers = [];
    
    // Calculate bounds for grid cells
    const cellSize = 0.003; // Latitude/longitude size of each cell
    
    gridData.gridData.forEach(point => {
        // Create rectangle bounds
        const bounds = [
            [point.lat - cellSize/2, point.lng - cellSize/2],
            [point.lat + cellSize/2, point.lng + cellSize/2]
        ];
        
        // Calculate combined stress
        const combinedStress = calculateCombinedStress(point);
        
        // Get color based on current active layer
        let currentValue = combinedStress;
        let currentMetric = 'combined';
        
        // Determine which metric to display
        if (activeLayers.combined) {
            currentValue = combinedStress;
            currentMetric = 'combined';
        } else if (activeLayers.electricity) {
            currentValue = point.electricity;
            currentMetric = 'electricity';
        } else if (activeLayers.water) {
            currentValue = point.water;
            currentMetric = 'water';
        } else if (activeLayers.waste) {
            currentValue = point.waste;
            currentMetric = 'waste';
        } else if (activeLayers.solar) {
            currentValue = point.solar;
            currentMetric = 'solar';
        }
        
        const stressInfo = getStressColor(currentValue);
        
        // Create rectangle
        const rectangle = L.rectangle(bounds, {
            color: stressInfo.color,
            weight: 2,
            opacity: currentOpacity,
            fill: true,
            fillColor: stressInfo.color,
            fillOpacity: currentOpacity,
            className: 'grid-cell ' + stressInfo.class
        });
        
        // Create popup content
        const popupContent = createPopupContent(point, combinedStress);
        rectangle.bindPopup(popupContent);
        
        // Add hover effects
        rectangle.on('mouseover', function() {
            this.setStyle({
                weight: 3,
                fillOpacity: Math.min(currentOpacity + 0.2, 1),
                opacity: 1
            });
            this.openPopup();
        });
        
        rectangle.on('mouseout', function() {
            this.setStyle({
                weight: 2,
                fillOpacity: currentOpacity,
                opacity: currentOpacity
            });
        });
        
        // Store reference
        gridMarkers.push({
            rectangle: rectangle,
            data: point,
            combinedStress: combinedStress
        });
        
        gridLayer.addLayer(rectangle);
    });
}

// Create popup/tooltip content
function createPopupContent(point, combinedStress) {
    const electricityColor = getStressColor(point.electricity).color;
    const waterColor = getStressColor(point.water).color;
    const wasteColor = getStressColor(point.waste).color;
    const solarColor = getStressColor(point.solar).color;
    
    return `
        <div class="tooltip-map">
            <h4>Zone ${point.zone}</h4>
            <div class="tooltip-metric">
                <span class="metric-name"><i class="fas fa-bolt" style="color: ${electricityColor};"></i> Electricity</span>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${point.electricity}%; background: ${electricityColor};"></div>
                </div>
                <span style="font-weight: 600; margin-left: 0.5rem;">${point.electricity}%</span>
            </div>
            <div class="tooltip-metric">
                <span class="metric-name"><i class="fas fa-droplet" style="color: ${waterColor};"></i> Water</span>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${point.water}%; background: ${waterColor};"></div>
                </div>
                <span style="font-weight: 600; margin-left: 0.5rem;">${point.water}%</span>
            </div>
            <div class="tooltip-metric">
                <span class="metric-name"><i class="fas fa-trash" style="color: ${wasteColor};"></i> Waste</span>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${point.waste}%; background: ${wasteColor};"></div>
                </div>
                <span style="font-weight: 600; margin-left: 0.5rem;">${point.waste}%</span>
            </div>
            <div class="tooltip-metric">
                <span class="metric-name"><i class="fas fa-sun" style="color: ${solarColor};"></i> Solar</span>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${point.solar}%; background: ${solarColor};"></div>
                </div>
                <span style="font-weight: 600; margin-left: 0.5rem;">${point.solar}%</span>
            </div>
            <div class="stress-score">
                Combined Score: ${combinedStress}%
            </div>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Layer toggle buttons
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = this.getAttribute('data-layer');
            activeLayers[layer] = !activeLayers[layer];
            this.classList.toggle('active');
            renderGridCells();
        });
    });
    
    // Opacity slider
    document.getElementById('opacitySlider').addEventListener('change', function() {
        currentOpacity = parseFloat(this.value);
        gridMarkers.forEach(marker => {
            marker.rectangle.setStyle({
                fillOpacity: currentOpacity,
                opacity: currentOpacity
            });
        });
    });
    
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        map.zoomIn();
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        map.zoomOut();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        map.setView([KAILASH_COLONY.lat, KAILASH_COLONY.lng], 15);
    });
    
    // Mobile menu toggle
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024) {
        const toggleMenuBtn = document.createElement('button');
        toggleMenuBtn.className = 'control-btn toggle-menu-btn';
        toggleMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        document.querySelector('.map-container').appendChild(toggleMenuBtn);
    }
}

// Update grid colors when layer changes
function updateGridColors() {
    gridMarkers.forEach(marker => {
        let currentValue = marker.combinedStress;
        
        if (activeLayers.combined) {
            currentValue = marker.combinedStress;
        } else if (activeLayers.electricity) {
            currentValue = marker.data.electricity;
        } else if (activeLayers.water) {
            currentValue = marker.data.water;
        } else if (activeLayers.waste) {
            currentValue = marker.data.waste;
        } else if (activeLayers.solar) {
            currentValue = marker.data.solar;
        }
        
        const stressInfo = getStressColor(currentValue);
        marker.rectangle.setStyle({
            color: stressInfo.color,
            fillColor: stressInfo.color
        });
    });
}

// Handle window resize for responsive map
window.addEventListener('resize', () => {
    if (map) {
        map.invalidateSize();
    }
});
