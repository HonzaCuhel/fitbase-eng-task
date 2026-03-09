import dayjs from 'dayjs'

export const getFormattedDate = (date, format = 'MMM D, YYYY') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const getFormattedDateTime = (date) => {
  return getFormattedDate(date, 'MMM D, YYYY h:mm A')
}

export const getRelativeTime = (date) => {
  if (!date) return ''
  const diff = dayjs().diff(dayjs(date), 'day')
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return getFormattedDate(date)
}
