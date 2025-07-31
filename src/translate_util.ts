/**
 * Universal bidirectional translation utility
 * Automatically detects if input is a label or English text and translates accordingly
 */

// Original translation functions (from the first document)
const GENDER_MAP: Record<string, string> = {
	M: 'Male',
	F: 'Female',
	_T: 'Total'
};

const EDUCATION_MAP: Record<string, string> = {
	'1_g3': 'Primary Education (Grade 3)',
	'1_g5': 'Primary Education (Grade 5)',
	'1_g7': 'Primary Education (Grade 7)',
	'1_y4': 'Primary Education (Year 4)',
	'1_y6': 'Primary Education (Year 6)'
};

const SKILLS_MAP: Record<string, string> = {
	SKILL_MIN_LTRCY: 'Minimum Proficiency in Reading',
	SKILL_MIN_NMRCY: 'Minimum Proficiency in Mathematics',
	SKILL_LTRCY: 'Reading Skills',
	SKILL_NMRCY: 'Mathematics Skills',
	SKILL_SCI: 'Science Skills',
	SKILL_ICT: 'ICT Skills',
	SKILL_DIGITAL: 'Digital Skills'
};

/**
 * Convert gender indicator to human-readable text (for SEX field)
 */
function translateGender(indicator: string): string {
	if (!indicator) return indicator;
	const upperIndicator = indicator.toString().toUpperCase();
	return GENDER_MAP[upperIndicator] || indicator;
}

/**
 * Convert education level indicator to human-readable text (for EDUCATION field)
 */
function translateEducation(indicator: string): string {
	if (!indicator) return indicator;

	// Direct mapping first
	if (EDUCATION_MAP[indicator]) {
		return EDUCATION_MAP[indicator];
	}

	const upperIndicator = indicator.toString().toUpperCase();
	if (EDUCATION_MAP[upperIndicator]) {
		return EDUCATION_MAP[upperIndicator];
	}

	// Pattern matching for grade/year patterns
	if (indicator.match(/1_[gG]\d+/)) {
		const grade = indicator.match(/(\d+)$/)?.[1];
		if (grade) return `Primary Education (Grade ${grade})`;
	}

	if (indicator.match(/1_[yY]\d+/)) {
		const year = indicator.match(/(\d+)$/)?.[1];
		if (year) return `Primary Education (Year ${year})`;
	}

	return indicator;
}

/**
 * Convert skill indicator to human-readable text (for COMPOSITE_BREAKDOWN field)
 */
function translateSkill(indicator: string): string {
	if (!indicator) return indicator;

	// Direct mapping
	if (SKILLS_MAP[indicator]) {
		return SKILLS_MAP[indicator];
	}

	const upperIndicator = indicator.toString().toUpperCase();
	if (SKILLS_MAP[upperIndicator]) {
		return SKILLS_MAP[upperIndicator];
	}

	// Handle the specific patterns mentioned in your requirements
	if (upperIndicator.includes('SKILL_MIN_LTRCY')) {
		return 'Proportion achieving minimum proficiency in reading';
	}

	if (upperIndicator.includes('SKILL_MIN_NMRCY')) {
		return 'Proportion achieving minimum proficiency in mathematics';
	}

	// Generic SKILL_ pattern handling
	if (upperIndicator.startsWith('SKILL_')) {
		const skillPart = upperIndicator.replace('SKILL_', '');

		// Handle specific known patterns
		switch (skillPart) {
			case 'MIN_LTRCY':
				return 'Minimum Proficiency in Reading';
			case 'MIN_NMRCY':
				return 'Minimum Proficiency in Mathematics';

			default:
				// Format unknown skill types
				return (
					skillPart
						.toLowerCase()
						.split('_')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ') + ' Skills'
				);
		}
	}

	return indicator;
}

