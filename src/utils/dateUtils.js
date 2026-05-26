export const fmtKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const keyToLabel = (key, opts = {}) =>
  new Date(key + 'T12:00:00').toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric', year:'numeric', ...opts,
  });

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
export const firstWeekday = (year, month) => new Date(year, month, 1).getDay();
