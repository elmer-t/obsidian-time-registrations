import { App, Modal } from 'obsidian';
import { DailyTimeData, ValidationStatus } from '../types';
import { TimeValidator } from '../validator';
import { TimeDataManager } from '../dataManager';
import { DayViewModal } from './DayView';

export class MonthViewModal extends Modal {
	private monthData: DailyTimeData[] = [];

	constructor(
		app: App,
		private dataManager: TimeDataManager,
		private year: number,
		private month: number // 0-11
	) {
		super(app);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('red-times-month-view');

		// Show loading message
		contentEl.createEl('p', { text: 'Loading month data...' });

		// Load data
		this.monthData = await this.dataManager.getMonthData(this.year, this.month);

		// Re-render with data
		this.render();
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		const monthNames = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];

		// Header
		const header = contentEl.createEl('h2', {
			text: `${monthNames[this.month]} ${this.year}`
		});
		header.style.marginBottom = '1em';

		// Month summary
		const totalHours = this.monthData.reduce((sum, d) => sum + d.totalHours, 0);
		const expectedHours = this.monthData.reduce((sum, d) => sum + d.expectedHours, 0);
		const workingDays = this.monthData.filter(d => d.expectedHours > 0).length;
		const difference = expectedHours - totalHours;

		const summaryDiv = contentEl.createDiv({ cls: 'red-times-summary' });
		summaryDiv.style.marginBottom = '1.5em';
		summaryDiv.style.padding = '1em';
		summaryDiv.style.backgroundColor = 'var(--background-secondary)';
		summaryDiv.style.borderRadius = '4px';
		summaryDiv.innerHTML = `
			<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1em; text-align: center;">
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Total Hours</div>
					<div style="font-size: 1.5em; font-weight: bold;">${totalHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Expected Hours</div>
					<div style="font-size: 1.5em; font-weight: bold;">${expectedHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Working Days</div>
					<div style="font-size: 1.5em; font-weight: bold;">${workingDays}</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Difference</div>
					<div style="font-size: 1.5em; font-weight: bold; color: ${difference > 0 ? '#f44336' : '#4caf50'}">
						${difference > 0 ? '-' : '+'}${Math.abs(difference).toFixed(2)}h
					</div>
				</div>
			</div>
		`;

		// Calendar grid
		const calendarDiv = contentEl.createDiv({ cls: 'red-times-calendar' });
		calendarDiv.style.marginBottom = '1.5em';

		// Day headers
		const headerRow = calendarDiv.createDiv();
		headerRow.style.display = 'grid';
		headerRow.style.gridTemplateColumns = 'repeat(7, 1fr)';
		headerRow.style.gap = '0.25em';
		headerRow.style.marginBottom = '0.25em';

		const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		dayNames.forEach(name => {
			const dayHeader = headerRow.createDiv();
			dayHeader.textContent = name;
			dayHeader.style.textAlign = 'center';
			dayHeader.style.fontWeight = 'bold';
			dayHeader.style.padding = '0.5em';
			dayHeader.style.fontSize = '0.9em';
			dayHeader.style.color = 'var(--text-muted)';
		});

		// Calendar days
		const firstDay = new Date(this.year, this.month, 1);
		const lastDay = new Date(this.year, this.month + 1, 0);
		const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
		const daysInMonth = lastDay.getDate();

		const gridDiv = calendarDiv.createDiv();
		gridDiv.style.display = 'grid';
		gridDiv.style.gridTemplateColumns = 'repeat(7, 1fr)';
		gridDiv.style.gap = '0.25em';

		// Add empty cells for days before month starts
		for (let i = 0; i < startDayOfWeek; i++) {
			gridDiv.createDiv();
		}

		// Add days of month
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const dayData = this.monthData.find(d => d.date === dateStr);

			const dayCell = gridDiv.createDiv({ cls: 'red-times-day-cell' });
			dayCell.style.padding = '0.5em';
			dayCell.style.borderRadius = '4px';
			dayCell.style.minHeight = '80px';
			dayCell.style.cursor = dayData ? 'pointer' : 'default';
			dayCell.style.transition = 'transform 0.2s';

