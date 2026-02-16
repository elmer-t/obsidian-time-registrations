import { TFile } from 'obsidian';
import { TimeEntry, DailyFrontmatter } from './types';

export class TimeParser {
	/**
	 * Parse frontmatter from daily note content
	 */
	static parseFrontmatter(content: string): DailyFrontmatter {
		const frontmatter: DailyFrontmatter = {};

		// Extract frontmatter between --- markers
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (!frontmatterMatch) {
			return frontmatter;
		}

		const fmContent = frontmatterMatch[1];
		if (!fmContent) {
			return frontmatter;
		}

		// Parse individual fields
		const locationMatch = fmContent.match(/location:\s*(.+)/);
		if (locationMatch && locationMatch[1]) frontmatter.location = locationMatch[1].trim();

		const distanceMatch = fmContent.match(/distance:\s*(\d+)/);
		if (distanceMatch && distanceMatch[1]) frontmatter.distance = parseInt(distanceMatch[1]);

		const categoryMatch = fmContent.match(/category:\s*(.+)/);
		if (categoryMatch && categoryMatch[1]) frontmatter.category = categoryMatch[1].trim();

		const dayStartMatch = fmContent.match(/day-start:\s*(\d{2}:\d{2})/);
		if (dayStartMatch && dayStartMatch[1]) frontmatter.dayStart = dayStartMatch[1];

		const dayEndMatch = fmContent.match(/day-end:\s*(\d{2}:\d{2})/);
		if (dayEndMatch && dayEndMatch[1]) frontmatter.dayEnd = dayEndMatch[1];

		return frontmatter;
	}

	/**
	 * Parse time entries from daily note content
	 */
	static parseTimeEntries(content: string): TimeEntry[] {
		const entries: TimeEntry[] = [];
		const lines = content.split('\n');

		let currentEntry: Partial<TimeEntry> | null = null;
		let currentLineNumber = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line) continue;

			currentLineNumber = i + 1;

			// Match time entry header: ### HH:mm [[Project]] Description
			// or ### HH:mm Description
			const timeHeaderMatch = line.match(/^###\s+(\d{2}:\d{2})\s+(.+)/);

			if (timeHeaderMatch && timeHeaderMatch[1] && timeHeaderMatch[2]) {
				// Save previous entry if exists
				if (currentEntry && currentEntry.time) {
					entries.push(this.finalizeEntry(currentEntry));
				}

				// Start new entry
				const time = timeHeaderMatch[1];
				const rest = timeHeaderMatch[2];

				// Try to extract project link
				const projectMatch = rest.match(/\[\[([^\]]+)\]\]\s*(.*)/);

				currentEntry = {
					time,
					lineNumber: currentLineNumber,
					rawContent: line
				};

				if (projectMatch && projectMatch[1]) {
					currentEntry.project = projectMatch[1];
					currentEntry.description = (projectMatch[2] || '').trim();
				} else {
					currentEntry.description = rest.trim();
				}
			}
			// Check for client and hours in current entry context
			else if (currentEntry && line.trim()) {
				// Append to raw content
				currentEntry.rawContent += '\n' + line;

				// Extract client: [client::AJ]
				const clientMatch = line.match(/\[client::([^\]]+)\]/);
				if (clientMatch && clientMatch[1]) {
					currentEntry.client = clientMatch[1].trim();
				}

				// Extract hours: [hours::0.5]
				const hoursMatch = line.match(/\[hours::([\d.]+)\]/);
				if (hoursMatch && hoursMatch[1]) {
					currentEntry.hours = parseFloat(hoursMatch[1]);
				}
			}
		}

		// Don't forget the last entry
		if (currentEntry && currentEntry.time) {
			entries.push(this.finalizeEntry(currentEntry));
		}

		return entries;
	}

	/**
	 * Convert partial entry to complete TimeEntry
	 */
	private static finalizeEntry(partial: Partial<TimeEntry>): TimeEntry {
		return {
			time: partial.time || '00:00',
			project: partial.project,
			description: partial.description || '',
			client: partial.client,
			hours: partial.hours,
			lineNumber: partial.lineNumber || 0,
			rawContent: partial.rawContent || ''
		};
	}

	/**
	 * Calculate hours between two time strings (HH:mm format)
	 */
	static calculateHoursDifference(startTime: string, endTime: string): number {
		const startParts = startTime.split(':').map(Number);
		const endParts = endTime.split(':').map(Number);

		const startHour = startParts[0] || 0;
		const startMin = startParts[1] || 0;
		const endHour = endParts[0] || 0;
		const endMin = endParts[1] || 0;

		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;

		return (endMinutes - startMinutes) / 60;
	}

	/**
	 * Extract date from filename (assumes YYYY-MM-DD.md format)
	 */
	static extractDateFromFilename(file: TFile): string | null {
		const match = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
		return (match && match[1]) ? match[1] : null;
	}
}
