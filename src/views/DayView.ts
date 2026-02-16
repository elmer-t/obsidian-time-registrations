import { App, Modal, Notice } from 'obsidian';
import { DailyTimeData } from '../types';
import { TimeValidator } from '../validator';

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
		contentEl.addClass('red-times-day-view');

		// Header with date
		const header = contentEl.createEl('h2', { text: `Time Registration - ${this.data.date}` });
		header.style.marginBottom = '1em';

		// Status indicator
		const statusDiv = contentEl.createDiv({ cls: 'red-times-status' });
		const status = this.data.validation.status;
		const statusColor = TimeValidator.getStatusColor(status);
		const statusIcon = TimeValidator.getStatusIcon(status);

		statusDiv.innerHTML = `
			<span style="color: ${statusColor}; font-size: 1.5em; margin-right: 0.5em;">${statusIcon}</span>
			<span style="font-weight: bold;">${TimeValidator.getStatusText(status)}</span>
		`;
		statusDiv.style.marginBottom = '1em';
		statusDiv.style.padding = '0.5em';
		statusDiv.style.backgroundColor = 'var(--background-secondary)';
		statusDiv.style.borderRadius = '4px';

		// Hours summary
		const summaryDiv = contentEl.createDiv({ cls: 'red-times-summary' });
		summaryDiv.style.marginBottom = '1.5em';
		summaryDiv.innerHTML = `
			<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1em;">
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Total Hours</div>
					<div style="font-size: 1.5em; font-weight: bold;">${this.data.totalHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Expected Hours</div>
					<div style="font-size: 1.5em; font-weight: bold;">${this.data.expectedHours.toFixed(2)}h</div>
				</div>
				<div>
					<div style="color: var(--text-muted); font-size: 0.9em;">Difference</div>
					<div style="font-size: 1.5em; font-weight: bold; color: ${this.data.validation.missingHours > 0 ? '#f44336' : '#4caf50'}">
						${this.data.validation.missingHours > 0 ? '-' : '+'}${Math.abs(this.data.validation.missingHours).toFixed(2)}h
					</div>
				</div>
			</div>
		`;

		// Frontmatter info
		if (this.data.frontmatter.dayStart || this.data.frontmatter.dayEnd) {
			const fmDiv = contentEl.createDiv({ cls: 'red-times-frontmatter' });
			fmDiv.style.marginBottom = '1.5em';
			fmDiv.style.padding = '0.5em';
			fmDiv.style.backgroundColor = 'var(--background-secondary)';
			fmDiv.style.borderRadius = '4px';

			let fmContent = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5em;">';

			if (this.data.frontmatter.dayStart && this.data.frontmatter.dayEnd) {
				fmContent += `<div><strong>Day:</strong> ${this.data.frontmatter.dayStart} - ${this.data.frontmatter.dayEnd}</div>`;
			}
			if (this.data.frontmatter.location) {
				fmContent += `<div><strong>Location:</strong> ${this.data.frontmatter.location}</div>`;
			}
			if (this.data.frontmatter.distance) {
				fmContent += `<div><strong>Distance:</strong> ${this.data.frontmatter.distance} km</div>`;
			}

			fmContent += '</div>';
			fmDiv.innerHTML = fmContent;
		}

		// Validation issues
		if (this.data.validation.issues.length > 0) {
			const issuesDiv = contentEl.createDiv({ cls: 'red-times-issues' });
			issuesDiv.style.marginBottom = '1.5em';

			const issuesHeader = issuesDiv.createEl('h3', { text: 'Issues' });
			issuesHeader.style.marginBottom = '0.5em';

			const issuesList = issuesDiv.createEl('ul');
			issuesList.style.listStyle = 'none';
			issuesList.style.padding = '0';

			this.data.validation.issues.forEach(issue => {
				const li = issuesList.createEl('li');
				li.style.padding = '0.5em';
				li.style.marginBottom = '0.25em';
				li.style.borderRadius = '4px';

				const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
				const bgColor = issue.type === 'error'
					? 'rgba(244, 67, 54, 0.1)'
					: issue.type === 'warning'
					? 'rgba(255, 152, 0, 0.1)'
					: 'rgba(33, 150, 243, 0.1)';

				li.style.backgroundColor = bgColor;
				li.innerHTML = `${icon} ${issue.message}`;
			});
		}

		// Time entries table
		const entriesDiv = contentEl.createDiv({ cls: 'red-times-entries' });
		const entriesHeader = entriesDiv.createEl('h3', { text: 'Time Entries' });
		entriesHeader.style.marginBottom = '0.5em';

		if (this.data.entries.length === 0) {
			entriesDiv.createEl('p', {
				text: 'No time entries found',
				cls: 'red-times-no-entries'
			});
		} else {
			const table = entriesDiv.createEl('table');
			table.style.width = '100%';
			table.style.borderCollapse = 'collapse';

			// Table header
			const thead = table.createEl('thead');
			const headerRow = thead.createEl('tr');
			['Time', 'Project', 'Description', 'Client', 'Hours'].forEach(header => {
				const th = headerRow.createEl('th');
				th.textContent = header;
				th.style.textAlign = 'left';
				th.style.padding = '0.5em';
				th.style.borderBottom = '2px solid var(--background-modifier-border)';
			});

			// Table body
			const tbody = table.createEl('tbody');
			this.data.entries.forEach(entry => {
				const row = tbody.createEl('tr');
				row.style.borderBottom = '1px solid var(--background-modifier-border)';

				// Time
				const timeCell = row.createEl('td');
				timeCell.textContent = entry.time;
				timeCell.style.padding = '0.5em';
				timeCell.style.fontWeight = 'bold';

				// Project
				const projectCell = row.createEl('td');
				projectCell.textContent = entry.project || '-';
				projectCell.style.padding = '0.5em';

				// Description
				const descCell = row.createEl('td');
				descCell.textContent = entry.description;
				descCell.style.padding = '0.5em';

				// Client
				const clientCell = row.createEl('td');
				clientCell.textContent = entry.client || '-';
				clientCell.style.padding = '0.5em';
				if (!entry.client) {
					clientCell.style.color = '#f44336';
				}

				// Hours
				const hoursCell = row.createEl('td');
				hoursCell.textContent = entry.hours !== undefined ? `${entry.hours}h` : '-';
				hoursCell.style.padding = '0.5em';
				hoursCell.style.fontWeight = 'bold';
				if (entry.hours === undefined) {
					hoursCell.style.color = '#f44336';
				}
			});
		}

		// Footer with actions
		const footer = contentEl.createDiv({ cls: 'red-times-footer' });
		footer.style.marginTop = '1.5em';
		footer.style.display = 'flex';
		footer.style.justifyContent = 'flex-end';
		footer.style.gap = '0.5em';

		const openNoteBtn = footer.createEl('button', { text: 'Open Note' });
		openNoteBtn.addEventListener('click', () => {
			const file = this.app.vault.getAbstractFileByPath(this.data.filePath);
			if (file) {
				this.app.workspace.openLinkText('', file.path, false);
				this.close();
			} else {
				new Notice('Could not open note');
			}
		});

		const closeBtn = footer.createEl('button', { text: 'Close' });
		closeBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