			// Status color
			const status = dayData?.validation.status || ValidationStatus.NO_DATA;
			const statusColor = TimeValidator.getStatusColor(status);
			dayCell.style.border = `2px solid ${statusColor}`;
			dayCell.style.backgroundColor = 'var(--background-secondary)';

			// Day number
			const dayNum = dayCell.createDiv();
			dayNum.textContent = String(day);
			dayNum.style.fontWeight = 'bold';
			dayNum.style.marginBottom = '0.25em';
			dayNum.style.fontSize = '0.9em';

			if (dayData) {
				// Status icon
				const statusDiv = dayCell.createDiv();
				statusDiv.style.fontSize = '1.5em';
				statusDiv.style.textAlign = 'center';
				statusDiv.style.marginBottom = '0.25em';
				statusDiv.textContent = TimeValidator.getStatusIcon(status);

				// Hours
				const hoursDiv = dayCell.createDiv();
				hoursDiv.style.textAlign = 'center';
				hoursDiv.style.fontSize = '0.9em';
				hoursDiv.style.fontWeight = 'bold';
				hoursDiv.innerHTML = `${dayData.totalHours.toFixed(1)}h`;

				// Expected hours indicator
				if (dayData.expectedHours > 0) {
					const expectedDiv = dayCell.createDiv();
					expectedDiv.style.textAlign = 'center';
					expectedDiv.style.fontSize = '0.7em';
					expectedDiv.style.color = 'var(--text-muted)';
					expectedDiv.textContent = `/ ${dayData.expectedHours}h`;
				}

				// Click to open day view
				dayCell.addEventListener('click', () => {
					new DayViewModal(this.app, dayData).open();
				});

				dayCell.addEventListener('mouseenter', () => {
					dayCell.style.transform = 'scale(1.05)';
					dayCell.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
					dayCell.style.zIndex = '10';
				});

				dayCell.addEventListener('mouseleave', () => {
					dayCell.style.transform = 'scale(1)';
					dayCell.style.boxShadow = 'none';
					dayCell.style.zIndex = '1';
				});
			} else if (this.isWorkingDay(new Date(this.year, this.month, day))) {
				// Working day with no data
				const noDataDiv = dayCell.createDiv();
				noDataDiv.style.textAlign = 'center';
				noDataDiv.style.color = 'var(--text-muted)';
				noDataDiv.style.fontSize = '0.8em';
				noDataDiv.style.marginTop = '0.5em';
				noDataDiv.textContent = 'No data';
			}
		}

		// Navigation buttons
		const navDiv = contentEl.createDiv({ cls: 'red-times-navigation' });
		navDiv.style.display = 'flex';
		navDiv.style.justifyContent = 'space-between';
		navDiv.style.marginBottom = '1em';

		const prevBtn = navDiv.createEl('button', { text: '← Previous Month' });
		prevBtn.addEventListener('click', () => {
			this.month--;
			if (this.month < 0) {
				this.month = 11;
				this.year--;
			}
			this.onOpen();
		});

		const todayBtn = navDiv.createEl('button', { text: 'This Month' });
		todayBtn.addEventListener('click', () => {
			const now = new Date();
			this.year = now.getFullYear();
			this.month = now.getMonth();
			this.onOpen();
		});

		const nextBtn = navDiv.createEl('button', { text: 'Next Month →' });
		nextBtn.addEventListener('click', () => {
			this.month++;
			if (this.month > 11) {
				this.month = 0;
				this.year++;
			}
			this.onOpen();
		});

		// Close button
		const footer = contentEl.createDiv({ cls: 'red-times-footer' });
		footer.style.marginTop = '1.5em';
		footer.style.textAlign = 'right';

		const closeBtn = footer.createEl('button', { text: 'Close' });
		closeBtn.addEventListener('click', () => this.close());
	}

	private isWorkingDay(date: Date): boolean {
		const dayOfWeek = date.getDay();
		return this.dataManager['settings'].workingDays.includes(dayOfWeek);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
