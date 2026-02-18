import { App, Modal, Notice } from 'obsidian';
import { DailyTimeData } from '../types';
import { TimeValidator } from '../validator';
import { Utils } from '../utils';

export class DayViewModal extends Modal {
	constructor(
		app: App,
		private data: DailyTimeData
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('time-registrations-day-view');

		// Header with date
		contentEl.createEl('h2', { text: `Time registration - ${this.data.date}` });

		// Status indicator
		const statusDiv = contentEl.createDiv({ cls: 'time-registrations-status' });
		const status = this.data.validation.status;
		const statusColor = TimeValidator.getStatusColor(status);
		const statusIcon = TimeValidator.getStatusIcon(status);

		const iconSpan = statusDiv.createSpan({ cls: 'time-registrations-status-icon', text: statusIcon });
		iconSpan.style.setProperty('--icon-color', statusColor);
		statusDiv.createSpan({ cls: 'time-registrations-status-text', text: TimeValidator.getStatusText(status) });

		// Hours summary
		const summaryDiv = contentEl.createDiv({ cls: 'time-registrations-summary' });
		const summaryGrid = summaryDiv.createDiv({ cls: 'time-registrations-summary-grid' });

		this.createSummaryItem(summaryGrid, 'Total hours', Utils.formatTime(this.data.totalHours));
		this.createSummaryItem(summaryGrid, 'Expected hours', Utils.formatTime(this.data.expectedHours));

		const diffText = `${this.data.validation.missingHours > 0 ? '-' : '+'}${Utils.formatTime(Math.abs(this.data.validation.missingHours))}`;
		const diffValue = this.createSummaryItem(summaryGrid, 'Difference', diffText);
		diffValue.addClass(this.data.validation.missingHours > 0 ? 'time-registrations-value-negative' : 'time-registrations-value-positive');

		// Frontmatter info
		if (this.data.frontmatter.dayStart || this.data.frontmatter.dayEnd) {
			const fmDiv = contentEl.createDiv({ cls: 'time-registrations-frontmatter' });
			const fmGrid = fmDiv.createDiv({ cls: 'time-registrations-frontmatter-grid' });

			if (this.data.frontmatter.dayStart && this.data.frontmatter.dayEnd) {
				const item = fmGrid.createDiv();
				item.createEl('strong', { text: 'Day: ' });
				item.appendText(`${this.data.frontmatter.dayStart} - ${this.data.frontmatter.dayEnd}`);
			}
			if (this.data.frontmatter.location) {
				const item = fmGrid.createDiv();
				item.createEl('strong', { text: 'Location: ' });
				item.appendText(this.data.frontmatter.location);
			}
			if (this.data.frontmatter.distance) {
				const item = fmGrid.createDiv();
				item.createEl('strong', { text: 'Distance: ' });
				item.appendText(`${this.data.frontmatter.distance} km`);
			}
		}

		// Validation issues
		if (this.data.validation.issues.length > 0) {
			const issuesDiv = contentEl.createDiv({ cls: 'time-registrations-issues' });
			issuesDiv.createEl('h3', { text: 'Issues' });

			const issuesList = issuesDiv.createEl('ul');

			this.data.validation.issues.forEach(issue => {
				const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
				const cls = issue.type === 'error'
					? 'time-registrations-issue-error'
					: issue.type === 'warning'
					? 'time-registrations-issue-warning'
					: 'time-registrations-issue-info';

				issuesList.createEl('li', { cls, text: `${icon} ${issue.message}` });
			});
		}

		// Time entries table
		const entriesDiv = contentEl.createDiv({ cls: 'time-registrations-entries' });
		entriesDiv.createEl('h3', { text: 'Time entries' });

		if (this.data.entries.length === 0) {
			entriesDiv.createEl('p', {
				text: 'No time entries found',
				cls: 'time-registrations-no-entries'
			});
		} else {
			const table = entriesDiv.createEl('table');

			// Table header
			const thead = table.createEl('thead');
			const headerRow = thead.createEl('tr');
			['Time', 'Project', 'Description', 'Client', 'Hours'].forEach(h => {
				headerRow.createEl('th', { text: h });
			});

			// Table body
			const tbody = table.createEl('tbody');
			this.data.entries.forEach(entry => {
				const row = tbody.createEl('tr');

				row.createEl('td', { text: entry.time, cls: 'time-registrations-cell-bold' });
				row.createEl('td', { text: entry.project || '-' });
				row.createEl('td', { text: entry.description });

				const clientCell = row.createEl('td', { text: entry.client || '-' });
				if (!entry.client) {
					clientCell.addClass('time-registrations-cell-missing');
				}

				const hoursCell = row.createEl('td', {
					text: entry.hours !== undefined ? Utils.formatTime(entry.hours) : '-',
					cls: 'time-registrations-cell-bold'
				});
				if (entry.hours === undefined) {
					hoursCell.addClass('time-registrations-cell-missing');
				}
			});
		}

		// Footer with actions
		const footer = contentEl.createDiv({ cls: 'time-registrations-footer' });

		const openNoteBtn = footer.createEl('button', { text: 'Open note' });
		openNoteBtn.addEventListener('click', () => {
			const file = this.app.vault.getAbstractFileByPath(this.data.filePath);
			if (file) {
				void this.app.workspace.openLinkText('', file.path, false);
				this.close();
			} else {
				new Notice('Could not open note');
			}
		});

		const closeBtn = footer.createEl('button', { text: 'Close' });
		closeBtn.addEventListener('click', () => this.close());
	}

	private createSummaryItem(container: HTMLElement, label: string, value: string): HTMLElement {
		const item = container.createDiv();
		item.createDiv({ cls: 'time-registrations-summary-label', text: label });
		return item.createDiv({ cls: 'time-registrations-summary-value', text: value });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
