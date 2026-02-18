
export class Utils {

	/**
	 * Converts a decimal hours value to a human readable time string
	 * 7.5 becomes 7:30
	 * @param hours decimal time value
	 */
	static formatTime(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}:${m.toString().padStart(2, '0')}`;
	}
}