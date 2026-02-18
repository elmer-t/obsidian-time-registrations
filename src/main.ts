import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, TimeRegistrationsSettings as TimeRegistrationsSettings, TimeRegistrationsSettingTab } from './settings';
import { TimeDataManager } from './dataManager';
import { TimeParser } from './parser';
import { DayViewModal } from './views/DayView';
import { WeekViewModal } from './views/WeekView';
import { MonthViewModal } from './views/MonthView';
import { TimeValidator } from './validator';
import { Utils } from './utils';

export default class TimeRegistrations extends Plugin {
	settings: TimeRegistrationsSettings;
	dataManager: TimeDataManager;
	statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();

		// Initialize data manager
		this.dataManager = new TimeDataManager(this.app, this.settings);

		// Add ribbon icon to open week view
		this.addRibbonIcon('clock', 'Time registrations - week overview', () => {
			new WeekViewModal(this.app, this.dataManager, new Date()).open();
		});

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		void this.updateStatusBar();

		// Command: Show today's overview
		this.addCommand({
			id: 'show-today',
			name: 'Show today\'s time registration',
			callback: async () => {
				const today = this.formatDate(new Date());
				const data = await this.dataManager.getDailyData(today);

				if (data) {
					new DayViewModal(this.app, data).open();
				} else {
					new Notice('No time registration found for today');
				}
			}
		});

		// Command: Show current note's time registration
		this.addCommand({
			id: 'show-current-note',
			name: 'Show current note\'s time registration',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const date = TimeParser.extractDateFromFilename(activeFile);
					if (date) {
						if (!checking) {
							void this.dataManager.getDailyData(date).then(data => {
								if (data) {
									new DayViewModal(this.app, data).open();
								} else {
									new Notice('No time entries found in this note');
								}
							});
						}
						return true;
					}
				}
				return false;
			}
		});

		// Command: Show week overview
		this.addCommand({
			id: 'show-week',
			name: 'Show week overview',
			callback: () => {
				new WeekViewModal(this.app, this.dataManager, new Date()).open();
			}
		});

		// Command: Show month overview
		this.addCommand({
			id: 'show-month',
			name: 'Show month overview',
			callback: () => {
				const now = new Date();
				new MonthViewModal(this.app, this.dataManager, now.getFullYear(), now.getMonth()).open();
			}
		});

		// Command: Validate current note
		this.addCommand({
			id: 'validate-current',
			name: 'Validate current note',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const date = TimeParser.extractDateFromFilename(activeFile);
					if (date) {
						if (!checking) {
							void this.validateNote(date);
						}
						return true;
					}
				}
				return false;
			}
		});

		// Settings tab
		this.addSettingTab(new TimeRegistrationsSettingTab(this.app, this));

		// Update status bar periodically
		this.registerInterval(
			window.setInterval(() => { void this.updateStatusBar(); }, 60000) // Every minute
		);

		// Update status bar when file is opened
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				void this.updateStatusBar();
			})
		);
	}

	onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TimeRegistrationsSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Reinitialize data manager with new settings
		this.dataManager = new TimeDataManager(this.app, this.settings);
	}

	private async updateStatusBar() {
		let date: string | null = null;

		// If the active file is a time registration note, show its status instead of today's status
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			date = TimeParser.extractDateFromFilename(activeFile);
			if (!date) {
				date = this.formatDate(new Date());
			}
		}

		if (!date) {
			date = this.formatDate(new Date());
		}

		const data = await this.dataManager.getDailyData(date);

		if (data) {
			const status = data.validation.status;
			const icon = TimeValidator.getStatusIcon(status);
			const hours = Utils.formatTime(data.totalHours);

			this.statusBarItem.setText(`${icon} ${hours}`);
			this.statusBarItem.title = `Time registrations for ${date}: ${TimeValidator.getStatusText(status)}`;
		} else {
			this.statusBarItem.setText('⏱️ 0h');
			this.statusBarItem.title = `Time registrations for ${date}: No data`;
		}
	}

	private async validateNote(date: string) {
		const data = await this.dataManager.getDailyData(date);

		if (!data) {
			new Notice('No time entries found in this note');
			return;
		}

		const validation = data.validation;
		const status = TimeValidator.getStatusText(validation.status);
		const icon = TimeValidator.getStatusIcon(validation.status);

		let message = `${icon} ${status}\n\n`;
		message += `Total: ${Utils.formatTime(data.totalHours)} / ${Utils.formatTime(data.expectedHours)}\n`;

		if (validation.issues.length > 0) {
			message += `\nIssues (${validation.issues.length}):\n`;
			validation.issues.slice(0, 5).forEach(issue => {
				const issueIcon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
				message += `${issueIcon} ${issue.message}\n`;
			});
			if (validation.issues.length > 5) {
				message += `... and ${validation.issues.length - 5} more`;
			}
		}

		new Notice(message, 8000);
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
}
