import { TimeEntry, ValidationResult, ValidationStatus, ValidationIssue, DailyFrontmatter } from './types';
import { TimeParser } from './parser';

export class TimeValidator {
	/**
	 * Validate a day's time data
	 */
	static validate(
		entries: TimeEntry[],
		frontmatter: DailyFrontmatter,
		expectedHours: number,
		strictValidation: boolean
	): ValidationResult {
		const issues: ValidationIssue[] = [];

		// Calculate total hours from entries
		const totalHours = entries.reduce((sum, entry) => {
			return sum + (entry.hours || 0);
		}, 0);

		// Calculate expected hours from frontmatter if available
		let expectedFromFrontmatter = expectedHours;
		if (frontmatter.dayStart && frontmatter.dayEnd) {
			expectedFromFrontmatter = TimeParser.calculateHoursDifference(
				frontmatter.dayStart,
				frontmatter.dayEnd
			);
		}

		// No entries at all
		if (entries.length === 0) {
			return {
				status: ValidationStatus.NO_DATA,
				issues: [{
					type: 'info',
					message: 'No time entries found'
				}],
				totalHours: 0,
				expectedHours: expectedFromFrontmatter,
				missingHours: expectedFromFrontmatter
			};
		}

		// Check each entry for missing data
		entries.forEach(entry => {
			if (!entry.client) {
				issues.push({
					type: 'error',
					message: `Missing client for entry at ${entry.time}`,
					entry
				});
			}

			if (entry.hours === undefined || entry.hours === null) {
				issues.push({
					type: 'error',
					message: `Missing hours for entry at ${entry.time}`,
					entry
				});
			}

			if (strictValidation) {
				if (!entry.project) {
					issues.push({
						type: 'warning',
						message: `No project linked for entry at ${entry.time}`,
						entry
					});
				}

				if (!entry.description || entry.description.trim().length === 0) {
					issues.push({
						type: 'warning',
						message: `No description for entry at ${entry.time}`,
						entry
					});
				}
			}
		});

		// Check if hours are less than expected
		const missingHours = expectedFromFrontmatter - totalHours;
		const hoursIncomplete = missingHours > 0.1; // Only incomplete if MISSING hours (allow small rounding errors)

		if (hoursIncomplete) {
			// Missing hours - add info message
			issues.push({
				type: 'info',
				message: `Missing ${missingHours.toFixed(2)} hours (expected ${expectedFromFrontmatter}h, got ${totalHours}h)`
			});
		}
		// Note: Excess hours are never a problem and don't affect status

		// Check for missing frontmatter in strict mode
		if (strictValidation) {
			if (!frontmatter.dayStart || !frontmatter.dayEnd) {
				issues.push({
					type: 'warning',
					message: 'Missing day-start or day-end in frontmatter'
				});
			}
		}

		// Determine overall status
		let status = ValidationStatus.COMPLETE;
		const hasErrors = issues.some(i => i.type === 'error');
		const hasWarnings = issues.some(i => i.type === 'warning');

		if (hasErrors) {
			// Actual errors - missing client, missing hours on entries
			status = ValidationStatus.ERROR;
		} else if (hoursIncomplete) {
			// Hours don't match expected
			status = ValidationStatus.INCOMPLETE;
		} else if (hasWarnings) {
			// Minor issues in strict mode
			status = ValidationStatus.WARNING;
		}

		return {
			status,
			issues,
			totalHours,
			expectedHours: expectedFromFrontmatter,
			missingHours
		};
	}

	/**
	 * Get color for status display
	 */
	static getStatusColor(status: ValidationStatus): string {
		switch (status) {
			case ValidationStatus.COMPLETE:
				return '#4caf50'; // Green
			case ValidationStatus.INCOMPLETE:
				return '#2196f3'; // Blue
			case ValidationStatus.WARNING:
				return '#ff9800'; // Orange/Yellow
			case ValidationStatus.ERROR:
				return '#f44336'; // Red
			case ValidationStatus.NO_DATA:
				return '#9e9e9e'; // Gray
			default:
				return '#9e9e9e';
		}
	}

	/**
	 * Get icon for status display
	 */
	static getStatusIcon(status: ValidationStatus): string {
		switch (status) {
			case ValidationStatus.COMPLETE:
				return '✓';
			case ValidationStatus.INCOMPLETE:
				return '◐';
			case ValidationStatus.WARNING:
				return '⚠';
			case ValidationStatus.ERROR:
				return '✗';
			case ValidationStatus.NO_DATA:
				return '○';
			default:
				return '?';
		}
	}

	/**
	 * Get short status text
	 */
	static getStatusText(status: ValidationStatus): string {
		switch (status) {
			case ValidationStatus.COMPLETE:
				return 'Complete';
			case ValidationStatus.INCOMPLETE:
				return 'Incomplete';
			case ValidationStatus.WARNING:
				return 'Warning';
			case ValidationStatus.ERROR:
				return 'Error';
			case ValidationStatus.NO_DATA:
				return 'No Data';
			default:
				return 'Unknown';
		}
	}
}
