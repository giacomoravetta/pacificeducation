<script lang="ts">
	import { scaleLinear } from 'd3';
	import { area, curveLinear, line } from 'd3';
	import { extent, max, min, group } from 'd3';

	import { appState, appData as appData } from '../state.svelte.js';

	let selectedPoint = $state({});

	const skillData = $derived.by(() => {
		const filteredData = appData.skills.filter(
			(d) =>
				appState.selectedIslands.map((island) => island).includes(d.GEO_PICT) &&
				d.COMPOSITE_BREAKDOWN == 'SKILL_MIN_LTRCY' &&
				d.SEX == '_T' &&
				d.EDUCATION == '1_y6'
		);
		return filteredData;
	});

	const factorData = $derived.by(() => {
		const factorData = appData.factors.filter(
			(d) => appState.selectedIslands.map((island) => island).includes(d.GEO_PICT) && d.SEX == '_T'
		);
		return factorData;
	});

	const totalData = $derived(skillData.concat(factorData));

	let graphWidth = $state(0);

	const groupedData = $derived.by(() => {
		return Array.from(group(skillData, (d) => d.GEO_PICT));
	});

	const margin = { top: 40, right: 30, left: 30, bottom: 50 };
	let computedGraphWidth = $derived(graphWidth * 0.8 + margin.left + margin.right);
	const graphHeight = 400;

	let xScale = $derived(
		scaleLinear()
			.domain(extent(totalData, (d) => d['TIME_PERIOD']))
			.range([margin.left + margin.right, computedGraphWidth])
	);

	let yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	const generateLinePath = (islandData, yField) => {
		return line()
			.x((d) => xScale(d['TIME_PERIOD']))
			.y((d) => yScale(+d[yField]))
			.curve(curveLinear)(islandData);
	};

	// Fixed area generator
	const generateArea = $derived(
		area()
			.x((d) => xScale(d['TIME_PERIOD']))
			.y0(yScale(0))
			.y1((d) => yScale(d['OBS_VALUE']))
			.curve(curveLinear)
	);

	// Generate area path for a dataset
	const generateAreaPath = (data) => {
		return generateArea(data);
	};

	// Create a unique key that changes when selection changes to trigger re-animation
	const animationKey = $derived(`${appState.selectedIslands.length}-${Date.now()}`);

	// Svelte action to animate path drawing with correct path length
	function animatePath(node, delay = 0) {
		const pathLength = node.getTotalLength();

		// Set up the starting positions with actual path length
		node.style.strokeDasharray = pathLength.toString();
		node.style.strokeDashoffset = pathLength.toString();

		// Animate after delay
		const timeout = setTimeout(() => {
			node.style.transition = 'stroke-dashoffset 2s ease-in-out';
			node.style.strokeDashoffset = '0';
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}
</script>

<div class="flex w-[80%] flex-col items-center justify-center p-3" bind:clientWidth={graphWidth}>
	<div class="flex w-full items-center justify-between pr-8">
		<h2 class="font-gray-600 font-semibold">Correlation Data by Island</h2>
		<div class="text-sm text-gray-500">
			{appState.selectedIslands.length} island{appState.selectedIslands.length !== 1 ? 's' : ''} selected
		</div>
	</div>

	{#if selectedPoint.data}
		<div
			class="absolute flex flex-col rounded-xl p-3"
			style="background-color: {appState.colorsIslands[
				selectedPoint.data.GEO_PICT
			]}99; top: {selectedPoint.y + 10}px; left: {selectedPoint.x > window.innerWidth / 2
				? selectedPoint.x - 20
				: selectedPoint.x + 10}px;"
		>
			<span>{selectedPoint.data.GEO_PICT}</span>
			<span>{selectedPoint.data.OBS_VALUE}%</span>
		</div>
	{/if}

	<svg width={computedGraphWidth + margin.right} height={graphHeight}>
		<!-- X Axis -->
		<g transform="translate(0,{graphHeight - margin.bottom})">
			{#each xScale.ticks().slice(1) as tick}
				<line
					stroke="blue"
					opacity="0.2"
					stroke-dasharray="5"
					x1={xScale(tick)}
					x2={xScale(tick)}
					y2={-graphHeight + margin.top + margin.bottom}
					y1={0}
				/>
			{/each}
			{#each xScale.ticks(5) as tick}
				<text
					font-size="11px"
					fill="blue"
					text-anchor="middle"
					x={xScale(tick) + 10}
					y={20 + 2}
					transform="rotate(90, {xScale(tick)}, 20)"
				>
					{tick}
				</text>
			{/each}
		</g>

		<!-- Y Axis -->
		<g transform="translate({margin.left}, 0)">
			{#each yScale.ticks(5) as tick}
				<line
					stroke="blue"
					opacity="0.2"
					stroke-dasharray="5"
					x1={margin.left}
					x2={computedGraphWidth - margin.right}
					y1={yScale(tick)}
					y2={yScale(tick)}
				/>
				<!-- Text on top -->
				<text
					fill="blue"
					text-anchor="middle"
					font-size="11px"
					dominant-baseline="middle"
					x={-10}
					y={yScale(tick)}
					font-weight="600"
				>
					{tick}%
				</text>
			{/each}
		</g>

		{#each groupedData as [islandName, islandData], i}
			<g class="island-group" data-island={islandName}>
				<!-- Area path (rendered behind the line) -->
				<path
					class="area-path"
					d={generateAreaPath(factorData)}
					fill={appState.colorsIslands[islandName]}
					fill-opacity="0.3"
					stroke="none"
					style="--island-index: {i};"
				/>

				<!-- Line path with staggered animation -->
				<path
					class="line-path"
					d={generateLinePath(islandData, 'OBS_VALUE')}
					fill="none"
					stroke={appState.colorsIslands[islandName]}
					stroke-width="3"
					style="--island-index: {i};"
				/>

				<!-- Data points with staggered animations -->
				{#each islandData as dataPoint, pointIndex}
					<circle
						class="data-point"
						cx={xScale(dataPoint['TIME_PERIOD'])}
						cy={yScale(dataPoint['OBS_VALUE'])}
						r="4"
						fill={appState.colorsIslands[islandName]}
						stroke="white"
						stroke-width="2"
						style="--island-index: {i}; --point-index: {pointIndex};"
						onmouseenter={(e) => {
							selectedPoint = {
								x: e.clientX,
								y: e.clientY,
								data: dataPoint
							};
							console.log($state.snapshot(selectedPoint));
						}}
						onmouseout={() => {
							selectedPoint = {};
							console.log($state.snapshot(selectedPoint));
						}}
					/>
				{/each}
			</g>
		{/each}
	</svg>
</div>

<style>
	.island-group:hover .line-path {
		opacity: 1;
		stroke-width: 4px;
	}

	.island-group:hover .data-point {
		r: 6;
	}

	/* Fade other islands when one is hovered */
	.island-group:not(:hover) {
		opacity: 0.4;
	}

	svg:not(:hover) .island-group {
		opacity: 1;
	}

	.line-path {
		opacity: 0.9;
		/* Remove fixed stroke-dasharray - will be set by JavaScript */
		transition-property: opacity, stroke-width;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	@keyframes drawLine {
		from {
			stroke-dashoffset: 1000;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.data-point {
		opacity: 0;
		animation: fadeInPoint 0.3s ease-out forwards;
		animation-delay: calc(2s + var(--point-index, 0) * 0.1s + var(--island-index, 0) * 0.3s);
		transition-property: r, opacity;
		transition-duration: 200ms;
		transition-timing-function: ease-in-out;
	}

	@keyframes fadeInPoint {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
