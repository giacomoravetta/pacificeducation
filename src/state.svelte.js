import { csv, autoType } from 'd3';

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
		const csvDataSkills = await csv(
			'https://raw.githubusercontent.com/giacomoravetta/pacificeducation/refs/heads/master/static/data/combined_data_islands_skills.csv',
			autoType
		);

		const updatedCsvDataSkills = csvDataSkills.map((d) => {
			d.GEO_PICT = islandsIndicators[d.GEO_PICT];
			return d;
		});
		return { skills: updatedCsvDataSkills };
	} catch (error) {
		console.error('Error loading CSV:', error);
		return { skills: [], factors: [] };
	}
};

const data = await loadData();

export const appData = $state(data);

export const appState = $state({
	selectedSexes: [],
	selectedEducation: [],
	selectedSkills: [],
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
	},
	coordinatesIslands: {
		'French Polynesia': { lat: -17.68, lng: -149.407 },
		Niue: { lat: -19.054, lng: -169.867 },
		'New Caledonia': { lat: -20.904, lng: 165.618 },
		Tonga: { lat: -21.179, lng: -175.198 },
		'Marshall Islands': { lat: 11.604, lng: 165.313 },
		Vanuatu: { lat: -15.377, lng: 166.959 },
		Nauru: { lat: -0.523, lng: 166.932 },
		Samoa: { lat: -13.759, lng: -172.105 },
		Fiji: { lat: -17.713, lng: 178.065 },
		'Papua New Guinea': { lat: -6.315, lng: 143.956 },
		Palau: { lat: 7.366, lng: 134.434 },
		Micronesia: { lat: 7.426, lng: 150.551 },
		Kiribati: { lat: 1.421, lng: 172.985 },
		'Solomon Islands': { lat: -9.646, lng: 160.156 },
		'Cook Islands': { lat: -21.237, lng: -159.778 },
		Tuvalu: { lat: -7.11, lng: 177.646 }
	}
});
