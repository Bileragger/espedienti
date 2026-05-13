export function addToCalendar(event) {
  const startDate = event.date.replace(/-/g, '');
  const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;

  let dates;
  if (event.time?.start) {
    const startTime = event.time.start.replace(':', '');
    const endTime   = event.time.end ? event.time.end.replace(':', '') : startTime;
    dates = `${startDate}T${startTime}00/${event.dateEnd ? endDate : startDate}T${endTime}00`;
  } else {
    dates = `${startDate}/${endDate}`;
  }

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE`
    + `&text=${encodeURIComponent(event.title)}`
    + `&dates=${dates}`
    + `&location=${encodeURIComponent(event.location)}`
    + `&details=${encodeURIComponent(event.description ?? '')}`;

  window.open(url, '_blank');
}

export function openDirections(lat, lng, locationName, fullAddress = null) {
  const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const dest     = fullAddress?.trim() ? encodeURIComponent(fullAddress) : `${lat},${lng}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

  if (isIOS) {
    window.location.href = `maps://maps.apple.com/?daddr=${dest}&q=${encodeURIComponent(locationName)}`;
    setTimeout(() => window.open(googleUrl, '_blank'), 500);
  } else {
    window.open(googleUrl, '_blank');
  }
}