// Mapping dictionaries for reverse translation
const LABEL_TO_ENGLISH: Record<string, string> = {
	// Gender mappings
	M: 'Male',
	F: 'Female',
	_T: 'Total',

	// Education mappings
	'1_g3': 'Primary Education (Grade 3)',
	'1_g5': 'Primary Education (Grade 5)',
	'1_g7': 'Primary Education (Grade 7)',
	'1_y4': 'Primary Education (Year 4)',
	'1_y6': 'Primary Education (Year 6)',

	// Skills mappings
	SKILL_MIN_LTRCY: 'Minimum Proficiency in Reading',
	SKILL_MIN_NMRCY: 'Minimum Proficiency in Mathematics',
	SKILL_LTRCY: 'Reading Skills',
	SKILL_NMRCY: 'Mathematics Skills',
	SKILL_SCI: 'Science Skills',
	SKILL_ICT: 'ICT Skills',
	SKILL_DIGITAL: 'Digital Skills'
};

const ENGLISH_TO_LABEL: Record<string, string> = {
	// Gender mappings
	male: 'M',
	female: 'F',
	total: '_T',

	// Education mappings
	'primary education (grade 3)': '1_g3',
	'primary education (grade 5)': '1_g5',
	'primary education (grade 7)': '1_g7',
	'primary education (year 4)': '1_y4',
	'primary education (year 6)': '1_y6',

	// Skills mappings
	'minimum proficiency in reading': 'SKILL_MIN_LTRCY',
	'minimum proficiency in mathematics': 'SKILL_MIN_NMRCY',
	'reading skills': 'SKILL_LTRCY',
	'mathematics skills': 'SKILL_NMRCY',
	'science skills': 'SKILL_SCI',
	'ict skills': 'SKILL_ICT',
	'digital skills': 'SKILL_DIGITAL',
	'proportion achieving minimum proficiency in reading': 'SKILL_MIN_LTRCY',
	'proportion achieving minimum proficiency in mathematics': 'SKILL_MIN_NMRCY'
};

/**
 * Detects if the input string is a data label (code) or English text
 */
function isDataLabel(input: string): boolean {
	const upperInput = input.toUpperCase();

	// Check for known label patterns
	if (LABEL_TO_ENGLISH[input] || LABEL_TO_ENGLISH[upperInput]) {
		return true;
	}

	// Pattern matching for labels
	if (upperInput.match(/^[MF_T]+$/)) return true; // Gender codes
	if (upperInput.match(/^\d+(_[GY]\d+)?$/)) return true; // Education codes
	if (upperInput.startsWith('SKILL_')) return true; // Skill codes

	return false;
}

/**
 * Detects if the input string is English text
 */
function isEnglishText(input: string): boolean {
	const lowerInput = input.toLowerCase();

	// Check for known English phrases
	if (ENGLISH_TO_LABEL[lowerInput]) {
		return true;
	}

	// Pattern matching for English text
	if (['male', 'female', 'total'].includes(lowerInput)) return true;
	if (lowerInput.includes('primary education')) return true;
	if (lowerInput.includes('proficiency')) return true;
	if (lowerInput.includes('skills')) return true;
	if (lowerInput.includes('grade') || lowerInput.includes('year')) return true;
	if (lowerInput.includes('reading') || lowerInput.includes('mathematics')) return true;

	return false;
}

/**
 * Convert label to English using pattern matching
 */
