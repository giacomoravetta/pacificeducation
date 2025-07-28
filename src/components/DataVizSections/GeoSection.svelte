<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	import * as d3 from 'd3';

	const islandsData = [
		{
			name: 'Fiji',
			coordinates: [-18, 178],
			participationRates: {
				2015: 63.3,
				2016: 71.8,
				2017: 66.07,
				2018: 57.4,
				2019: 64.34,
				2021: 86.03,
				2022: 87.11,
				2023: 81.43
			},
			color: '#e74c3c'
		},
		{
			name: 'Samoa',
			coordinates: [-14, -172],
			participationRates: {
				2010: 25.6,
				2011: 28.3,
				2012: 24.5,
				2014: 27.8,
				2015: 30.5,
				2016: 31.7,
				2017: 33.2,
				2018: 38,
				2019: 35.1,
				2021: 31.22,
				2022: 31.35
			},
			color: '#9b59b6'
		},
		{
			name: 'Tonga',
			coordinates: [-21, -175],
			participationRates: { 2015: 99 },
			color: '#f39c12'
		},
		{
			name: 'Vanuatu',
			coordinates: [-16, 167],
			participationRates: { 2019: 94.62, 2020: 96.18, 2021: 86.06, 2022: 80.37 },
			color: '#1abc9c'
		},
		{
			name: 'Solomon Islands',
			coordinates: [-9, 160],
			participationRates: { 2013: 59.5, 2014: 62.2, 2015: 63.6, 2018: 57.4, 2019: 64.34 },
			color: '#3498db'
		},
		{
			name: 'Papua New Guinea',
			coordinates: [-6, 144],
			participationRates: { 2016: 71.8, 2018: 66.07 },
			color: '#e67e22'
		},
		{
			name: 'Palau',
			coordinates: [7, 134],
			participationRates: { 2014: 100, 2015: 90.4 },
			color: '#2ecc71'
		},
		{
			name: 'Micronesia',
			coordinates: [7, 158],
			participationRates: { 2015: 79.73, 2016: 76.4 },
			color: '#f1c40f'
		},
		{
			name: 'Marshall Islands',
			coordinates: [7, 171],
			participationRates: { 2015: 38.5, 2016: 39.6 },
			color: '#9b59b6'
		},
		{
			name: 'Kiribati',
			coordinates: [1, 173],
			participationRates: { 2014: 70 },
			color: '#e74c3c'
		},
		{
			name: 'Nauru',
			coordinates: [-0.5, 166],
			participationRates: { 2012: 88.1, 2014: 71.2 },
			color: '#34495e'
		},
		{
			name: 'Tuvalu',
			coordinates: [-8, 179],
			participationRates: { 2015: 98.3 },
			color: '#16a085'
		},
		{
			name: 'Cook Islands',
			coordinates: [-21, -160],
			participationRates: { 2013: 97.4, 2014: 94.1, 2015: 94.7 },
			color: '#8e44ad'
		},
		{
			name: 'Niue',
			coordinates: [-19, -170],
			participationRates: { 2015: 63.4 },
			color: '#d35400'
		},
		{
			name: 'French Polynesia',
			coordinates: [-17, -149],
			participationRates: {},
			color: '#95a5a6'
		},
		{
			name: 'New Caledonia',
			coordinates: [-22, 165],
			participationRates: {},
			color: '#95a5a6'
		}
	];

	// State variables
	let mapElement;
	let map;
	let L;
	let svg;
	let svgElement;
	let islandsCreated = $state(false);
	let selectedYear = $state('latest');
	let isLoading = $state(true);
	let hoveredIsland = $state(null);
	let mapReady = $state(false);
	const stats = $derived(getCurrentStats());

	// Performance optimization variables
	let rafId;
	let isUpdating = false;
	let tileCache = new Map();
	let predictiveCache = new Map();
	let lastUpdateTime = 0;
	let optimizer;
	let preloadingProgress = $state(0);
	let totalTilesToLoad = $state(0);
	let isPreloading = $state(false);

	// Aggressive tile preloading function
	function preloadMapTiles() {
		if (!map) return Promise.resolve();

		const tileUrls = new Set();

		// Define the entire Pacific region bounds (expanded)
		const pacificBounds = {
			north: 25, // Northern extent (includes Micronesia)
			south: -35, // Southern extent (includes New Zealand area)
			west: 120, // Western extent (includes Papua New Guinea)
			east: -120 // Eastern extent (includes French Polynesia)
		};

		// Aggressive zoom levels - cover from overview to detailed
		const zoomLevels = [2, 3, 4, 5, 6, 7, 8, 9];

		zoomLevels.forEach((zoom) => {
			// Calculate tile bounds for the entire Pacific region
			const northWest = L.latLng(pacificBounds.north, pacificBounds.west);
			const southEast = L.latLng(pacificBounds.south, pacificBounds.east);

			const tileBounds = L.bounds(
				map.project(northWest, zoom).divideBy(256).floor(),
				map.project(southEast, zoom).divideBy(256).ceil()
			);

			// Generate all tile URLs for this zoom level
			for (let x = tileBounds.min.x; x <= tileBounds.max.x; x++) {
				for (let y = tileBounds.min.y; y <= tileBounds.max.y; y++) {
					const subdomains = 'abcd';
					const subdomain = subdomains[Math.abs(x + y) % 4];
					const tileUrl = `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
					tileUrls.add(tileUrl);
				}
			}
		});

		console.log(
			`🚀 Aggressive preloading: ${tileUrls.size} tiles across ${zoomLevels.length} zoom levels`
		);

		// Preload in batches to avoid overwhelming the browser
		const batchSize = 20;
		const urlArray = Array.from(tileUrls);
		const batches = [];

		for (let i = 0; i < urlArray.length; i += batchSize) {
			batches.push(urlArray.slice(i, i + batchSize));
		}

		// Process batches with progressive loading
		const processBatch = async (batch, batchIndex) => {
			const batchPromises = batch.map((url) => {
				if (tileCache.has(url)) return Promise.resolve(url);

				return new Promise((resolve) => {
					const img = new Image();
					img.onload = () => {
						tileCache.set(url, img);
						resolve(url);
					};
					img.onerror = () => resolve(null);
					img.src = url;
				});
			});

			const results = await Promise.allSettled(batchPromises);
			const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

			console.log(
				`📦 Batch ${batchIndex + 1}/${batches.length} completed: ${successCount}/${batch.length} tiles loaded`
			);

			return results;
		};

		// Process all batches with a small delay between them
		const processAllBatches = async () => {
			const allResults = [];

			for (let i = 0; i < batches.length; i++) {
				const batchResults = await processBatch(batches[i], i);
				allResults.push(...batchResults);

				// Small delay between batches to prevent overwhelming
				if (i < batches.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 50));
				}
			}

			const totalSuccess = allResults.filter((r) => r.status === 'fulfilled' && r.value).length;
			console.log(`✅ Preloading complete: ${totalSuccess}/${tileUrls.size} tiles cached`);

			return allResults;
		};

		return processAllBatches();
	}

	// Additional function to preload critical tiles immediately
	function preloadCriticalTiles() {
		if (!map) return Promise.resolve();

		const criticalTileUrls = new Set();

		// Load tiles for the initial view and one zoom level up/down immediately
		const currentZoom = map.getZoom();
		const criticalZooms = [currentZoom - 1, currentZoom, currentZoom + 1].filter(
			(z) => z >= 2 && z <= 18
		);

		// Expand the current bounds significantly
		const currentBounds = map.getBounds();
		const latSpan = currentBounds.getNorth() - currentBounds.getSouth();
		const lngSpan = currentBounds.getEast() - currentBounds.getWest();

		const expandedBounds = L.latLngBounds(
			[currentBounds.getSouth() - latSpan, currentBounds.getWest() - lngSpan],
			[currentBounds.getNorth() + latSpan, currentBounds.getEast() + lngSpan]
		);

		criticalZooms.forEach((zoom) => {
			const tileBounds = L.bounds(
				map.project(expandedBounds.getSouthWest(), zoom).divideBy(256).floor(),
				map.project(expandedBounds.getNorthEast(), zoom).divideBy(256).ceil()
			);

			for (let x = tileBounds.min.x; x <= tileBounds.max.x; x++) {
				for (let y = tileBounds.min.y; y <= tileBounds.max.y; y++) {
					const subdomains = 'abcd';
					const subdomain = subdomains[Math.abs(x + y) % 4];
					const tileUrl = `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
					criticalTileUrls.add(tileUrl);
				}
			}
		});

		// Load critical tiles immediately
		const criticalPromises = Array.from(criticalTileUrls).map((url) => {
			if (tileCache.has(url)) return Promise.resolve(url);

			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => {
					tileCache.set(url, img);
					resolve(url);
				};
				img.onerror = () => resolve(null);
				img.src = url;
			});
		});

		return Promise.allSettled(criticalPromises);
	}

	// Viewport culling function
	function isInViewport(coordinates, bounds, buffer = 0.1) {
		const lat = coordinates[0];
		const lng = coordinates[1];
		const latBuffer = (bounds.getNorth() - bounds.getSouth()) * buffer;
		const lngBuffer = (bounds.getEast() - bounds.getWest()) * buffer;

		return (
			lat >= bounds.getSouth() - latBuffer &&
			lat <= bounds.getNorth() + latBuffer &&
			lng >= bounds.getWest() - lngBuffer &&
			lng <= bounds.getEast() + lngBuffer
		);
	}

	// Performance optimizer class
	class MapInteractionOptimizer {
		constructor(mapInstance, svgInstance) {
			this.map = mapInstance;
			this.svg = svgInstance;
			this.updateQueue = new Map();
			this.isUpdating = false;
			this.lastUpdateTime = 0;
			this.predictiveCache = new Map();

			// Bind methods
			this.debouncedUpdate = this.debounce(this.performUpdate.bind(this), 16); // 60fps
			this.throttledPredict = this.throttle(this.predictNextView.bind(this), 100);
		}

		debounce(func, wait) {
			let timeout;
			return function executedFunction(...args) {
				const later = () => {
					clearTimeout(timeout);
					func(...args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
			};
		}

		throttle(func, limit) {
			let inThrottle;
			return function () {
				const args = arguments;
				const context = this;
				if (!inThrottle) {
					func.apply(context, args);
					inThrottle = true;
					setTimeout(() => (inThrottle = false), limit);
				}
			};
		}

		predictNextView() {
			if (!this.map) return;

			const currentCenter = this.map.getCenter();
			const currentZoom = this.map.getZoom();

			// Predict common zoom levels
			const predictedZooms = [
				Math.max(2, currentZoom - 1),
				Math.min(18, currentZoom + 1),
				Math.min(18, currentZoom + 2)
			];

			// Predict nearby areas
			const bounds = this.map.getBounds();
			const latSpan = bounds.getNorth() - bounds.getSouth();
			const lngSpan = bounds.getEast() - bounds.getWest();

			const predictedCenters = [
				[currentCenter.lat + latSpan * 0.5, currentCenter.lng],
				[currentCenter.lat - latSpan * 0.5, currentCenter.lng],
				[currentCenter.lat, currentCenter.lng + lngSpan * 0.5],
				[currentCenter.lat, currentCenter.lng - lngSpan * 0.5]
			];

			// Cache calculations for predicted views
			predictedZooms.forEach((zoom) => {
				predictedCenters.forEach((center) => {
					const key = `${zoom}-${center[0].toFixed(2)}-${center[1].toFixed(2)}`;
					if (!this.predictiveCache.has(key)) {
						this.predictiveCache.set(key, this.precalculateViewport(center, zoom));
					}
				});
			});
		}

		precalculateViewport(center, zoom) {
			const calculations = {};
			const tempBounds = L.latLngBounds(
				[center[0] - 10, center[1] - 10],
				[center[0] + 10, center[1] + 10]
			);

			islandsData.forEach((island) => {
				if (tempBounds.contains([island.coordinates[0], island.coordinates[1]])) {
					calculations[island.name] = {
						visible: true,
						x: center[1] * zoom,
						y: center[0] * zoom
					};
				}
			});

			return calculations;
		}

		performUpdate() {
			if (this.isUpdating) return;

			this.isUpdating = true;
			const now = performance.now();

			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				try {
					updateIslandPositionsOptimized();
					this.throttledPredict();
				} finally {
					this.isUpdating = false;
					this.lastUpdateTime = now;
				}
			});
		}
	}

	// Optimized island position update with viewport culling
	function updateIslandPositionsOptimized() {
		if (!svg || !map || !browser || !islandsCreated) return;

		const bounds = map.getBounds();
		const updates = [];

		svg.selectAll('.island-group').each(function (d) {
			const isVisible = isInViewport(d.coordinates, bounds);
			const element = d3.select(this);

			if (isVisible) {
				const point = map.latLngToLayerPoint([d.coordinates[0], d.coordinates[1]]);
				updates.push({
					element: this,
					transform: `translate(${point.x},${point.y})`,
					visible: true
				});
			} else {
				updates.push({
					element: this,
					visible: false
				});
			}
		});

		// Batch DOM updates
		updates.forEach((update) => {
			const element = d3.select(update.element);
			if (update.visible) {
				element.attr('transform', update.transform).style('display', 'block');
			} else {
				element.style('display', 'none');
			}
		});
	}

	// Regular position update (fallback)
	function updateIslandPositions() {
		if (!svg || !map || !browser || !islandsCreated) return;

		svg.selectAll('.island-group').attr('transform', (d) => {
			const point = map.latLngToLayerPoint([d.coordinates[0], d.coordinates[1]]);
			return `translate(${point.x},${point.y})`;
		});
	}

	// Data update function (unchanged)
	function updateIslandsData() {
		if (!svg || !map || !browser || !islandsCreated) return;

		svg.selectAll('.island-group').each(function (d, i) {
			const group = d3.select(this);
			const data = getDataForYear(d, selectedYear);
			const hasData = data && data.rate > 0;
			const islandRadius = hasData ? Math.max(8, Math.sqrt(data.rate) * 0.8) : 6;

			// Update island circle
			group
				.select('.island')
				.transition()
				.duration(400)
				.attr('r', islandRadius)
				.style('fill', hasData ? d.color : '#95a5a6');

			// Update glow
			group
				.select('.island-glow')
				.transition()
				.duration(400)
				.attr('r', islandRadius * 1.5)
				.style('fill', hasData ? d.color : '#95a5a6');

			// Update or hide column
			if (hasData) {
				const columnHeight = (data.rate / 100) * 50;
				const columnWidth = Math.max(6, islandRadius * 0.6);

				group
					.select('.column-shadow')
					.transition()
					.duration(400)
					.attr('x', -columnWidth / 2 + 2)
					.attr('y', -islandRadius - 8 - columnHeight)
					.attr('width', columnWidth)
					.attr('height', columnHeight)
					.style('opacity', 1);

				group
					.select('.column')
					.transition()
					.duration(400)
					.attr('x', -columnWidth / 2)
					.attr('y', -islandRadius - 8 - columnHeight)
					.attr('width', columnWidth)
					.attr('height', columnHeight)
					.style('opacity', 1);

				group
					.select('.column-label')
					.transition()
					.duration(400)
					.attr('y', -islandRadius - 12 - columnHeight)
					.style('opacity', 1)
					.text(`${data.rate.toFixed(1)}%`);
			} else {
				group
					.selectAll('.column-shadow, .column, .column-label')
					.transition()
					.duration(400)
					.style('opacity', 0);
			}

			group
				.select('.country-label')
				.transition()
				.duration(400)
				.attr('y', islandRadius + 18);
		});
	}

	// Utility functions (unchanged)
	function getLatestData(country) {
		const years = Object.keys(country.participationRates)
			.map((d) => parseInt(d))
			.sort((a, b) => b - a);
		if (years.length === 0) return null;
		return {
			year: years[0],
			rate: country.participationRates[years[0]]
		};
	}

	function getDataForYear(country, year) {
		if (year === 'latest') return getLatestData(country);
		return country.participationRates[year]
			? {
					year: parseInt(year),
					rate: country.participationRates[year]
				}
			: null;
	}

	function getCurrentStats() {
		const dataPoints = islandsData
			.map((country) => getDataForYear(country, selectedYear))
			.filter((data) => data && data.rate > 0);

		if (dataPoints.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

		const rates = dataPoints.map((d) => d.rate);
		return {
			avg: rates.reduce((a, b) => a + b, 0) / rates.length,
			min: Math.min(...rates),
			max: Math.max(...rates),
			count: rates.length
		};
	}

	// Optimized map initialization
	async function initializeMap() {
		if (!browser) return;

		try {
			isLoading = true;
			await new Promise((resolve) => setTimeout(resolve, 300));
			L = await import('leaflet');

			// Fix for default markers
			delete L.Icon.Default.prototype._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl:
					'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
			});

			// Enhanced map configuration
			map = L.map(mapElement, {
				center: [-10, 165],
				zoom: 4,
				minZoom: 2,
				maxZoom: 18,
				worldCopyJump: true,
				preferCanvas: true,
				zoomControl: false,
				attributionControl: false,
				// Performance optimizations
				fadeAnimation: true,
				zoomAnimation: true,
				markerZoomAnimation: true,
				zoomSnap: 0.25,
				wheelPxPerZoomLevel: 120,
				// Tile loading optimizations
				keepBuffer: 3,
				updateWhenIdle: false,
				updateWhenZooming: true
			});

			// Add zoom control
			const customZoomControl = L.control.zoom({
				position: 'topright'
			});
			customZoomControl.addTo(map);

			// Enhanced tile layer
			const tileLayer = L.tileLayer(
				'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
				{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
					subdomains: 'abcd',
					maxZoom: 20
				}
			);
			tileLayer.addTo(map);

			// Initialize optimizer
			optimizer = new MapInteractionOptimizer(map, null);

			// Handle tile loading
			let tilesLoaded = 0;
			let totalTiles = 0;

			tileLayer.on('loading', () => totalTiles++);
			tileLayer.on('load', () => {
				tilesLoaded++;
				if (tilesLoaded >= totalTiles * 0.8) {
					isLoading = false;
					mapReady = true;
				}
			});

			// Optimized event handlers
			map.on('zoomstart', () => {
				if (svg) {
					svg.style('pointer-events', 'none');
				}
			});

			map.on('zoomend', () => {
				if (optimizer) {
					optimizer.performUpdate();
				}
				if (svg) {
					svg.style('pointer-events', 'auto');
				}
			});

			map.on('movestart', () => {
				if (svg) {
					svg.classed('moving', true);
				}
			});

			map.on('moveend', () => {
				if (optimizer) {
					optimizer.performUpdate();
				}
				if (svg) {
					svg.classed('moving', false);
				}
			});

			// Use passive event listeners for better performance
			map.on('zoom move', () => {
				if (optimizer) {
					optimizer.debouncedUpdate();
				}
			});

			// Wait for map to be ready
			map.whenReady(async () => {
				setupD3Overlay();

				// Update optimizer with svg reference
				if (optimizer && svg) {
					optimizer.svg = svg;
				}

				setTimeout(() => {
					isLoading = false;
					mapReady = true;
				}, 800); // Reduced timeout since tiles are preloading aggressively
			});
		} catch (error) {
			console.error('Error initializing map:', error);
			isLoading = false;
		}
	}

	// Enhanced D3 overlay setup
	function setupD3Overlay() {
		if (!map || !L || !browser) return;

		// Create SVG with performance optimizations
		svgElement = d3
			.select(map.getPanes().overlayPane)
			.append('svg')
			.style('pointer-events', 'auto')
			.style('transform-origin', '0 0')
			.style('will-change', 'transform');

		const g = svgElement.append('g').attr('class', 'leaflet-zoom-hide');
		svg = g;

		// Optimized update function
		function updateOverlayOptimized() {
			const bounds = map.getBounds();
			const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
			const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

			svgElement
				.attr('width', bottomRight.x - topLeft.x)
				.attr('height', bottomRight.y - topLeft.y)
				.style('left', topLeft.x + 'px')
				.style('top', topLeft.y + 'px');

			g.attr('transform', `translate(${-topLeft.x},${-topLeft.y})`);

			if (!islandsCreated) {
				createIslands();
			} else {
				updateIslandPositionsOptimized();
			}
		}

		// RAF-based scheduled update
		function scheduledUpdate() {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(updateOverlayOptimized);
		}

		// Bind optimized events
		map.on('viewreset zoom zoomend moveend', scheduledUpdate);

		// Initial update
		scheduledUpdate();
	}

	// Create islands function (unchanged)
	function createIslands() {
		if (!svg || !map || !browser || islandsCreated) return;

		// Create tooltip
		const tooltip = d3
			.select('body')
			.selectAll('.leaflet-tooltip')
			.data([null])
			.join('div')
			.attr('class', 'leaflet-tooltip')
			.style('position', 'absolute')
			.style(
				'background',
				'linear-gradient(135deg, rgba(44, 62, 80, 0.98), rgba(52, 73, 94, 0.98))'
			)
			.style('color', 'white')
			.style('padding', '16px 20px')
			.style('border-radius', '12px')
			.style('font-size', '14px')
			.style('pointer-events', 'none')
			.style('opacity', 0)
			.style('box-shadow', '0 8px 32px rgba(0,0,0,0.3)')
			.style('z-index', '1000')
			.style('backdrop-filter', 'blur(10px)')
			.style('border', '1px solid rgba(255,255,255,0.1)');

		// Prepare data with animation delays
		const islandsWithDelay = islandsData.map((d, i) => ({
			...d,
			animationDelay: i * 100
		}));

		// Create island groups
		const islandGroups = svg
			.selectAll('.island-group')
			.data(islandsWithDelay)
			.enter()
			.append('g')
			.attr('class', 'island-group')
			.attr('transform', (d) => {
				const point = map.latLngToLayerPoint([d.coordinates[0], d.coordinates[1]]);
				return `translate(${point.x},${point.y})`;
			})
			.style('opacity', 0);

		// Animate entrance
		islandGroups
			.transition()
			.delay((d) => d.animationDelay)
			.duration(800)
			.ease(d3.easeCubicOut)
			.style('opacity', 1);

		// Add islands and their elements
		islandGroups.each(function (d, i) {
			const group = d3.select(this);
			const data = getDataForYear(d, selectedYear);
			const hasData = data && data.rate > 0;
			const islandRadius = hasData ? Math.max(8, Math.sqrt(data.rate) * 0.8) : 6;

			// Glow effect
			group
				.append('circle')
				.attr('class', 'island-glow')
				.attr('r', islandRadius * 1.5)
				.style('fill', hasData ? d.color : '#95a5a6')
				.style('opacity', 0.2)
				.style('filter', 'blur(4px)');

			// Main island circle
			group
				.append('circle')
				.attr('class', 'island')
				.attr('r', 0)
				.style('fill', hasData ? d.color : '#95a5a6')
				.style('stroke', 'white')
				.style('stroke-width', 3)
				.style('cursor', 'pointer')
				.style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
				.transition()
				.delay(d.animationDelay + 200)
				.duration(600)
				.ease(d3.easeElasticOut)
				.attr('r', islandRadius);

			// Column shadow
			group
				.append('rect')
				.attr('class', 'column-shadow')
				.style('fill', 'rgba(0,0,0,0.3)')
				.style('filter', 'blur(2px)')
				.style('opacity', 0);

			// Column gradient
			const gradient = svg
				.append('defs')
				.append('linearGradient')
				.attr('id', `column-gradient-${i}`)
				.attr('x1', '0%')
				.attr('y1', '0%')
				.attr('x2', '0%')
				.attr('y2', '100%');

			gradient.append('stop').attr('offset', '0%').attr('stop-color', d.color);
			gradient
				.append('stop')
				.attr('offset', '100%')
				.attr('stop-color', d3.color(d.color).darker(0.5));

			// Main column
			group
				.append('rect')
				.attr('class', 'column')
				.style('fill', `url(#column-gradient-${i})`)
				.style('stroke', 'white')
				.style('stroke-width', 1)
				.style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
				.style('opacity', 0);

			// Value label
			group
				.append('text')
				.attr('class', 'column-label')
				.attr('x', 0)
				.style('text-anchor', 'middle')
				.style('font-size', '10px')
				.style('font-weight', '700')
				.style('fill', '#2c3e50')
				.style('text-shadow', '0 2px 4px rgba(255,255,255,0.8)')
				.style('opacity', 0);

			// Country label
			group
				.append('text')
				.attr('class', 'country-label')
				.attr('x', 0)
				.attr('y', islandRadius + 18)
				.text(d.name)
				.style('text-anchor', 'middle')
				.style('font-size', '11px')
				.style('font-weight', '600')
				.style('fill', '#2c3e50')
				.style('text-shadow', '0 2px 4px rgba(255,255,255,0.9)')
				.style('opacity', 0)
				.transition()
				.delay(d.animationDelay + 600)
				.duration(600)
				.style('opacity', 1);

			// Enhanced hover interactions
			group
				.on('mouseenter', function (event) {
					hoveredIsland = d.name;
					const currentData = getDataForYear(d, selectedYear);
					const currentRadius =
						currentData && currentData.rate > 0
							? Math.max(8, Math.sqrt(currentData.rate) * 0.8)
							: 6;

					group
						.select('.island')
						.transition()
						.duration(200)
						.ease(d3.easeBackOut)
						.attr('r', currentRadius * 1.3)
						.style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))');

					let tooltipContent = `
						<div style="display: flex; align-items: center; margin-bottom: 12px;">
							<div style="width: 12px; height: 12px; border-radius: 50%; background: ${d.color}; margin-right: 8px;"></div>
							<strong style="font-size: 18px;">${d.name}</strong>
						</div>
					`;

					if (currentData) {
						tooltipContent += `
							<div style="display: flex; align-items: center; margin-bottom: 8px;">
								<span style="margin-right: 8px;">📊</span>
								<strong>Participation Rate:</strong>
								<span style="margin-left: 8px; color: #3498db; font-weight: 700;">${currentData.rate}%</span>
							</div>
							<div style="display: flex; align-items: center; margin-bottom: 8px;">
								<span style="margin-right: 8px;">📅</span>
								<strong>Year:</strong>
								<span style="margin-left: 8px;">${currentData.year}</span>
							</div>
						`;
					} else {
						tooltipContent += `
							<div style="display: flex; align-items: center;">
								<span style="margin-right: 8px;">❌</span>
								<span style="opacity: 0.8;">No data available</span>
							</div>
						`;
					}

					tooltip
						.html(tooltipContent)
						.style('left', event.pageX + 20 + 'px')
						.style('top', event.pageY - 10 + 'px')
						.style('opacity', 1);
				})
				.on('mouseleave', function () {
					hoveredIsland = null;
					const currentData = getDataForYear(d, selectedYear);
					const currentRadius =
						currentData && currentData.rate > 0
							? Math.max(8, Math.sqrt(currentData.rate) * 0.8)
							: 6;

					group
						.select('.island')
						.transition()
						.duration(300)
						.ease(d3.easeBackIn)
						.attr('r', currentRadius)
						.style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

					tooltip.style('opacity', 0);
				})
				.on('mousemove', function (event) {
					tooltip.style('left', event.pageX + 20 + 'px').style('top', event.pageY - 10 + 'px');
				});
		});

		islandsCreated = true;

		// Initial data update
		setTimeout(() => {
			updateIslandsData();
		}, 1500);
	}

	// Cleanup function
	function cleanupMapResources() {
		if (rafId) {
			cancelAnimationFrame(rafId);
		}

		if (optimizer && optimizer.predictiveCache) {
			optimizer.predictiveCache.clear();
		}

		if (tileCache) {
			tileCache.clear();
		}

		if (predictiveCache) {
			predictiveCache.clear();
		}

		if (map) {
			map.off();
			map.remove();
		}

		if (svg) {
			svg.selectAll('*').remove();
		}

		d3.select('body').selectAll('.leaflet-tooltip').remove();
	}

	// Reactive effect for year changes
	$effect(() => {
		if (islandsCreated && mapReady) {
			updateIslandsData();
		}
	});

	onMount(() => {
		if (browser) {
			initializeMap();
		}
	});

	onDestroy(() => {
		if (browser) {
			cleanupMapResources();
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
	<div class="mx-auto max-w-7xl">
		<!-- Header Section -->
		<div class="animate-fade-in mb-8 text-center">
			<div class="mb-4 inline-flex items-center gap-3">
				<div class="relative">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"
					>
						<span class="text-2xl">🏝️</span>
					</div>
					<div
						class="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-emerald-400"
					></div>
				</div>
				<h1
					class="bg-gradient-to-r from-slate-800 via-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
				>
					Pacific Islands Education - Optimized
				</h1>
			</div>
			<p class="mx-auto mb-2 max-w-2xl text-lg text-slate-600">
				Interactive visualization with preloaded tiles and optimized performance
			</p>
			<p class="flex items-center justify-center gap-2 text-sm text-slate-500">
				<span class="inline-flex items-center gap-1">
					🗺️ <span>Pan & zoom to explore</span>
				</span>
				<span class="text-slate-300">•</span>
				<span class="inline-flex items-center gap-1">
					🎯 <span>Hover for details</span>
				</span>
				<span class="text-slate-300">•</span>
				<span class="inline-flex items-center gap-1">
					⚡ <span>Optimized performance</span>
				</span>
			</p>
		</div>

		<!-- Stats Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
			<div
				class="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
						<span class="text-lg text-blue-600">📊</span>
					</div>
					<div>
						<p class="text-sm font-medium text-slate-500">Countries</p>
						<p class="text-2xl font-bold text-slate-800">{stats.count}</p>
					</div>
				</div>
			</div>

			<div
				class="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
						<span class="text-lg text-emerald-600">📈</span>
					</div>
					<div>
						<p class="text-sm font-medium text-slate-500">Average Rate</p>
						<p class="text-2xl font-bold text-slate-800">{stats.avg.toFixed(1)}%</p>
					</div>
				</div>
			</div>

			<div
				class="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
						<span class="text-lg text-red-600">📉</span>
					</div>
					<div>
						<p class="text-sm font-medium text-slate-500">Minimum</p>
						<p class="text-2xl font-bold text-slate-800">{stats.min.toFixed(1)}%</p>
					</div>
				</div>
			</div>

			<div
				class="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
						<span class="text-lg text-purple-600">🎯</span>
					</div>
					<div>
						<p class="text-sm font-medium text-slate-500">Maximum</p>
						<p class="text-2xl font-bold text-slate-800">{stats.max.toFixed(1)}%</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Performance Indicator -->
		{#if isPreloading}
			<div class="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4 backdrop-blur-sm">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
						></div>
					</div>
					<div class="flex-1">
						<div class="text-sm text-blue-800">
							<strong>Aggressive Tile Preloading:</strong> Loading entire Pacific region...
						</div>
						<div class="mt-1 h-2 w-full rounded-full bg-blue-200">
							<div
								class="h-2 rounded-full bg-blue-500 transition-all duration-300"
								style="width: {Math.min(preloadingProgress, 90)}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		{:else if tileCache.size > 100}
			<div class="mb-4 rounded-xl border border-green-200 bg-green-50/80 p-4 backdrop-blur-sm">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
						<span class="text-sm">🚀</span>
					</div>
					<div class="text-sm text-green-800">
						<strong>Maximum Performance:</strong>
						{tileCache.size} tiles cached • No background visible • Seamless navigation
					</div>
				</div>
			</div>
		{:else if tileCache.size > 0}
			<div class="mb-4 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4 backdrop-blur-sm">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
						<span class="text-sm">⚡</span>
					</div>
					<div class="text-sm text-yellow-800">
						<strong>Performance Enhanced:</strong>
						{tileCache.size} tiles cached • Loading more in background...
					</div>
				</div>
			</div>
		{/if}

		<!-- Controls -->
		<div class="mb-8 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="flex items-center gap-4">
					<label for="yearSelect" class="flex items-center gap-2 font-semibold text-slate-700">
						<span class="text-lg">📅</span>
						Select Year:
					</label>
					<div class="relative">
						<select
							id="yearSelect"
							bind:value={selectedYear}
							class="cursor-pointer appearance-none rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 pr-10 font-medium text-slate-700 transition-all duration-300 hover:from-blue-100 hover:to-cyan-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none"
						>
							<option value="latest">Latest Available Data</option>
							<option value="2023">2023</option>
							<option value="2022">2022</option>
							<option value="2021">2021</option>
							<option value="2020">2020</option>
							<option value="2019">2019</option>
							<option value="2018">2018</option>
							<option value="2017">2017</option>
							<option value="2016">2016</option>
							<option value="2015">2015</option>
						</select>
						<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
							<svg
								class="h-5 w-5 text-slate-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						</div>
					</div>
				</div>

				{#if hoveredIsland}
					<div
						class="flex animate-pulse items-center gap-2 rounded-full bg-blue-100 px-4 py-2 transition-all duration-300"
					>
						<div class="h-3 w-3 rounded-full bg-blue-500"></div>
						<span class="text-sm font-medium text-blue-700">Exploring: {hoveredIsland}</span>
					</div>
				{:else}
					<div class="flex items-center gap-2 text-sm text-slate-500">
						<span class="animate-bounce">👆</span>
						<span>Hover over islands to explore data</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Map Container -->
		<div
			class="relative overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-xl backdrop-blur-sm will-change-transform"
		>
			<!-- Loading Overlay -->
			{#if isLoading}
				<div
					class="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-blue-50/95 to-cyan-50/95 backdrop-blur-sm"
				>
					<div class="text-center">
						<div class="relative mb-6">
							<div
								class="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500"
							></div>
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="h-8 w-8 animate-pulse rounded-full bg-blue-500"></div>
							</div>
						</div>
						<h3 class="mb-2 text-xl font-semibold text-slate-700">Loading Pacific Islands</h3>
						<p class="animate-pulse text-slate-500">
							Preloading entire Pacific region for seamless experience...
						</p>
					</div>
				</div>
			{/if}

			<!-- Map -->
			<div
				bind:this={mapElement}
				class="relative h-[600px] w-full overflow-hidden rounded-3xl md:h-[700px]"
			></div>
		</div>

		<!-- Enhanced Legend -->
		<div class="mt-8 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
			<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
				<span class="text-xl">🎨</span>
				Legend & Guide
			</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<!-- Island Types -->
				<div class="space-y-3">
					<h4 class="text-sm font-medium tracking-wide text-slate-700 uppercase">Island Status</h4>
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<div
								class="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm"
							></div>
							<span class="text-sm text-slate-600">With Data</span>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-r from-slate-300 to-slate-400 shadow-sm"
							></div>
							<span class="text-sm text-slate-600">No Data Available</span>
						</div>
					</div>
				</div>

				<!-- Participation Rates -->
				<div class="space-y-3">
					<h4 class="text-sm font-medium tracking-wide text-slate-700 uppercase">
						Participation Rate
					</h4>
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<div
								class="h-8 w-4 rounded bg-gradient-to-t from-blue-400 to-blue-500 shadow-sm"
							></div>
							<span class="text-sm text-slate-600">Column Height = Rate %</span>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="h-3 w-8 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-sm"
							></div>
							<span class="text-sm text-slate-600">Circle Size = Rate Level</span>
						</div>
					</div>
				</div>

				<!-- Interactions -->
				<div class="space-y-3">
					<h4 class="text-sm font-medium tracking-wide text-slate-700 uppercase">Interactions</h4>
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
								<span class="text-xs">🖱️</span>
							</div>
							<span class="text-sm text-slate-600">Hover for Details</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
								<span class="text-xs">🔍</span>
							</div>
							<span class="text-sm text-slate-600">Pan & Zoom Map</span>
						</div>
					</div>
				</div>

				<!-- Performance Features -->
				<div class="space-y-3">
					<h4 class="text-sm font-medium tracking-wide text-slate-700 uppercase">Performance</h4>
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-green-100">
								<span class="text-xs">⚡</span>
							</div>
							<span class="text-sm text-slate-600">Tile Preloading</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100">
								<span class="text-xs">👁️</span>
							</div>
							<span class="text-sm text-slate-600">Viewport Culling</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center">
			<div
				class="inline-flex items-center gap-2 rounded-full bg-white/50 px-6 py-3 text-sm text-slate-600 backdrop-blur-sm"
			>
				<span>Built with</span>
				<div class="flex items-center gap-1">
					<span class="font-semibold text-blue-600">Svelte 5</span>
					<span class="text-slate-400">•</span>
					<span class="font-semibold text-emerald-600">D3.js</span>
					<span class="text-slate-400">•</span>
					<span class="font-semibold text-cyan-600">Leaflet</span>
					<span class="text-slate-400">•</span>
					<span class="font-semibold text-purple-600">Tailwind CSS</span>
				</div>
				<span class="animate-pulse">✨</span>
			</div>
		</div>
	</div>
</div>

<style>
	@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

	/* Custom animations */
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out;
	}

	/* Enhanced Leaflet styles */
	:global(.leaflet-container) {
		font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
		background: linear-gradient(135deg, #e3f2fd 0%, #81d4fa 50%, #4fc3f7 100%);
	}

	:global(.leaflet-control-zoom) {
		border: none !important;
		border-radius: 16px !important;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
		backdrop-filter: blur(10px);
		background: rgba(255, 255, 255, 0.9) !important;
		overflow: hidden;
	}

	:global(.leaflet-control-zoom a) {
		border: none !important;
		border-radius: 0 !important;
		color: #475569 !important;
		font-weight: 600 !important;
		font-size: 18px !important;
		width: 40px !important;
		height: 40px !important;
		line-height: 40px !important;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
		background: rgba(255, 255, 255, 0.8) !important;
	}

	:global(.leaflet-control-zoom a:hover) {
		background: rgba(59, 130, 246, 0.1) !important;
		color: #3b82f6 !important;
		transform: scale(1.05);
	}

	:global(.leaflet-control-zoom a:first-child) {
		border-top-left-radius: 16px !important;
		border-top-right-radius: 16px !important;
	}

	:global(.leaflet-control-zoom a:last-child) {
		border-bottom-left-radius: 16px !important;
		border-bottom-right-radius: 16px !important;
	}

	/* Tooltip enhancements */
	:global(.leaflet-tooltip) {
		backdrop-filter: blur(16px) !important;
		transform: translateY(10px) scale(0.95);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	/* SVG overlay animations */
	:global(.island-group) {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.island-group:hover) {
		filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15));
		transform: translateY(-2px);
	}

	/* Performance optimizations */
	:global(.moving .island-group) {
		transition: none;
	}

	/* Custom scrollbar */
	:global(::-webkit-scrollbar) {
		width: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgba(248, 250, 252, 0.5);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: rgba(148, 163, 184, 0.5);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgba(148, 163, 184, 0.8);
	}

	/* Focus styles for accessibility */
	:global(*:focus) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Print styles */
	@media print {
		.controls,
		.footer {
			display: none !important;
		}

		.map-container {
			break-inside: avoid;
		}
	}
</style>
