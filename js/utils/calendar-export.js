/**
 * CalendarExport - Export Events to External Calendars
 *
 * Provides functionality to export events to Google Calendar, iCal, etc.
 */

export class CalendarExport {
  constructor() {
    this.baseGoogleCalendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  }

  /**
   * Export event to Google Calendar
   * @param {Object} event - Event object
   * @returns {string} Google Calendar URL
   */
  toGoogleCalendar(event) {
    const startDate = event.date.replace(/-/g, '');
    const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;

    let dates;
    if (event.time && event.time.start) {
      const startTime = event.time.start.replace(':', '');
      const endTime = event.time.end ? event.time.end.replace(':', '') : startTime;
      const actualEndDate = event.dateEnd || event.date;
      dates = `${startDate}T${startTime}00/${actualEndDate.replace(/-/g, '')}T${endTime}00`;
    } else {
      // All-day event
      dates = `${startDate}/${endDate}`;
    }

    const params = new URLSearchParams({
      text: event.title,
      dates: dates,
      location: event.location,
      details: event.description || `Tags: ${event.tags ? event.tags.join(', ') : ''}`,
      ctz: 'Europe/Rome'
    });

    const url = `${this.baseGoogleCalendarUrl}&${params.toString()}`;
    return url;
  }

  /**
   * Open Google Calendar export in new window
   * @param {Object} event - Event object
   */
  openGoogleCalendar(event) {
    const url = this.toGoogleCalendar(event);
    window.open(url, '_blank');
    console.log('📅 Exporting to Google Calendar:', event.title);
  }

  /**
   * Generate iCal/ICS file content
   * @param {Object} event - Event object
   * @returns {string} ICS file content
   */
  toICS(event) {
    const startDate = event.date.replace(/-/g, '');
    const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;

    let dtstart, dtend;
    if (event.time && event.time.start) {
      const startTime = event.time.start.replace(':', '');
      const endTime = event.time.end ? event.time.end.replace(':', '') : startTime;
      dtstart = `${startDate}T${startTime}00`;
      dtend = `${endDate}T${endTime}00`;
    } else {
      // All-day event
      dtstart = startDate;
      dtend = this._getNextDay(endDate);
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Espedienti//Eventi Napoli//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id || Math.random().toString(36)}@espedienti.org`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${this._escapeICS(event.title)}`,
      `LOCATION:${this._escapeICS(event.location)}`,
      `DESCRIPTION:${this._escapeICS(event.description || '')}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Download event as ICS file
   * @param {Object} event - Event object
   */
  downloadICS(event) {
    const icsContent = this.toICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log('📥 Downloaded ICS file:', event.title);
  }

  /**
   * Export multiple events to ICS
   * @param {Array} events - Array of events
   * @returns {string} ICS file content
   */
  toICSMultiple(events) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const eventBlocks = events.map(event => {
      const startDate = event.date.replace(/-/g, '');
      const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;

      let dtstart, dtend;
      if (event.time && event.time.start) {
        const startTime = event.time.start.replace(':', '');
        const endTime = event.time.end ? event.time.end.replace(':', '') : startTime;
        dtstart = `${startDate}T${startTime}00`;
        dtend = `${endDate}T${endTime}00`;
      } else {
        dtstart = startDate;
        dtend = this._getNextDay(endDate);
      }

      return [
        'BEGIN:VEVENT',
        `UID:${event.id || Math.random().toString(36)}@espedienti.org`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${this._escapeICS(event.title)}`,
        `LOCATION:${this._escapeICS(event.location)}`,
        `DESCRIPTION:${this._escapeICS(event.description || '')}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT'
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Espedienti//Eventi Napoli//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...eventBlocks,
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Download multiple events as single ICS file
   * @param {Array} events - Array of events
   * @param {string} filename - Optional filename
   */
  downloadICSMultiple(events, filename = 'eventi_napoli.ics') {
    const icsContent = this.toICSMultiple(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log('📥 Downloaded ICS file with', events.length, 'events');
  }

  /**
   * Get next day in YYYYMMDD format
   * @param {string} dateStr - Date string YYYYMMDD
   * @returns {string} Next day YYYYMMDD
   */
  _getNextDay(dateStr) {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);

    const date = new Date(year, month, day);
    date.setDate(date.getDate() + 1);

    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getDate()).padStart(2, '0');

    return `${nextYear}${nextMonth}${nextDay}`;
  }

  /**
   * Escape special characters for ICS format
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  _escapeICS(str) {
    if (!str) return '';

    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
}

// Export singleton instance
export const calendarExport = new CalendarExport();
