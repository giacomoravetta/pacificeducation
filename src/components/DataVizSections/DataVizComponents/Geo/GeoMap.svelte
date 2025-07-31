<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as d3 from 'd3';
	import { Drawer, Button } from 'flowbite-svelte';
	import OptionsSelector from '$lib/OptionsSelector.svelte';

	let hidden = $state(true);
	let hiddenTime = $state(true);
	// Svelte 5 reactive state using runes
	let mapContainer = $state();
	let selectedYear = $state(null); // Start with null, will be set when data is available
	let currentHover = $state(null);
	let isInitializing = $state(true);
	let isPlaying = $state(false);
	let playInterval = $state(null);
	let filtersReady = $state(false);

	// Private variables (non-reactive)
	let leafletMap;
	let leafletLib;
	let d3Overlay;
	let islandsRendered = false;

	let { optionsState, filteredData, handleSkillToggle, handleEducationToggle, handleSexToggle } =
		$props();

	$effect(() => {
		console.log('Filtered data updated:', $state.snapshot(filteredData));
		console.log('Options state:', $state.snapshot(optionsState));
	});

	// Check if all required filters are set
	$effect(() => {
		// Fix: Check for arrays instead of objects with boolean properties
		const hasValidSex = optionsState?.selectedSexes && optionsState.selectedSexes.length > 0;
		const hasValidEducation =
			optionsState?.selectedEducation && optionsState.selectedEducation.length > 0;
		const hasValidSkill = optionsState?.selectedSkills && optionsState.selectedSkills.length > 0;

		const newFiltersReady = hasValidSex && hasValidEducation && hasValidSkill;

		console.log('Filter status detailed:', {
			optionsState: optionsState,
			sex: {
				exists: !!optionsState?.selectedSexes,
				values: optionsState?.selectedSexes,
				valid: hasValidSex
			},
			education: {
				exists: !!optionsState?.selectedEducation,
				values: optionsState?.selectedEducation,
				valid: hasValidEducation
			},
			skill: {
				exists: !!optionsState?.selectedSkills,
				values: optionsState?.selectedSkills,
				valid: hasValidSkill
			},
			ready: newFiltersReady,
			filteredDataLength: filteredData?.length || 0
		});

		filtersReady = newFiltersReady;
	});

	// Set initial year when data becomes available
	$effect(() => {
		if (filtersReady && availableYears.length > 0 && selectedYear === null) {
			selectedYear = availableYears[0]; // Set to first available year
			console.log('Setting initial year to:', availableYears[0]);
		}
	});

	// Get available years from filteredData
	const availableYears = $derived.by(() => {
		const years = new Set();
		filteredData.forEach((row) => {
			years.add(row.TIME_PERIOD);
		});
		const yearArray = Array.from(years).sort((a, b) => a - b);
		console.log('Available years from OBS_VALUE data:', yearArray);
		return yearArray;
	});

	// Generate Pacific Islands data from filteredData instead of appData
	const pacificIslands = $derived.by(() => {
		const islands = [];

		// Get all island names from coordinatesIslands (this should be the master list)
		for (const [islandName, coords] of Object.entries(optionsState.coordinatesIslands)) {
			// Find education rates for this island from filteredData
			const rates = {};

			// Look through filteredData to find rates for this island
			const islandData = filteredData.filter((row) => row.GEO_PICT === islandName);

			// Extract OBS_VALUE by TIME_PERIOD - this is the key fix
			islandData.forEach((row) => {
				if (
					row.TIME_PERIOD &&
					row.OBS_VALUE !== null &&
					row.OBS_VALUE !== undefined &&
					row.OBS_VALUE > 0
				) {
					rates[row.TIME_PERIOD] = row.OBS_VALUE; // Using OBS_VALUE directly
				}
			});

			// Only include islands that have data
			if (Object.keys(rates).length > 0) {
				islands.push({
					name: islandName,
					lat: coords.lat,
					lng: coords.lng,
					rates: rates,
					color: optionsState.colorsIslands[islandName] || '#95a5a6'
				});
			}
		}

		console.log(
			'Pacific islands with OBS_VALUE data:',
			islands.map((i) => ({
				name: i.name,
				rates: i.rates
			}))
		);
		return islands;
	});

	// Normalize coordinates for Pacific-centered view
	const normalizedIslands = $derived(
		pacificIslands.map((island) => ({
			...island,
			originalLng: island.lng,
			lng: island.lng < 0 ? island.lng + 360 : island.lng,
			color: optionsState.colorsIslands[island.name] || '#95a5a6',
			pacificNormalized: true
		}))
	);

	function getPacificCenter() {
		if (normalizedIslands.length === 0) {
			return [-15, 180]; // Default Pacific center
		}

		const avgLat =
			normalizedIslands.reduce((sum, island) => sum + island.lat, 0) / normalizedIslands.length;
		const avgLng =
			normalizedIslands.reduce((sum, island) => sum + island.lng, 0) / normalizedIslands.length;

		console.log('🌏 Pacific center calculated:', [avgLat, avgLng]);
		return [avgLat, avgLng];
	}

	function getYearData(island, year) {
		if (!year || !filtersReady) return null;

		if (year === 'latest') {
			const years = Object.keys(island.rates)
				.map(Number)
				.sort((a, b) => b - a);
			return years.length > 0 ? { year: years[0], rate: island.rates[years[0]] } : null;
		}
		return island.rates[year] ? { year: Number(year), rate: island.rates[year] } : null;
	}

	// Time control functions
	function playAnimation() {
		if (availableYears.length === 0 || !filtersReady) return;

		isPlaying = true;
		let currentIndex = availableYears.indexOf(parseInt(selectedYear));
		if (currentIndex === -1) currentIndex = 0;

		playInterval = setInterval(() => {
			currentIndex = (currentIndex + 1) % availableYears.length;
			selectedYear = availableYears[currentIndex];
		}, 1500); // Change every 1.5 seconds
	}

	function stopAnimation() {
		isPlaying = false;
		if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
	}

	function resetToFirstYear() {
		stopAnimation();
		if (availableYears.length > 0) {
			selectedYear = availableYears[0];
		}
	}

	function getLeafletPosition(island) {
		return [island.lat, island.lng];
	}

	// Close mobile tooltip function
	function closeMobileTooltip() {
		const mobileTooltip = d3.select('.mobile-column-tooltip');

		if (!mobileTooltip.empty()) {
			mobileTooltip
				.transition()
				.duration(200)
				.style('opacity', '0')
				.on('end', function () {
					mobileTooltip.remove();
					// Restore body scroll
					document.body.style.overflow = '';
					// Remove escape key listener
					d3.select(window).on('keydown.mobile-tooltip', null);
				});
		}
	}

	// Enhanced mobile-responsive tooltip system for column interactions
	function createMobileResponsiveTooltip(island, data, event) {
		// Check if we're on mobile
		const isMobile = window.innerWidth < 768;

		if (isMobile) {
			// Create mobile modal tooltip
			createMobileModalTooltip(island, data);
		} else {
			// Create desktop hover tooltip
			createDesktopTooltip(island, data, event);
		}
	}

	// Mobile modal tooltip (centered, full overlay)
	function createMobileModalTooltip(island, data) {
		// Remove any existing mobile tooltips
		d3.select('.mobile-column-tooltip').remove();

		// Create overlay backdrop
		const mobileTooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'mobile-column-tooltip')
			.style('position', 'fixed')
			.style('top', '0')
			.style('left', '0')
			.style('right', '0')
			.style('bottom', '0')
			.style('background', 'rgba(0, 0, 0, 0.5)')
			.style('backdrop-filter', 'blur(8px)')
			.style('z-index', '9999')
			.style('display', 'flex')
			.style('align-items', 'center')
			.style('justify-content', 'center')
			.style('padding', '20px')
			.style('opacity', '0')
			.style('cursor', 'pointer')
			.on('click', function (event) {
				// Close when clicking outside the modal content
				if (event.target === this) {
					closeMobileTooltip();
				}
			});

		// Create modal content
		const modalContent = mobileTooltip
			.append('div')
			.style(
				'background',
				'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))'
			)
			.style('color', 'white')
			.style('border-radius', '20px')
			.style('padding', '24px')
			.style('max-width', '90vw')
			.style('max-height', '80vh')
			.style('overflow-y', 'auto')
			.style('box-shadow', '0 20px 60px rgba(0, 0, 0, 0.4)')
			.style('border', `3px solid ${optionsState.colorsIslands[island.name] || '#3b82f6'}`)
			.style('cursor', 'default')
			.style('transform', 'scale(0.8)')
			.style('transition', 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)')
			.on('click', function (event) {
				// Prevent closing when clicking inside modal
				event.stopPropagation();
			});

		// Performance indicators
		const performance =
			data.rate > 70
				? { icon: '🔥', label: 'High Performance', color: '#10b981' }
				: data.rate > 50
					? { icon: '📈', label: 'Medium Performance', color: '#f59e0b' }
					: { icon: '📉', label: 'Needs Improvement', color: '#ef4444' };

		const trend = getTrendInfo(island, data.year);
		const rankPosition = getRankPosition(data.rate);

		// Create detailed mobile content
		const content = `
			<!-- Close button -->
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
				<div style="display: flex; align-items: center; gap: 12px;">
					<div style="width: 16px; height: 16px; background: ${optionsState.colorsIslands[island.name] || '#3b82f6'}; border-radius: 50%; flex-shrink: 0;"></div>
					<h2 style="font-weight: 800; font-size: 20px; margin: 0; line-height: 1.2;">${island.name}</h2>
				</div>
				<button class="close-mobile-tooltip" style="background: rgba(255,255,255,0.1); border: none; border-radius: 8px; padding: 8px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center;">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Main metric -->
			<div style="text-align: center; padding: 24px; background: rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 20px; border: 2px solid ${optionsState.colorsIslands[island.name] || '#3b82f6'};">
				<div style="font-size: 48px; font-weight: 900; color: ${optionsState.colorsIslands[island.name] || '#3b82f6'}; line-height: 1; margin-bottom: 8px;">${data.rate}%</div>
				<div style="font-size: 16px; opacity: 0.9; font-weight: 600;">Literacy/Numeracy Rate</div>
				<div style="font-size: 14px; opacity: 0.7; margin-top: 4px;">Year ${data.year}</div>
			</div>

			<!-- Stats grid -->
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
				<div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; text-align: center;">
					<div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Regional Rank</div>
					<div style="font-size: 24px; font-weight: 700;">#${rankPosition}</div>
					<div style="font-size: 11px; opacity: 0.6;">of ${normalizedIslands.length} islands</div>
				</div>
				<div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; text-align: center;">
					<div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Performance</div>
					<div style="font-size: 20px; margin-bottom: 4px;">${performance.icon}</div>
					<div style="font-size: 12px; font-weight: 600; color: ${performance.color};">${performance.label}</div>
				</div>
			</div>

			<!-- Performance description -->
			<div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
				<div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${performance.icon} ${performance.label}</div>
				<div style="font-size: 14px; opacity: 0.9; line-height: 1.5;">${getPerformanceDescription(data.rate)}</div>
			</div>

			<!-- Trend information -->
			${trend}

			<!-- Tap anywhere to close hint -->
			<div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
				<div style="font-size: 12px; opacity: 0.6;">Tap outside to close</div>
			</div>
		`;

		modalContent.html(content);

		// Add close button functionality
		modalContent.select('.close-mobile-tooltip').on('click', closeMobileTooltip);

		// Animate in
		mobileTooltip.transition().duration(300).ease(d3.easeBackOut).style('opacity', '1');

		modalContent
			.transition()
			.duration(300)
			.delay(100)
			.ease(d3.easeBackOut)
			.style('transform', 'scale(1)');

		// Add escape key listener
		d3.select(window).on('keydown.mobile-tooltip', function (event) {
			if (event.key === 'Escape') {
				closeMobileTooltip();
			}
		});

		// Prevent body scroll
		document.body.style.overflow = 'hidden';
	}

	// Desktop hover tooltip (original behavior)
	function createDesktopTooltip(island, data, event) {
		// Remove any existing tooltips
		d3.select('.column-tooltip').remove();

		const columnTooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'column-tooltip')
			.style('position', 'absolute')
			.style(
				'background',
				'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))'
			)
			.style('color', 'white')
			.style('padding', '16px 20px')
			.style('border-radius', '12px')
			.style('font-size', '14px')
			.style('pointer-events', 'none')
			.style('opacity', 0)
			.style('backdrop-filter', 'blur(10px)')
			.style('border', `2px solid ${optionsState.colorsIslands[island.name] || '#3b82f6'}`)
			.style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)')
			.style('z-index', '1001')
			.style('max-width', '320px');

		const performance =
			data.rate > 70
				? '🔥 High Performance'
				: data.rate > 50
					? '📈 Medium Performance'
					: '📉 Needs Improvement';

		const trend = getTrendInfo(island, data.year);

		let content = `
			<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
				<div style="width: 12px; height: 12px; background: ${optionsState.colorsIslands[island.name] || '#3b82f6'}; border-radius: 50%;"></div>
				<span style="font-weight: 700; font-size: 16px;">${island.name}</span>
			</div>
			<div style="border-left: 3px solid ${optionsState.colorsIslands[island.name] || '#3b82f6'}; padding-left: 12px; margin-bottom: 12px;">
				<div style="font-size: 24px; font-weight: 800; color: ${optionsState.colorsIslands[island.name] || '#3b82f6'};">${data.rate}%</div>
				<div style="font-size: 12px; opacity: 0.8;">Literacy/Numeracy Rate</div>
			</div>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
				<div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
					<div style="font-size: 12px; opacity: 0.7;">Year</div>
					<div style="font-weight: 600;">${data.year}</div>
				</div>
				<div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
					<div style="font-size: 12px; opacity: 0.7;">Rank</div>
					<div style="font-weight: 600;">${getRankPosition(data.rate)}/${normalizedIslands.length}</div>
				</div>
			</div>
			<div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
				<div style="font-weight: 600; margin-bottom: 4px;">${performance}</div>
				<div style="font-size: 12px; opacity: 0.8;">${getPerformanceDescription(data.rate)}</div>
			</div>
			${trend}
		`;

		columnTooltip
			.html(content)
			.style('left', event.pageX + 15 + 'px')
			.style('top', event.pageY - 10 + 'px')
			.transition()
			.duration(300)
			.style('opacity', 1);

		// Auto-position to keep tooltip in viewport
		setTimeout(() => {
			const tooltip = columnTooltip.node();
			const rect = tooltip.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Adjust horizontal position
			if (rect.right > viewportWidth - 10) {
				columnTooltip.style('left', event.pageX - rect.width - 15 + 'px');
			}

			// Adjust vertical position
			if (rect.bottom > viewportHeight - 10) {
				columnTooltip.style('top', event.pageY - rect.height - 10 + 'px');
			}
		}, 10);
	}

	// Helper functions for enhanced tooltips
	function getRankPosition(rate) {
		const sortedRates = normalizedIslands
			.map((island) => getYearData(island, selectedYear))
			.filter((data) => data && data.rate > 0)
			.map((data) => data.rate)
			.sort((a, b) => b - a);

		return sortedRates.indexOf(rate) + 1;
	}

	function getPerformanceDescription(rate) {
		if (rate > 80) return 'Excellent educational outcomes';
		if (rate > 70) return 'Strong performance, above regional average';
		if (rate > 50) return 'Moderate performance, room for improvement';
		if (rate > 30) return 'Below average, requires focused intervention';
		return 'Significant challenges, needs comprehensive support';
	}

	function getTrendInfo(island, currentYear) {
		const years = Object.keys(island.rates).map(Number).sort();
		const currentIndex = years.indexOf(currentYear);

		if (currentIndex > 0) {
			const prevYear = years[currentIndex - 1];
			const prevRate = island.rates[prevYear];
			const currentRate = island.rates[currentYear];
			const change = currentRate - prevRate;

			if (Math.abs(change) < 1) {
				return `<div style="background: rgba(100,116,139,0.2); padding: 8px; border-radius: 6px; font-size: 12px;">
					📊 <strong>Stable:</strong> ${change >= 0 ? '+' : ''}${change.toFixed(1)}% from ${prevYear}
				</div>`;
			} else if (change > 0) {
				return `<div style="background: rgba(34,197,94,0.2); padding: 8px; border-radius: 6px; font-size: 12px;">
					📈 <strong>Improving:</strong> +${change.toFixed(1)}% from ${prevYear}
				</div>`;
			} else {
				return `<div style="background: rgba(239,68,68,0.2); padding: 8px; border-radius: 6px; font-size: 12px;">
					📉 <strong>Declining:</strong> ${change.toFixed(1)}% from ${prevYear}
				</div>`;
			}
		}

		return `<div style="background: rgba(100,116,139,0.2); padding: 8px; border-radius: 6px; font-size: 12px;">
			📊 <strong>Baseline year</strong> - No previous data available
		</div>`;
	}

	// Enhanced animated column visualization with better scaling
	function createAnimatedColumns(group, island, data, hasData) {
		// Only show columns if filters are ready
		if (!filtersReady) {
			// Hide all columns when filters not ready
			const columnGroup = group.select('.column-system');
			if (!columnGroup.empty()) {
				columnGroup.selectAll('*').transition().duration(300).style('opacity', 0);
			}
			return;
		}

		const baseRadius = hasData ? Math.max(6, Math.sqrt(data.rate) * 0.5) : 5;
		const intensity = hasData ? data.rate / 100 : 0;

		// Main island circle - use color from optionsState
		group
			.select('.main-circle')
			.transition()
			.duration(500)
			.attr('r', baseRadius)
			.style('fill', hasData ? optionsState.colorsIslands[island.name] || '#3b82f6' : '#ccc')
			.style('opacity', hasData ? 0.9 : 0.5);

		let columnGroup = group.select('.column-system');
		if (columnGroup.empty()) {
			columnGroup = group.append('g').attr('class', 'column-system');
		}

		if (hasData) {
			// Column dimensions - better scaling for the data range
			const columnWidth = 3 + intensity * 4;
			const maxColumnHeight = 20 + intensity * 40; // Increased range for better visibility
			const columnHeight = Math.max(5, intensity * maxColumnHeight); // Minimum height

			// Create main column with gradient
			let column = columnGroup.select('.data-column');
			if (column.empty()) {
				column = columnGroup
					.append('rect')
					.attr('class', 'data-column')
					.attr('x', -columnWidth / 2)
					.attr('y', 0)
					.attr('width', columnWidth)
					.attr('height', 0)
					.attr('rx', 2)
					.style('fill', `url(#columnGradient-${island.name.replace(/\s+/g, '')})`)
					.style('stroke', 'white')
					.style('stroke-width', 1);

				// Create gradient definition
				const defs = d3.select('svg').select('defs').empty()
					? d3.select('svg').append('defs')
					: d3.select('svg').select('defs');

				const gradient = defs
					.append('linearGradient')
					.attr('id', `columnGradient-${island.name.replace(/\s+/g, '')}`)
					.attr('x1', '0%')
					.attr('y1', '0%')
					.attr('x2', '0%')
					.attr('y2', '100%');

				const islandColor = optionsState.colorsIslands[island.name] || '#3b82f6';
				gradient
					.append('stop')
					.attr('offset', '0%')
					.style('stop-color', d3.color(islandColor).brighter(0.5))
					.style('stop-opacity', 0.9);

				gradient
					.append('stop')
					.attr('offset', '100%')
					.style('stop-color', islandColor)
					.style('stop-opacity', 1);
			}

			// Update column dimensions and animate
			column
				.attr('x', -columnWidth / 2)
				.attr('width', columnWidth)
				.style('opacity', 1)
				.transition()
				.duration(800)
				.ease(d3.easeBackOut.overshoot(1.1))
				.attr('height', columnHeight)
				.attr('y', -columnHeight);

			// Create invisible hover area for better interaction
			let hoverArea = columnGroup.select('.column-hover-area');
			if (hoverArea.empty()) {
				hoverArea = columnGroup
					.append('rect')
					.attr('class', 'column-hover-area')
					.style('fill', 'transparent')
					.style('cursor', 'pointer');
			}

			// Update hover area to cover the column
			hoverArea
				.attr('x', -Math.max(columnWidth / 2 + 2, 8))
				.attr('y', -columnHeight - 5)
				.attr('width', Math.max(columnWidth + 4, 16))
				.attr('height', columnHeight + 10);

			// Add mobile-responsive hover handlers
			hoverArea
				.on('mouseenter touchstart', function (event) {
					event.preventDefault();

					// Highlight the column
					column.style('stroke-width', 2).style('filter', 'brightness(1.1)');

					// Create responsive tooltip
					createMobileResponsiveTooltip(island, data, event);
				})
				.on('mouseleave', function () {
					// Only remove highlight and tooltip on desktop
					if (window.innerWidth >= 768) {
						column.style('stroke-width', 1).style('filter', 'none');
						d3.select('.column-tooltip').transition().duration(200).style('opacity', 0).remove();
					}
				})
				.on('mousemove', function (event) {
					// Update desktop tooltip position
					if (window.innerWidth >= 768) {
						d3.select('.column-tooltip')
							.style('left', event.pageX + 15 + 'px')
							.style('top', event.pageY - 10 + 'px');
					}
				});

			// Shadow effect
			let shadow = columnGroup.select('.column-shadow');
			if (shadow.empty()) {
				shadow = columnGroup
					.append('ellipse')
					.attr('class', 'column-shadow')
					.attr('cx', 0)
					.attr('rx', columnWidth * 0.6)
					.attr('ry', 3)
					.style('fill', 'rgba(0,0,0,0.2)')
					.style('opacity', 0);
			}

			shadow
				.attr('rx', columnWidth * 0.6)
				.transition()
				.duration(800)
				.attr('cy', 8)
				.style('opacity', 0.3);

			// Enhanced glow for high performers
			columnGroup.select('.column-glow').remove(); // Remove old glow
			if (data.rate > 70) {
				const glow = columnGroup
					.append('rect')
					.attr('class', 'column-glow')
					.attr('x', -columnWidth / 2 - 2)
					.attr('y', -columnHeight - 2)
					.attr('width', columnWidth + 4)
					.attr('height', columnHeight + 4)
					.attr('rx', 4)
					.style('fill', 'none')
					.style('stroke', optionsState.colorsIslands[island.name] || '#3b82f6')
					.style('stroke-width', 2)
					.style('opacity', 0)
					.style('filter', 'blur(3px)');

				function pulseGlow() {
					if (columnGroup.select('.column-glow').empty()) return;

					glow
						.transition()
						.duration(1500)
						.ease(d3.easeSinInOut)
						.style('opacity', 0.4)
						.transition()
						.duration(1500)
						.ease(d3.easeSinInOut)
						.style('opacity', 0.1)
						.on('end', pulseGlow);
				}

				setTimeout(pulseGlow, 800);
			}
		} else {
			// Hide columns when no data
			columnGroup
				.selectAll('.data-column')
				.transition()
				.duration(500)
				.attr('height', 0)
				.attr('y', 0);

			columnGroup.selectAll('.column-shadow').transition().duration(500).style('opacity', 0);

			columnGroup.selectAll('.column-glow').remove();
			columnGroup.selectAll('.column-hover-area').remove();
		}
	}

	function updateVisualization() {
		if (!d3Overlay || !islandsRendered) return;

		console.log('Updating visualization with', normalizedIslands.length, 'islands');

		d3Overlay.selectAll('.island-group').each(function (island) {
			const group = d3.select(this);
			const data = getYearData(island, selectedYear);
			const hasData = data && data.rate > 0;

			createAnimatedColumns(group, island, data, hasData);
		});
	}

	function updatePositions() {
		if (!d3Overlay || !leafletMap) return;

		d3Overlay.selectAll('.island-group').attr('transform', (d) => {
			const position = getLeafletPosition(d);
			const point = leafletMap.latLngToLayerPoint(position);

			if (!isFinite(point.x) || !isFinite(point.y)) {
				console.warn(`⚠️ Invalid point for ${d.name}:`, point);
				return `translate(0,0)`;
			}

			return `translate(${point.x},${point.y})`;
		});
	}

	async function initMap() {
		if (!browser || !mapContainer) return;

		try {
			isInitializing = true;
			leafletLib = await import('leaflet');

			// Fix marker icons
			delete leafletLib.Icon.Default.prototype._getIconUrl;
			leafletLib.Icon.Default.mergeOptions({
				iconRetinaUrl:
					'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
			});

			const pacificCenter = getPacificCenter();

			leafletMap = leafletLib.map(mapContainer, {
				center: pacificCenter,
				zoom: 3,
				minZoom: 1,
				maxZoom: 10,
				worldCopyJump: false,
				maxBounds: null,
				crs: leafletLib.CRS.EPSG3857,
				zoomControl: false // Disable default zoom controls
			});

			leafletLib
				.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					subdomains: 'abc',
					maxZoom: 18,
					noWrap: false
				})
				.addTo(leafletMap);

			leafletLib.control.zoom({ position: 'topright' }).addTo(leafletMap);

			leafletMap.whenReady(() => {
				setupD3();
				isInitializing = false;
			});
		} catch (error) {
			console.error('❌ Map initialization failed:', error);
			isInitializing = false;
		}
	}

	function setupD3() {
		const svgElement = d3
			.select(leafletMap.getPanes().overlayPane)
			.append('svg')
			.style('pointer-events', 'auto');

		const g = svgElement.append('g').attr('class', 'leaflet-zoom-hide');
		d3Overlay = g;

		function updateD3Overlay() {
			const bounds = leafletMap.getBounds();
			const topLeft = leafletMap.latLngToLayerPoint(bounds.getNorthWest());
			const bottomRight = leafletMap.latLngToLayerPoint(bounds.getSouthEast());

			svgElement
				.attr('width', bottomRight.x - topLeft.x)
				.attr('height', bottomRight.y - topLeft.y)
				.style('left', topLeft.x + 'px')
				.style('top', topLeft.y + 'px');

			g.attr('transform', `translate(${-topLeft.x},${-topLeft.y})`);

			// Always try to render islands if we have data and filters are ready
			if (!islandsRendered && filtersReady && normalizedIslands.length > 0) {
				console.log('Calling renderIslands from updateD3Overlay');
				renderIslands();
			} else if (islandsRendered) {
				updatePositions();
			}
		}

		leafletMap.on('viewreset zoom zoomend moveend', updateD3Overlay);
		updateD3Overlay();
	}

	function renderIslands() {
		if (!d3Overlay || normalizedIslands.length === 0) {
			console.log('Cannot render islands: no overlay or no data');
			return;
		}

		console.log('Rendering', normalizedIslands.length, 'islands');

		// Create island groups
		const islandGroups = d3Overlay
			.selectAll('.island-group')
			.data(normalizedIslands)
			.enter()
			.append('g')
			.attr('class', 'island-group')
			.attr('transform', (d) => {
				const position = getLeafletPosition(d);
				const point = leafletMap.latLngToLayerPoint(position);

				if (!isFinite(point.x) || !isFinite(point.y)) {
					return `translate(0,0)`;
				}

				return `translate(${point.x},${point.y})`;
			});

		// Add elements to each group
		islandGroups.each(function (island) {
			const group = d3.select(this);
			const data = getYearData(island, selectedYear);
			const hasData = data && data.rate > 0;
			const radius = hasData ? Math.max(8, Math.sqrt(data.rate) * 0.6) : 6;

			// Main circle - use optionsState colors
			group
				.append('circle')
				.attr('class', 'main-circle')
				.attr('r', radius)
				.style('fill', hasData ? optionsState.colorsIslands[island.name] || '#3b82f6' : '#ccc')
				.style('stroke', 'white')
				.style('stroke-width', 2)
				.style('cursor', 'pointer');

			// Enhanced event handlers for island circle - mobile responsive
			group
				.on('mouseenter touchstart', function (event) {
					event.preventDefault();
					currentHover = island.name;
					const currentData = getYearData(island, selectedYear);

					// Highlight the column if it exists
					const columnGroup = group.select('.column-system');
					const column = columnGroup.select('.data-column');
					if (!column.empty()) {
						column.style('stroke-width', 2).style('filter', 'brightness(1.1)');
					}

					if (currentData && currentData.rate > 0) {
						// Create mobile-responsive tooltip
						createMobileResponsiveTooltip(island, currentData, event);
					}
				})
				.on('mouseleave', function () {
					// Only remove highlight and tooltip on desktop
					if (window.innerWidth >= 768) {
						currentHover = null;

						// Remove column highlight
						const columnGroup = group.select('.column-system');
						const column = columnGroup.select('.data-column');
						if (!column.empty()) {
							column.style('stroke-width', 1).style('filter', 'none');
						}

						// Remove desktop tooltip
						d3.select('.column-tooltip').transition().duration(200).style('opacity', 0).remove();
					}
				})
				.on('mousemove', function (event) {
					if (currentHover && window.innerWidth >= 768) {
						// Update desktop tooltip position
						d3.select('.column-tooltip')
							.style('left', event.pageX + 15 + 'px')
							.style('top', event.pageY - 10 + 'px');
					}
				});
		});

		islandsRendered = true;
		updateVisualization();
	}

	function cleanup() {
		if (leafletMap) {
			leafletMap.off();
			leafletMap.remove();
		}
		if (d3Overlay) {
			d3Overlay.selectAll('*').remove();
		}
		// Clean up all tooltips
		d3.select('body').selectAll('.map-tooltip').remove();
		d3.select('body').selectAll('.column-tooltip').remove();
		d3.select('body').selectAll('.mobile-column-tooltip').remove();

		// Remove any lingering event listeners
		d3.select(window).on('keydown.mobile-tooltip', null);

		// Restore body scroll if it was disabled
		document.body.style.overflow = '';
	}

	// Effects using Svelte 5 runes
	$effect(() => {
		if (filteredData) {
			console.log('Filtered data changed, length:', filteredData.length);
			console.log('Islands rendered:', islandsRendered);
			console.log('Filters ready:', filtersReady);

			// Only re-render if we have rendered islands before
			if (islandsRendered) {
				console.log('Re-rendering islands due to data change');
				stopAnimation();
				// Reset year to null so it gets set to first available year
				selectedYear = null;
				// Clear current islands and re-render with new data
				if (d3Overlay) {
					d3Overlay.selectAll('.island-group').remove();
					islandsRendered = false;
					// The map update cycle will handle re-rendering
				}
			}
		}
	});

	// Add a specific effect to trigger initial rendering when filters become ready
	$effect(() => {
		console.log('Filter readiness effect:', {
			filtersReady,
			islandsRendered,
			d3OverlayExists: !!d3Overlay,
			normalizedIslandsLength: normalizedIslands.length
		});

		if (filtersReady && !islandsRendered && d3Overlay && normalizedIslands.length > 0) {
			console.log('Triggering initial island rendering');
			renderIslands();
		}
	});

	$effect(() => {
		console.log('Visualization update check:', {
			islandsRendered,
			filtersReady,
			selectedYear,
			normalizedIslandsLength: normalizedIslands.length
		});

		if (islandsRendered && filtersReady && selectedYear !== null) {
			console.log('Updating visualization');
			updateVisualization();
		}
	});

	onMount(() => {
		if (browser) {
			initMap();
		}
	});

	onDestroy(() => {
		if (browser) {
			stopAnimation();
			cleanup();
		}
	});