function labelToEnglish(input: string): string {
	// Try direct mapping first
	if (LABEL_TO_ENGLISH[input]) {
		return LABEL_TO_ENGLISH[input];
	}

	const upperInput = input.toUpperCase();
	if (LABEL_TO_ENGLISH[upperInput]) {
		return LABEL_TO_ENGLISH[upperInput];
	}

	// Pattern matching for dynamic labels
	// Education patterns
	const gradeMatch = input.match(/^1_g(\d+)$/i);
	if (gradeMatch) {
		return `Primary Education (Grade ${gradeMatch[1]})`;
	}

	const yearMatch = input.match(/^1_y(\d+)$/i);
	if (yearMatch) {
		return `Primary Education (Year ${yearMatch[1]})`;
	}

	// Skill patterns
	if (upperInput.startsWith('SKILL_')) {
		const skillPart = upperInput.replace('SKILL_', '');

		switch (skillPart) {
			case 'MIN_LTRCY':
				return 'Minimum Proficiency in Reading';
			case 'MIN_NMRCY':
				return 'Minimum Proficiency in Mathematics';
			case 'LTRCY':
				return 'Reading Skills';
			case 'NMRCY':
				return 'Mathematics Skills';
			case 'SCI':
				return 'Science Skills';
			case 'ICT':
				return 'ICT Skills';
			case 'DIGITAL':
				return 'Digital Skills';
			default:
				// Format unknown skill types
				return (
					skillPart
						.toLowerCase()
						.split('_')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ') + ' Skills'
				);
		}
	}

	return input; // Return original if no pattern matches
}

/**
 * Convert English to label using pattern matching
 */
function englishToLabel(input: string): string {
	const lowerInput = input.toLowerCase();

	// Try direct mapping first
	if (ENGLISH_TO_LABEL[lowerInput]) {
		return ENGLISH_TO_LABEL[lowerInput];
	}

	// Pattern matching for dynamic English text
	// Education patterns
	const gradeMatch = input.match(/primary education \(grade (\d+)\)/i);
	if (gradeMatch) {
		return `1_g${gradeMatch[1]}`;
	}

	const yearMatch = input.match(/primary education \(year (\d+)\)/i);
	if (yearMatch) {
		return `1_y${yearMatch[1]}`;
	}

	// Skills patterns
	const skillsMatch = input.match(/^(.+)\s+skills$/i);
	if (skillsMatch) {
		const skillName = skillsMatch[1].toLowerCase();

		const skillMap: Record<string, string> = {
			reading: 'LTRCY',
			mathematics: 'NMRCY',
			math: 'NMRCY',
			science: 'SCI',
			ict: 'ICT',
			digital: 'DIGITAL'
		};

		if (skillMap[skillName]) {
			return `SKILL_${skillMap[skillName]}`;
		}

		// For unknown skills, convert to SKILL_UPPERCASE format
		const skillCode = skillName.toUpperCase().replace(/\s+/g, '_');
		return `SKILL_${skillCode}`;
	}

	return input; // Return original if no pattern matches
}

/**
 * Universal translation function that automatically detects direction and translates
 * @param input - The string to translate (either label or English)
 * @param fieldContext - Optional context to help with translation
 * @returns Translated string in the opposite format
 */
export function translate(
	input: string,
	fieldContext?: 'SEX' | 'EDUCATION' | 'COMPOSITE_BREAKDOWN' | 'GEO_PICT'
): string {
	if (!input) return input;

	// Geographic names don't need translation
	if (fieldContext === 'GEO_PICT') {
		return input;
	}

	// Determine translation direction
	if (isDataLabel(input)) {
		// Input is a label, translate to English
		return labelToEnglish(input);
	} else if (isEnglishText(input)) {
		// Input is English, translate to label
		return englishToLabel(input);
	}

	// If we can't determine the type, return original
	return input;
}

/**
 * Translate an array of mixed labels and English text
 */
export function translateArray(
	inputs: string[],
	fieldContext?: 'SEX' | 'EDUCATION' | 'COMPOSITE_BREAKDOWN' | 'GEO_PICT'
): string[] {
	return inputs.map((input) => translate(input, fieldContext));
}

/**
 * Convenience function to explicitly convert label to English
 */
export function labelToDisplay(label: string): string {
	return labelToEnglish(label);
}

/**
 * Convenience function to explicitly convert English to label
 */
export function displayToLabel(display: string): string {
	return englishToLabel(display);
}

// Export main functions
export default {
	translate,
	translateArray,
	labelToDisplay,
	displayToLabel
};
