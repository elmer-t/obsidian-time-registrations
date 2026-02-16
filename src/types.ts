export interface TimeEntry {
	time: string; // HH:mm format (e.g., "09:39")
	project?: string; // e.g., "$AJ ERP Project"
	description: string;
	client?: string;
	hours?: number;
	lineNumber: number; // For reference back to source
	rawContent: string; // Original markdown content
}

export interface DailyFrontmatter {
	location?: string;
	distance?: number;
	category?: string;
	dayStart?: string; // HH:mm format
	dayEnd?: string; // HH:mm format
}

export interface DailyTimeData {
	date: string; // YYYY-MM-DD format
	filePath: string;
	frontmatter: DailyFrontmatter;
	entries: TimeEntry[];
	totalHours: number;
	expectedHours: number;
	validation: ValidationResult;
}

export enum ValidationStatus {
	COMPLETE = 'complete', // All good
	WARNING = 'warning', // Partial data or minor issues
	ERROR = 'error', // Missing data or major issues
	NO_DATA = 'no-data' // No entries found
}

export interface ValidationIssue {
	type: 'error' | 'warning' | 'info';
	message: string;
	entry?: TimeEntry; // If issue is related to specific entry
}

export interface ValidationResult {
	status: ValidationStatus;
	issues: ValidationIssue[];
	totalHours: number;
	expectedHours: number;
	missingHours: number;
}

export interface WeekData {
	weekNumber: number;
	year: number;
	days: (DailyTimeData | null)[]; // Array of 7 days, null for missing days
	totalHours: number;
	expectedHours: number;
}

export interface MonthData {
	month: number; // 0-11
	year: number;
	days: Map<number, DailyTimeData>; // day number -> data
	totalHours: number;
	expectedHours: number;
}
