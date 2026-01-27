/**
 * DateFormatter - Date Formatting Utilities
 *
 * Provides consistent date formatting across the application.
 */

import { DATE_FORMAT_OPTIONS, LOCALE } from '../config/constants.js';

export class DateFormatter {
  constructor() {
    this.locale = LOCALE;
  }

  /**
   * Format event date with optional time and date range
   * @param {Object} event - Event object with date, dateEnd, time properties
   * @returns {string} Formatted date string
   */
  formatEventDate(event) {
    const startDate = new Date(event.date + 'T00:00:00');

    // Handle date range
    if (event.dateEnd) {
      const endDate = new Date(event.dateEnd + 'T00:00:00');
      return `${startDate.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.full)} - ${endDate.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.full)}`;
    }

    // Single date with optional time
    let dateStr = startDate.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.full);

    if (event.time && event.time.start) {
      dateStr += ` • ${event.time.start}`;
      if (event.time.end) {
        dateStr += ` - ${event.time.end}`;
      }
    }

    return dateStr;
  }

  /**
   * Format date to full string
   * @param {Date} date - Date object
   * @returns {string} Formatted date (e.g., "15 gennaio 2025")
   */
  formatFull(date) {
    return date.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.full);
  }

  /**
   * Format date to short string
   * @param {Date} date - Date object
   * @returns {string} Formatted date (e.g., "15 gen")
   */
  formatShort(date) {
    return date.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.short);
  }

  /**
   * Format date to month and year
   * @param {Date} date - Date object
   * @returns {string} Formatted date (e.g., "gennaio 2025")
   */
  formatMonthYear(date) {
    return date.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS.monthYear);
  }

  /**
   * Format date to YYYY-MM-DD (for calendar selection)
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  formatYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if two dates are the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} True if same day
   */
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Check if event is on a specific date
   * @param {Object} event - Event object
   * @param {Date} targetDate - Target date
   * @returns {boolean} True if event is on date
   */
  isEventOnDate(event, targetDate) {
    const eventStartDate = new Date(event.date + 'T00:00:00');

    // Single day event
    if (!event.dateEnd) {
      return this.isSameDay(eventStartDate, targetDate);
    }

    // Multi-day event - check if target is within range
    const eventEndDate = new Date(event.dateEnd + 'T00:00:00');
    const targetTime = targetDate.getTime();
    return targetTime >= eventStartDate.getTime() && targetTime <= eventEndDate.getTime();
  }

  /**
   * Check if event is today
   * @param {Object} event - Event object
   * @returns {boolean} True if event is today
   */
  isEventToday(event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.isEventOnDate(event, today);
  }

  /**
   * Check if event is in the past
   * @param {Object} event - Event object
   * @returns {boolean} True if event has passed
   */
  isEventPast(event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = event.dateEnd
      ? new Date(event.dateEnd + 'T00:00:00')
      : new Date(event.date + 'T00:00:00');

    return eventDate < today;
  }

  /**
   * Check if event is upcoming (future)
   * @param {Object} event - Event object
   * @returns {boolean} True if event is in the future
   */
  isEventUpcoming(event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(event.date + 'T00:00:00');
    return eventDate > today;
  }

  /**
   * Get days with events in a month
   * @param {Array} events - Array of events
   * @param {Date} monthDate - Date in the target month
   * @returns {Set} Set of day numbers with events
   */
  getDaysWithEvents(events, monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysWithEvents = new Set();

    events.forEach(event => {
      const eventStart = new Date(event.date + 'T00:00:00');

      // Single day event
      if (!event.dateEnd) {
        if (eventStart.getFullYear() === year && eventStart.getMonth() === month) {
          daysWithEvents.add(eventStart.getDate());
        }
        return;
      }

      // Multi-day event - mark all days in range
      const eventEnd = new Date(event.dateEnd + 'T00:00:00');
      const currentDate = new Date(eventStart);

      while (currentDate <= eventEnd) {
        if (currentDate.getFullYear() === year && currentDate.getMonth() === month) {
          daysWithEvents.add(currentDate.getDate());
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return daysWithEvents;
  }

  /**
   * Parse YYYY-MM-DD string to Date
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Date} Date object
   */
  parseYYYYMMDD(dateStr) {
    return new Date(dateStr + 'T00:00:00');
  }

  /**
   * Get today's date (midnight)
   * @returns {Date} Today's date
   */
  getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Get first day of month
   * @param {Date} date - Date in the target month
   * @returns {Date} First day of month
   */
  getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get last day of month
   * @param {Date} date - Date in the target month
   * @returns {Date} Last day of month
   */
  getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Get number of days in month
   * @param {Date} date - Date in the target month
   * @returns {number} Number of days
   */
  getDaysInMonth(date) {
    return this.getLastDayOfMonth(date).getDate();
  }
}

// Export singleton instance
export const dateFormatter = new DateFormatter();
