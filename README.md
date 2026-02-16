# Time Registrations - A plugin for Obsidian

A simple time registration and tracking plugin for Obsidian that helps you manage your work hours directly in your daily notes.

## Features

### 📝 Smart Time Entry Parsing
- Automatically extracts time entries from your daily notes
- Parses entries in the format: `### HH:mm [[Project]] Description`
- Extracts client and hours metadata: `[client::ClientName]` and `[hours::X.X]`
- Reads frontmatter data: `day-start`, `day-end`, `location`, `distance`

### ✅ Intelligent Validation
- Checks if all entries have client and hours assigned
- Validates if total hours match expected hours (based on day-start and day-end)
- Identifies missing or incomplete entries
- Configurable strict validation mode for additional checks

### 📊 Multiple Overview Views
- **Day View**: Detailed view of a single day with all entries, validation status, and issues
- **Week View**: 7-day grid showing status for each day with color coding
- **Month View**: Full calendar view with daily summaries
- **Status Bar**: Live indicator showing today's registration status
- **Non-working Days**: Automatically dimmed based on your working days settings

### 🎨 Color-Coded Status System
- 🟢 **Green (Complete)**: All hours registered correctly, all entries valid
- 🔵 **Blue (Incomplete)**: Hours don't match expected (missing or excess hours)
- 🟡 **Yellow (Warning)**: Minor issues (missing project links, descriptions in strict mode)
- 🔴 **Red (Error)**: Actual errors (missing client, missing hours on entries)
- ⚪ **Gray (No Data)**: No entries found

## Usage

### Daily Note Format

Your daily notes should follow this structure:

```markdown
---
location: New York
distance: 130
category: journal
day-start: 08:39
day-end: 17:19
---

### 09:39 Log entry title
- Did some work
	- And some more...
- [client::Client A] - [hours::0.5]

### 10:15 Another log entry
- More work, this is rediculous
- [client::Client B] - [hours::2.0]
```

### Commands

The plugin adds the following commands to the command palette:

- **Show today's time registration**: Opens day view for today
- **Show current note's time registration**: Opens day view for the currently open daily note
- **Show week overview**: Opens week view for the current week
- **Show month overview**: Opens month view for the current month
- **Validate current note**: Shows validation results for the current note

### Ribbon Icon

Click the clock icon (⏱️) in the left ribbon to quickly open the week overview.

### Status Bar

The status bar at the bottom shows your current day's registration status:
- Example: `✓ 8.0h / 8h` (complete)
- Example: `⚠ 6.5h / 8h` (warning - missing hours)
- Example: `✗ 0h / 8h` (error - no data)

## Settings

Configure the plugin in Settings → Time Registrations:

### Daily Notes Folder
Path to your daily notes folder (leave empty for vault root).
- Example: `Daily Notes`

### Expected Hours Per Day
Number of hours you expect to work per day.
- Default: `8`
- This can be overridden by `day-start` and `day-end` in frontmatter

### Working Days
Select which days of the week you normally work using individual checkboxes.
- Default: Monday to Friday checked
- Check or uncheck any combination of days to match your work schedule

### Date Format
Date format used in your daily note filenames.
- Default: `YYYY-MM-DD`
- Example filename: `2024-02-16.md`

### Strict Validation
Enable strict validation to get warnings about:
- Missing project links
- Empty descriptions
- Missing frontmatter fields

**Note**: Excess hours (working more than expected) are never treated as a problem or warning.

## Installation

### Manual Installation
1. Copy `main.js`, `styles.css`, and `manifest.json` to your vault:
   ```
   VaultFolder/.obsidian/plugins/red-times/
   ```
2. Reload Obsidian
3. Enable "Time Registrations" in Settings → Community Plugins

### Development Installation
1. Clone this repo into your vault's plugins folder
2. Run `npm install`
3. Run `npm run dev` for development or `npm run build` for production
4. Reload Obsidian
5. Enable the plugin in settings

## Tips & Best Practices

### 1. Consistent Format
Always use the same format for time entries:
```markdown
### HH:mm [[Project]] Description
- Your notes
- [client::ClientName] - [hours::X.X]
```

### 2. Use Frontmatter
Add frontmatter to track work hours and location:
```yaml
---
day-start: 09:00
day-end: 17:30
location: Office
distance: 0
---
```

### 3. Daily Review
Use the "Validate current note" command at the end of each day to ensure all entries are complete.

### 4. Weekly Overview
Start your week by checking the week overview to identify any missing registrations from the previous week.

### 5. Client Tracking
Use consistent client names in `[client::Name]` format for accurate reporting with Dataview queries.

## Integration with Dataview

You can still use Dataview to summarize your hours. Example query:

```dataview
TABLE
  sum(rows.hours) as "Total Hours"
FROM "Daily Notes"
WHERE file.day = date(today)
FLATTEN file.lists as L
WHERE L.client
GROUP BY L.client
```

## Troubleshooting

### Plugin not detecting entries
- Ensure time entries start with `###` (three hashes)
- Check that time format is `HH:mm` (e.g., `09:30`, not `9:30`)
- Verify client and hours use double colon format: `[client::Name]` and `[hours::1.5]`

### Wrong expected hours
- Check if `day-start` and `day-end` are set in frontmatter
- If frontmatter is missing, the plugin uses the "Expected hours per day" setting
- Verify the date is configured as a working day in settings

### Status bar not updating
- The status bar updates every minute and when switching files
- Try closing and reopening the daily note
- Check that the filename matches the date format (YYYY-MM-DD.md)

## Development

### Building
```bash
npm run build
```

### Development mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

## Roadmap

- [ ] Export functionality (CSV, Excel)
- [ ] Enhanced folder autocomplete with dropdown suggestions
- [ ] Holiday calendar integration
- [ ] Project-based reporting
- [ ] Time entry templates
- [ ] Quick-add time entry command

## Support

Found a bug or have a feature request? Please open an issue on the GitHub repository.

## License

0-BSD

## Author

REDHEADIT - [https://redheadit.nl](https://redheadit.nl)
