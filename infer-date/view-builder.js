const monthNameToNumber = Object.freeze({ 'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12 })
const monthNumberToName = Object.freeze({ 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' })

/** @typedef {{year:number, month:number, day:number, comparable:number}} LocalDate */
/** @type {(string)=>LocalDate} */
function parseDate(/** @type {string} */ input) {
    const parts = input.split(' ')
    const day = +parts[0]
    const month = monthNameToNumber[parts[1].toLowerCase()]
    const year = +parts[2]
    if (year <= 1752) throw Error("Dates not supported before 1752 ce (TODO)")
    return newDate(year, month, day)
}

function dateAsComparable(year, month, day) {
    return ((year << 16) | (month << 8) | day)
}
function newDate(year, month, day) {
    return { year, month, day, comparable: dateAsComparable(year, month, day) }
}

function isGregorianLeapYear(/** @type {number} */ year) {
    if (year % 100 == 0) return (year % 400 == 0)
    return (year % 4 == 0)
}

/** @type {(LocalDate)=>LocalDate} */
function addOneDay(/** @type {LocalDate} */ date) {
    if (date.year <= 1752) throw Error("Dates not supported before 1752 ce (TODO)")
    if (date.day == 31 && date.month == 12) return newDate(date.year + 1, 1, 1)
    if (date.day == 31 && [1, 3, 5, 6, 8, 10].includes(date.month)) newDate(date.year, date.month+1, 1)
    if (date.day == 30 && [4, 7, 9, 11].includes(date.month)) newDate(date.year, date.month+1, 1)
    if (date.month == 2) {
        const isLeapYear = isGregorianLeapYear(date.year)
        if (isLeapYear && date.day == 29) return newDate(date.year, date.month+1, 1)
        if (!isLeapYear && date.day == 28) return newDate(date.year, date.month+1, 1)
        return newDate(date.year, date.month, date.day + 1)
    }
    return newDate(date.year, date.month, date.day + 1)
}

function daysInMonth(/** @type {LocalDate} */ date) {
    if (date.year <= 1752) throw Error("Dates not supported before 1752 ce (TODO)")
    if ([1, 3, 5, 6, 8, 10, 12].includes(date.month)) return 31
    if ([4, 7, 9, 11].includes(date.month)) return 30
    if (isGregorianLeapYear(date.year)) return 29
    return 28
}

function isValidDate(/** @type {LocalDate} */ date) {
    if (date.day <= 0 || date.month <= 0 || date.month > 12) return false
    if (date.year <= 1752) return false // TODO
    if (date.day > daysInMonth(date)) return false
    return true
}

function dateBefore(a, b) {
    return (a.year < b.year)
        || (a.year == b.year && a.month < b.month)
        || (a.year == b.year && a.month == b.month && a.day < b.day)
}


function eventsToTimelineView(/** @type {PointInTimeEvent[]} */ events) {
    const dateRanges = events.map(e => {
        const eventDate = parseDate(e.date)
        const start = addOneDay({ ...eventDate, year: eventDate.year - e.age - 1 })
        /** @type {LocalDate} */
        const end = { ...eventDate, year: eventDate.year - e.age }
        return { event: e, eventDate, start, end }
    })

    const extents = findExtentsForDateRanges(dateRanges)

    /** @type {TimelineEvent[]} */
    const eventViews = findEventsForDateRanges(dateRanges, extents)

    return {
        extents,
        eventViews
    }
}


function monthsIntoExtents(/** @type {LocalDate} */ date, extents) {
    let monthCount = 0
    for (const block of extents) {
        monthCount +=
            ((block.year == date.year) ? date.month : block.endMonth)
            - block.startMonth
            + 1
        if (block.year == date.year)
            break
    }
    return monthCount - 1
}

function findEventsForDateRanges(dateRanges, extents) {
    const totalMonths = totalMonthsInExtents(extents)
    return dateRanges.map(r => {
        const startDayPct = r.start.day / daysInMonth(r.start)
        const endDayPct = r.end.day / daysInMonth(r.end)

        let startMonthInExtents = monthsIntoExtents(r.start, extents)
        let endMonthInExtents = monthsIntoExtents(r.end, extents)

        return {
            title: `[${r.event.age} in ${r.event.date}]  ${r.event.description}`,
            startPct: (startMonthInExtents + startDayPct) / totalMonths,
            endPct: (endMonthInExtents + endDayPct) / totalMonths,
            colour: r.event.colour
        }
    })
}

function findExtentsForDateRanges(dateRanges) {
    const earliestStart = dateRanges
        .reduce((sofar, next) => (dateBefore(sofar.start, next.start)) ? sofar : next)
        .start
    const latestEnd = dateRanges
        .reduce((sofar, next) => (dateBefore(sofar.end, next.end)) ? next : sofar)
        .end

    /** @type {TimelineExtents} */
    const extents = []
    for (i = earliestStart.year; i <= latestEnd.year; i++) {
        extents.push({
            year: i,
            startMonth: (i == earliestStart.year) ? earliestStart.month : 1,
            endMonth: (i == latestEnd.year) ? latestEnd.month : 12,
        })
    }
    return extents
}

