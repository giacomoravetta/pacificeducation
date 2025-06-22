import { csv, autoType } from 'd3';

const dataPath = '/data/combined_data.csv';

const islandsIndicators = {
	PF: 'French Polynesia',
	NU: 'Niue',
	NC: 'New Caledonia',
	TO: 'Tonga',
	MH: 'Marshall Islands',
	VU: 'Vanuatu',
	NR: 'Nauru',
	WS: 'Samoa',
	FJ: 'Fiji',
	PG: 'Papua New Guinea',
	PW: 'Palau',
	FM: 'Micronesia',
	KI: 'Kiribati',
	SB: 'Solomon Islands',
	CK: 'Cook Islands',
	TV: 'Tuvalu'
};

const loadData = async () => {
	try {
		const csvData = await csv(dataPath, autoType);

		const updatedCsvData = csvData.map((d) => {
			d.GEO_PICT = islandsIndicators[d.GEO_PICT];
			return d;
		});
		return updatedCsvData;
	} catch (error) {
		console.error('Error loading CSV:', error);

		return [];
	}
};

export const dataState = $state(await loadData());
export const appState = $state({
	optionsIslands: [],
	selectedIslands: [],
	colorsIslands: {
		'French Polynesia': '#0891B2', // Deep Ocean Blue
		Niue: '#0D9488', // Teal
		'New Caledonia': '#059669', // Emerald
		Tonga: '#DC2626', // Coral Red
		'Marshall Islands': '#7C3AED', // Deep Purple
		Vanuatu: '#EA580C', // Sunset Orange
		Nauru: '#CA8A04', // Golden Sand
		Samoa: '#BE185D', // Tropical Pink
		Fiji: '#1D4ED8', // Royal Blue
		'Papua New Guinea': '#16A34A', // Forest Green
		Palau: '#0EA5E9', // Sky Blue
		Micronesia: '#8B5CF6', // Lavender
		Kiribati: '#F59E0B', // Amber
		'Solomon Islands': '#65A30D', // Lime Green
		'Cook Islands': '#EC4899', // Rose Pink
		Tuvalu: '#06B6D4' // Cyan
	}
});
