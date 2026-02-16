import {App, PluginSettingTab, Setting} from "obsidian";
import TimeRegistrations from "./main";

export interface TimeRegistrationsSettings {
	dailyNotesFolder: string;
	expectedHoursPerDay: number;
	workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
	dateFormat: string;
	strictValidation: boolean;
	warnOnExcessHours: boolean;
}

export const DEFAULT_SETTINGS: TimeRegistrationsSettings = {
	dailyNotesFolder: '',
	expectedHoursPerDay: 8,
	workingDays: [1, 2, 3, 4, 5], // Monday to Friday
	dateFormat: 'YYYY-MM-DD',
	strictValidation: false,
	warnOnExcessHours: false
}

export class TimeRegistrationsSettingTab extends PluginSettingTab {
	plugin: TimeRegistrations;

	constructor(app: App, plugin: TimeRegistrations) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Time Registrations Settings'});


		// Daily notes folder with search component
		new Setting(containerEl)
			.setName('Daily notes folder')
			.setDesc('Path to your daily notes folder (leave empty for vault root)')
			.addSearch(search => {
				search
					.setPlaceholder('Example: Daily Notes')
					.setValue(this.plugin.settings.dailyNotesFolder);

				search.onChange(async (value) => {
					this.plugin.settings.dailyNotesFolder = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Expected hours per day')
			.setDesc('Number of hours you expect to work per day')
			.addText(text => text
				.setPlaceholder('8')
				.setValue(String(this.plugin.settings.expectedHoursPerDay))
				.onChange(async (value) => {
					const num = parseFloat(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.expectedHoursPerDay = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Warn on excess hours')
			.setDesc('Show warnings when registered hours exceed expected hours')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.warnOnExcessHours)
				.onChange(async (value) => {
					this.plugin.settings.warnOnExcessHours = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Strict validation')
			.setDesc('Enable strict validation (warns about all gaps and inconsistencies)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.strictValidation)
				.onChange(async (value) => {
					this.plugin.settings.strictValidation = value;
					await this.plugin.saveSettings();
				}));

		// Working days with individual checkboxes
		const workingDaysSetting = new Setting(containerEl)
			.setName('Working days')
			.setDesc('Select which days of the week you normally work');

		workingDaysSetting.settingEl.addClass('red-times-working-days');

		const daysContainer = workingDaysSetting.controlEl.createDiv({cls: 'red-times-days-grid'});
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		dayNames.forEach((dayName, dayIndex) => {
			const dayCheckbox = daysContainer.createDiv({cls: 'red-times-day-checkbox'});

			const checkbox = dayCheckbox.createEl('input', {
				type: 'checkbox',
				attr: {
					id: `red-times-day-${dayIndex}`
				}
			});
			checkbox.checked = this.plugin.settings.workingDays.includes(dayIndex);

			dayCheckbox.createEl('label', {
				text: dayName,
				attr: {
					for: `red-times-day-${dayIndex}`
				}
			});

			checkbox.addEventListener('change', async () => {
				if (checkbox.checked) {
					// Add day if not already in array
					if (!this.plugin.settings.workingDays.includes(dayIndex)) {
						this.plugin.settings.workingDays.push(dayIndex);
						this.plugin.settings.workingDays.sort((a, b) => a - b);
					}
				} else {
					// Remove day from array
					this.plugin.settings.workingDays = this.plugin.settings.workingDays.filter(d => d !== dayIndex);
				}
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Date format used in your daily note filenames')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

				
				containerEl.createEl('p', {text: 'For help, visit the '}).appendChild(
					createEl('a', {
						text: 'GitHub page',
						attr: {
							href: 'https://github.com/elmer-t/obsidian-time-registrations',
							target: '_blank'
						}
					})
				);
			}
		}