</script>

<!-- Map -->
<div class="relative overflow-hidden rounded-xl border border-white/20 shadow-xl">
	<div class="aspect-square">
		<div class="pointer-events-none absolute z-10 h-full w-full">
			<!-- Time Controls - Mobile Responsive -->
			{#if !isInitializing && availableYears.length > 0 && filtersReady && selectedYear !== null}
				<!-- Mobile: Fullscreen overlay with centered modal -->
				<!-- Desktop: Positioned left corner with fixed width -->
				<div
					class="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm sm:absolute sm:inset-auto sm:right-auto sm:bottom-[2%] sm:left-[2%] sm:max-w-[300px] sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:max-w-sm xl:max-w-md"
					onclick={handleOutsideClick()}
					class:hidden={hiddenTime}
				>
					<!-- Modal container -->
					<div
						class="hover:shadow-3xl w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 sm:max-w-none sm:rounded-xl"
					>
						<!-- Main Container -->
						<div class="pointer-events-auto p-4 sm:p-5">
							<!-- Header Section -->
							<div class="mb-4 flex items-center justify-between sm:mb-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 sm:h-6 sm:w-6"
									>
										<svg
											class="h-4 w-4 text-blue-600 sm:h-3 sm:w-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<div>
										<span class="block text-xs font-medium text-slate-500 sm:text-xs"
											>Current Year</span
										>
										<span class="block text-xl font-bold text-blue-600 sm:text-lg">
											{selectedYear}
										</span>
									</div>
								</div>

								<!-- Year Counter (Hidden on mobile, shown on larger screens) -->
								<div class="hidden text-right sm:block">
									<span class="block text-xs text-slate-400">Timeline</span>
									<span class="block text-sm font-semibold text-slate-600">
										{availableYears.indexOf(parseInt(selectedYear)) + 1} / {availableYears.length}
									</span>
								</div>

								<!-- Close button (mobile only) -->
								<button
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
									onclick={() => (hiddenTime = true)}
									aria-label="Close time controls"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<!-- Progress Indicator (Mobile-friendly) -->
							<div class="mb-4 sm:mb-3">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-xs font-medium text-slate-600">Progress</span>
									<span class="text-xs text-slate-500">
										{Math.round(
											(availableYears.indexOf(parseInt(selectedYear)) /
												(availableYears.length - 1)) *
												100
										)}%
									</span>
								</div>
								<div class="h-2 w-full rounded-full bg-slate-200">
									<div
										class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
										style="width: {(availableYears.indexOf(parseInt(selectedYear)) /
											(availableYears.length - 1)) *
											100}%"
									></div>
								</div>
							</div>

							<!-- Range Slider -->
							<div class="mb-4 sm:mb-3">
								<div class="relative">
									<!-- Enhanced mobile-friendly slider -->
									<input
										type="range"
										min="0"
										max={availableYears.length - 1}
										value={availableYears.indexOf(parseInt(selectedYear))}
										oninput={(e) => {
											const index = parseInt(e.target.value);
											selectedYear = availableYears[index];
										}}
										class="range-slider h-3 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-blue-200 to-blue-300 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:h-2"
									/>

									<!-- Year range labels -->
									<div class="mt-2 flex justify-between text-xs font-medium text-slate-500">
										<span class="rounded bg-slate-100 px-2 py-1">
											{availableYears[0]}
										</span>
										<span class="rounded bg-slate-100 px-2 py-1">
											{availableYears[availableYears.length - 1]}
										</span>
									</div>
								</div>
							</div>

							<!-- Control Buttons -->
							<div class="space-y-3 sm:space-y-2">
								<!-- Primary Controls Row -->
								<div class="flex gap-2">
									<!-- Play/Pause Button (Larger on mobile) -->
									{#if !isPlaying}
										<button
											onclick={playAnimation}
											disabled={availableYears.length < 2}
											class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-3 sm:py-2"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M8 5v14l11-7z" />
											</svg>
											<span>Play Animation</span>
											<span class="hidden sm:inline">Play</span>
										</button>
									{:else}
										<button
											onclick={stopAnimation}
											class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none active:scale-95 sm:flex-none sm:px-3 sm:py-2"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
											</svg>
											<span>Stop Animation</span>
											<span class="hidden sm:inline">Stop</span>
										</button>
									{/if}

									<!-- Reset Button -->
									<button
										onclick={resetToFirstYear}
										title="Reset to first year"
										class="flex items-center justify-center rounded-xl bg-slate-600 px-4 py-3 text-white shadow-lg transition-all duration-200 hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none active:scale-95 sm:px-3 sm:py-2"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
										<span class="ml-2 text-sm font-medium sm:hidden">Reset</span>
									</button>
								</div>

								<!-- Secondary Controls Row (Mobile) -->
								<div class="flex items-center justify-between rounded-lg bg-slate-50 p-3 sm:hidden">
									<div class="flex items-center gap-2">
										<svg
											class="h-4 w-4 text-slate-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19V6l6 6-6 6z"
											/>
										</svg>
										<span class="text-sm font-medium text-slate-600">Timeline</span>
									</div>
									<div class="text-right">
										<div class="text-sm font-semibold text-slate-700">
											Year {availableYears.indexOf(parseInt(selectedYear)) + 1} of {availableYears.length}
										</div>
										<div class="text-xs text-slate-500">
											{availableYears.length} years available
										</div>
									</div>
								</div>

								<!-- Desktop Info Row -->
								<div class="hidden items-center justify-between text-xs text-slate-500 sm:flex">
									<span>{availableYears.length} years available</span>
									{#if isPlaying}
										<div class="flex items-center gap-1">
											<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
											<span>Playing...</span>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Mobile-only bottom indicator when playing -->
						{#if isPlaying}
							<div class="border-t border-white/20 bg-green-50 p-3">
								<div class="flex items-center justify-center gap-2">
									<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
									<span class="text-sm font-medium text-green-700">Animation Playing</span>
									<span class="text-xs text-green-600">(1.5s per year)</span>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Show Time Controls Button (Mobile only) -->
				<button
					class="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
					class:hidden={!hiddenTime}
					onclick={() => (hiddenTime = false)}
					aria-label="Show time controls"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Time Controls</span>
				</button>
			{/if}

			<!-- Filters not ready warning -->
			{#if !filtersReady && !isInitializing}
				<div
					class="- absolute top-1/2 left-1/2 -translate-x-1/2 rounded-lg border border-amber-300 bg-amber-100/95 p-4 shadow-lg backdrop-blur-sm"
				>
					<div class="flex items-center gap-2">
						<span class="text-xl">⚠️</span>
						<div>
							<div class="font-bold text-amber-800">Select Filters First</div>
							<div class="text-xs text-amber-700">Choose Sex, Education & Skill options</div>
						</div>
					</div>
				</div>
			{/if}

			<Button
				class="pointer-events-auto absolute top-[2%] left-[2%]"
				onclick={() => (hidden = false)}>Show Options</Button
			>
		</div>

		<div bind:this={mapContainer} class="z-0 aspect-square"></div>
	</div>

	{#if isInitializing}
		<div class="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
			<div class="text-center">
				<div
					class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-slate-600">Loading Pacific view...</p>
			</div>
		</div>
	{:else if !isInitializing && normalizedIslands.length === 0 && filtersReady}
		<div class="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
			<div class="text-center">
				<span class="mb-4 block text-4xl">🏝️</span>
				<p class="text-slate-600">No data available for current filter selection</p>
				<p class="mt-2 text-sm text-slate-500">Try adjusting your filters to see data</p>
			</div>
		</div>
	{/if}
</div>

<Drawer class="flex h-full w-full items-center justify-center bg-transparent p-0" bind:hidden>
	<OptionsSelector
		{optionsState}
		onSkillToggle={handleSkillToggle}
		onEducationToggle={handleEducationToggle}
		onSexToggle={handleSexToggle}
		enableIslands={false}
		bind:hidden
	/>
</Drawer>

<style>
	@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
	/* Enhanced mobile-friendly range slider */
	.time-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: 28px;
		width: 28px;
		border-radius: 50%;
		background: #3b82f6;
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.time-slider::-webkit-slider-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}

	.time-slider::-webkit-slider-thumb:active {
		transform: scale(1.2);
		box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
	}

	.time-slider::-moz-range-thumb {
		height: 28px;
		width: 28px;
		border-radius: 50%;
		background: #3b82f6;
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border: none;
	}

	.time-slider::-moz-range-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}

	.time-slider::-moz-range-thumb:active {
		transform: scale(1.2);
		box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
	}

	/* Desktop slider adjustments */
	@media (min-width: 640px) {
		.time-slider::-webkit-slider-thumb {
			height: 20px;
			width: 20px;
		}

		.time-slider::-moz-range-thumb {
			height: 20px;
			width: 20px;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.time-slider {
			background: linear-gradient(to right, #1e40af, #1d4ed8);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.time-slider::-webkit-slider-thumb,
		.time-slider::-moz-range-thumb {
			transition: none;
		}

		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.time-slider::-webkit-slider-thumb {
			border: 4px solid black;
		}

		.time-slider::-moz-range-thumb {
			border: 4px solid black;
		}
	}

	/* Focus styles for accessibility */
	.time-slider:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
	}

	/* Touch-friendly hover states */
	@media (hover: hover) {
		button:hover {
			transform: translateY(-1px);
		}
	}

	:global(.leaflet-container) {
		font-family: 'Inter', system-ui, sans-serif;
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);
	}

	:global(.leaflet-control-zoom) {
		border: none !important;
		border-radius: 12px !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
		background: rgba(255, 255, 255, 0.95) !important;
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	:global(.leaflet-control-zoom a) {
		border: none !important;
		color: #475569 !important;
		font-weight: 600 !important;
		font-size: 16px !important;
		width: 36px !important;
		height: 36px !important;
		line-height: 36px !important;
		transition: all 0.2s ease !important;
		background: rgba(255, 255, 255, 0.9) !important;
	}

	:global(.leaflet-control-zoom a:hover) {
		background: rgba(59, 130, 246, 0.1) !important;
		color: #3b82f6 !important;
		transform: scale(1.05);
	}

	:global(.island-group) {
		transition: all 0.3s ease;
	}

	:global(.island-group:hover) {
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
	}

	/* Enhanced mobile-friendly range slider */
	.range-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: 24px;
		width: 24px;
		border-radius: 50%;
		background: #3b82f6;
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.range-slider::-webkit-slider-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.range-slider::-webkit-slider-thumb:active {
		transform: scale(1.2);
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
	}

	.range-slider::-moz-range-thumb {
		height: 24px;
		width: 24px;
		border-radius: 50%;
		background: #3b82f6;
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.range-slider::-moz-range-thumb:hover {
		background: #2563eb;
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.range-slider::-moz-range-thumb:active {
		transform: scale(1.2);
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
	}

	/* Mobile-specific touch targets */
	@media (max-width: 640px) {
		.range-slider::-webkit-slider-thumb {
			height: 28px;
			width: 28px;
		}

		.range-slider::-moz-range-thumb {
			height: 28px;
			width: 28px;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.range-slider {
			background: linear-gradient(to right, #1e40af, #1d4ed8);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.range-slider::-webkit-slider-thumb {
			border: 4px solid black;
		}

		.range-slider::-moz-range-thumb {
			border: 4px solid black;
		}
	}

	:global(::-webkit-scrollbar) {
		width: 6px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgba(248, 250, 252, 0.8);
		border-radius: 3px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: rgba(148, 163, 184, 0.6);
		border-radius: 3px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: rgba(148, 163, 184, 0.9);
	}

	:global(*:focus) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.grid-cols-1 {
			grid-template-columns: 1fr;
		}

		.lg\\:flex-row {
			flex-direction: column;
		}
	}
</style>
