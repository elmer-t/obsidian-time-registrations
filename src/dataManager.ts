import { App, TFile, TFolder } from 'obsidian';
import { DailyTimeData } from './types';
import { TimeParser } from './parser';
import { TimeValidator } from './validator';
import { TimeRegistrationsSettings } from './settings';

export class TimeDataManager {
	constructor(
		private app: App,
		private settings: TimeRegistrationsSettings
	) {}

	/**
	 * Get daily time data for a specific date
	 */
	async getDailyData(date: string): Promise<DailyTimeData | null> {
		const file = await this.findDailyNoteFile(date);
		if (!file) return null;

		return await this.processDailyNote(file, date);
	}

	/**
	 * Get daily time data for a date range
	 */
	async getDataForRange(startDate: string, endDate: string): Promise<DailyTimeData[]> {
		const files = await this.getDailyNoteFiles();
		const data: DailyTimeData[] = [];

		for (const file of files) {
			const fileDate = TimeParser.extractDateFromFilename(file);
			if (!fileDate) continue;

			if (fileDate >= startDate && fileDate <= endDate) {
				const dailyData = await this.processDailyNote(file, fileDate);
				if (dailyData) {
					data.push(dailyData);
				}
			}
		}

		return data.sort((a, b) => a.date.localeCompare(b.date));
	}

	/**
	 * Get all daily note files from configured folder
	 */
	private async getDailyNoteFiles(): Promise<TFile[]> {
		const folder = this.settings.dailyNotesFolder;
		let folderObj: TFolder | null = null;

		if (folder) {
			folderObj = this.app.vault.getAbstractFileByPath(folder) as TFolder;
			if (!folderObj) {
				console.warn(`Folder not found: ${folder}`);
				return [];
			}
		}

		const files = folderObj
			? folderObj.children.filter(f => f instanceof TFile && f.extension === 'md') as TFile[]
			: this.app.vault.getMarkdownFiles();

		// Filter files that match the date pattern
		return files.filter(file => {
			return TimeParser.extractDateFromFilename(file) !== null;
		});
	}

	/**
	 * Find daily note file for a specific date
	 */
	private async findDailyNoteFile(date: string): Promise<TFile | null> {
		const folder = this.settings.dailyNotesFolder;
		const filename = `${date}.md`;
		const path = folder ? `${folder}/${filename}` : filename;

		const file = this.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile ? file : null;
	}

	/**
	 * Process a daily note file and extract time data
	 */
	private async processDailyNote(file: TFile, date: string): Promise<DailyTimeData> {
		const content = await this.app.vault.read(file);

		const frontmatter = TimeParser.parseFrontmatter(content);
		const entries = TimeParser.parseTimeEntries(content);

		const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

		// Determine expected hours for this date
		const expectedHours = this.getExpectedHoursForDate(date);

		const validation = TimeValidator.validate(
			entries,
			frontmatter,
			expectedHours,
			this.settings.strictValidation,
			this.settings.warnOnExcessHours
		);

		return {
			date,
			filePath: file.path,
			frontmatter,
			entries,
			totalHours,
			expectedHours,
			validation
		};
	}

	/**
	 * Get expected hours for a specific date based on working days
	 */
	private getExpectedHoursForDate(date: string): number {
		const dateObj = new Date(date);
		const dayOfWeek = dateObj.getDay();

		return this.settings.workingDays.includes(dayOfWeek)
			? this.settings.expectedHoursPerDay
			: 0;
	}

	/**
	 * Get week data (7 days starting from Monday)
	 */
	async getWeekData(startDate: string): Promise<DailyTimeData[]> {
		const dates: string[] = [];
		const start = new Date(startDate);

		for (let i = 0; i < 7; i++) {
			const date = new Date(start);
			date.setDate(start.getDate() + i);
			dates.push(this.formatDate(date));
		}

		const data: DailyTimeData[] = [];
		for (const date of dates) {
			const dailyData = await this.getDailyData(date);
			if (dailyData) {
				data.push(dailyData);
			}
		}

		return data;
	}

	/**
	 * Get month data
	 */
	async getMonthData(year: number, month: number): Promise<DailyTimeData[]> {
		const startDate = new Date(year, month, 1);
		const endDate = new Date(year, month + 1, 0); // Last day of month

		return await this.getDataForRange(
			this.formatDate(startDate),
			this.formatDate(endDate)
		);
	}

	/**
	 * Format date as YYYY-MM-DD
	 */
	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * Get the Monday of the week containing the given date
	 */
	static getMondayOfWeek(date: Date): Date {
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
		return new Date(date.setDate(diff));
	}
}
