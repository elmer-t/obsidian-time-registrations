import { App, Modal } from 'obsidian';
import { DailyTimeData, ValidationStatus } from '../types';
import { TimeValidator } from '../validator';
import { TimeDataManager } from '../dataManager';
import { DayViewModal } from './DayView';

export class WeekViewModal extends Modal {
	private weekData: DailyTimeData[] = [];

	constructor(
		app: App,
		private dataManager: TimeDataManager,
		private startDate: Date
	) {
		super(app);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('time-registrations-week-view');

		// Show loading message
		contentEl.createEl('p', { text: 'Loading week data...' });

		// Load data
		const monday = TimeDataManager.getMondayOfWeek(new Date(this.startDate));
		const startDateStr = this.formatDate(monday);
		this.weekData = await this.dataManager.getWeekData(startDateStr);

		// Re-render with data
		this.render();
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		// Get week start and end
		const monday = TimeDataManager.getMondayOfWeek(new Date(this.startDate));
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);

		// Header
		const header = contentEl.createEl('h2', {
			text: `Week View - ${this.formatDate(monday)} to ${this.formatDate(sunday)}`
		});
		header.style.marginBottom = '1em';

		// Week summary
		const totalHours = this.weekData.reduce((sum, d) => sum + d.totalHours, 0);
		const expectedHours = this.weekData.reduce((sum, d) => sum + d.expectedHours, 0);
		const difference = expectedHours - totalHours;

		const summaryDiv = contentEl.createDiv({ cls: 'time-registrations-summary' });
		summaryDiv.style.marginBottom = '1.5em';
		summaryDiv.style.padding = '1em';
		summaryDiv.style.backgroundColor = 'var(--background-secondary)';
		summaryDiv.style.borderRadius = '4px';
		summaryDiv.innerHTML = `
			<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1em; text-align: center;">
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Total Hours</div>
					<div style="font-size: 1.8em; font-weight: bold;">${totalHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Expected Hours</div>
					<div style="font-size: 1.8em; font-weight: bold;">${expectedHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Difference</div>
					<div style="font-size: 1.8em; font-weight: bold; color: ${difference > 0 ? '#f44336' : '#4caf50'}">
						${difference > 0 ? '-' : '+'}${Math.abs(difference).toFixed(2)}h
					</div>
				</div>
			</div>
		`;

		// Week grid
		const gridDiv = contentEl.createDiv({ cls: 'time-registrations-week-grid' });
		gridDiv.style.display = 'grid';
		gridDiv.style.gridTemplateColumns = 'repeat(7, 1fr)';
		gridDiv.style.gap = '0.5em';
		gridDiv.style.marginBottom = '1.5em';

		const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

		for (let i = 0; i < 7; i++) {
			const date = new Date(monday);
			date.setDate(monday.getDate() + i);
			const dateStr = this.formatDate(date);
			const dayOfWeek = date.getDay();

			// Check if this is a working day
			const isWorkingDay = this.dataManager['settings'].workingDays.includes(dayOfWeek);

			// Find data for this day
			const dayData = this.weekData.find(d => d.date === dateStr);

			const dayCard = gridDiv.createDiv({ cls: 'time-registrations-day-card' });
			dayCard.style.padding = '1em';
			dayCard.style.borderRadius = '4px';
			dayCard.style.cursor = dayData ? 'pointer' : 'default';
			dayCard.style.transition = 'transform 0.2s';

			// Apply dimmed style for non-working days
			if (!isWorkingDay) {
				dayCard.style.opacity = '0.5';
				dayCard.style.filter = 'grayscale(0.3)';
			}

			// Status color
			const status = dayData?.validation.status || ValidationStatus.NO_DATA;
			const statusColor = TimeValidator.getStatusColor(status);
			dayCard.style.border = `2px solid ${statusColor}`;
			dayCard.style.backgroundColor = 'var(--background-secondary)';

			// Day name
			const dayName = dayCard.createDiv();
			dayName.textContent = dayNames[i] || '';
			dayName.style.fontWeight = 'bold';
			dayName.style.marginBottom = '0.5em';
			dayName.style.fontSize = '0.9em';

			// Date
			const dateDiv = dayCard.createDiv();
			dateDiv.textContent = dateStr;
			dateDiv.style.color = 'var(--text-muted)';
			dateDiv.style.fontSize = '0.8em';
			dateDiv.style.marginBottom = '0.5em';

			if (dayData) {
				// Status icon
				const statusDiv = dayCard.createDiv();
				statusDiv.style.fontSize = '2em';
				statusDiv.style.textAlign = 'center';
				statusDiv.style.marginBottom = '0.5em';
				statusDiv.textContent = TimeValidator.getStatusIcon(status);

				// Hours
				const hoursDiv = dayCard.createDiv();
				hoursDiv.style.textAlign = 'center';
				hoursDiv.style.fontSize = '1.2em';
				hoursDiv.style.fontWeight = 'bold';
				hoursDiv.innerHTML = `${dayData.totalHours.toFixed(2)}h <span style="color: var(--text-muted); font-weight: normal; font-size: 0.8em;">/ ${dayData.expectedHours}h</span>`;

				// Click to open day view
				dayCard.addEventListener('click', () => {
					new DayViewModal(this.app, dayData).open();
				});

				dayCard.addEventListener('mouseenter', () => {
					dayCard.style.transform = 'translateY(-2px)';
					dayCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
				});

				dayCard.addEventListener('mouseleave', () => {
					dayCard.style.transform = 'translateY(0)';
					dayCard.style.boxShadow = 'none';
				});
			} else {
				// No data
				const noDataDiv = dayCard.createDiv();
				noDataDiv.style.textAlign = 'center';
				noDataDiv.style.color = 'var(--text-muted)';
				noDataDiv.style.fontSize = '0.9em';
				noDataDiv.style.marginTop = '1em';
				noDataDiv.textContent = 'No data';
			}
		}

		// Navigation buttons
		const navDiv = contentEl.createDiv({ cls: 'time-registrations-navigation' });
		navDiv.style.display = 'flex';
		navDiv.style.justifyContent = 'space-between';
		navDiv.style.marginBottom = '1em';

		const prevBtn = navDiv.createEl('button', { text: '← Previous Week' });
		prevBtn.addEventListener('click', () => {
			const newDate = new Date(this.startDate);
			newDate.setDate(newDate.getDate() - 7);
			this.startDate = newDate;
			this.onOpen();
		});

		const todayBtn = navDiv.createEl('button', { text: 'Today' });
		todayBtn.addEventListener('click', () => {
			this.startDate = new Date();
			this.onOpen();
		});

		const nextBtn = navDiv.createEl('button', { text: 'Next Week →' });
		nextBtn.addEventListener('click', () => {
			const newDate = new Date(this.startDate);
			newDate.setDate(newDate.getDate() + 7);
			this.startDate = newDate;
			this.onOpen();
		});

		// Close button
		const footer = contentEl.createDiv({ cls: 'time-registrations-footer' });
		footer.style.marginTop = '1.5em';
		footer.style.textAlign = 'right';

		const closeBtn = footer.createEl('button', { text: 'Close' });
		closeBtn.addEventListener('click', () => this.close());
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
