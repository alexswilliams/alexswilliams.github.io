/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("timeline")
/** @type {HTMLHeadingElement} */
const subtitle = document.getElementById("subtitle")

if (!canvas.getContext) subtitle.textContent = "Canvas is not supported by this browser"

const monthInitials = Object.freeze({ 1: 'J', 2: 'F', 3: 'M', 4: 'A', 5: 'M', 6: 'J', 7: 'J', 8: 'A', 9: 'S', 10: 'O', 11: 'N', 12: 'D' })

const BORDER = 10 // px
const MONTH_WIDTH = 30 // px
const TIMELINE_HEAD_HEIGHT = 80 // px
const LABEL_PADDING = 20 // px
const EVENT_TABLE_SPACING = 30 // px
const BAR_HEIGHT = 12 // px
const INFERENCE_LINE_HEIGHT = 20 // px

function max(a, b) { return (a >= b) ? a : b }

function totalMonthsInExtents(/** @type {TimelineExtents} */ extents) {
    return extents.reduce((acc, next) => acc + next.endMonth - next.startMonth + 1, 0)
}

/** @typedef {{year: number, startMonth: number, endMonth: number}[]} TimelineExtents */
/** @typedef {{title: string, startPct: number, endPct: number, colour: string|undefined}} TimelineEvent */
function renderTimeline(/** @type {TimelineExtents} */ extents, /** @type {TimelineEvent[]} */ events) {
    const totalMonths = totalMonthsInExtents(extents)
    const timelineWidth = totalMonths * MONTH_WIDTH

    let tempContext = canvas.getContext('2d')
    tempContext.font = '12px sans-serif'
    const longestEventName = events.reduce((sofar, next) => max(sofar, tempContext.measureText(next.title).width), 0)
    tempContext = undefined

    canvas.width = BORDER + timelineWidth + LABEL_PADDING + longestEventName + BORDER
    canvas.height = BORDER + TIMELINE_HEAD_HEIGHT + (EVENT_TABLE_SPACING * events.length) + BORDER

    const context = canvas.getContext('2d')
    context.strokeStyle = 'rgb(0,0,0)'

    // Horizontal Timeline
    renderTimelineHeader(context, timelineWidth, extents, totalMonths)

    for (i = 0; i < events.length; i++) {
        renderEvent(context, timelineWidth, events[i], i)
    }

    if (events.length > 0) {
        const latestStart = events.reduce((sofar, next) => (next.startPct > sofar.startPct) ? next : sofar)
        const earliestEnd = events.reduce((sofar, next) => (next.endPct < sofar.endPct) ? next : sofar)
        if (latestStart.startPct < earliestEnd.endPct) {
            renderOpportunityWindow(context, latestStart.startPct, earliestEnd.endPct, timelineWidth)
        }
    }
}

function renderOpportunityWindow(
    /** @type {CanvasRenderingContext2D} */ context,
    /** @type {number} */ start,
    /** @type {number} */ end,
    /** @type {number} */ timelineWidth,
) {
    const left = BORDER + (timelineWidth * start)
    const right = BORDER + (timelineWidth * end)
    drawLine(context, left, 20, right, 20, c => { c.lineWidth = 2; c.setLineDash([4, 4]) })
    context.save()
    context.beginPath()
    context.moveTo(left, 20)
    context.lineTo(left + 5, 20 - 5)
    context.lineTo(left + 5, 20 + 5)
    context.fill()
    context.beginPath()
    context.moveTo(right, 20)
    context.lineTo(right - 5, 20 - 5)
    context.lineTo(right - 5, 20 + 5)
    context.fill()
    context.restore()
    drawLine(context, left, 20 - 8, left, TIMELINE_HEAD_HEIGHT, c => { c.lineWidth = 0.7 })
    drawLine(context, right, 20 - 8, right, TIMELINE_HEAD_HEIGHT, c => { c.lineWidth = 0.7 })
}

function renderEvent(
    /** @type {CanvasRenderingContext2D} */ context,
    /** @type {number} */ timelineWidth,
    /** @type {TimelineEvent} */ event,
    /** @type {number} */ eventNumber,
) {
    const top = TIMELINE_HEAD_HEIGHT + ((eventNumber + 1) * EVENT_TABLE_SPACING)
    const left = BORDER + (timelineWidth * event.startPct)
    const width = timelineWidth * (event.endPct - event.startPct)
    const right = BORDER + (timelineWidth * event.endPct)

    context.save()
    context.strokeStyle = 'rgba(0,0,0,0.5)'
    context.lineWidth = 2
    context.fillStyle = event.colour || 'rgb(192,192,192)'
    context.fillRect(left, top, width, BAR_HEIGHT)
    context.strokeRect(left, top, width, BAR_HEIGHT)
    context.restore()

    context.save()
    context.textBaseline = "ideographic"
    context.font = BAR_HEIGHT + 'px sans-serif'
    context.fillText(event.title, BORDER + timelineWidth + LABEL_PADDING, top + BAR_HEIGHT)
    context.restore()

    drawLine(context, left, top, left, TIMELINE_HEAD_HEIGHT - 7, c => {
        c.strokeStyle = 'rgb(128,128,128)'
        c.setLineDash([2, 1])
        c.lineWidth = 0.8
    })
    drawLine(context, right, top, right, TIMELINE_HEAD_HEIGHT - 7, c => {
        c.strokeStyle = 'rgb(128,128,128)'
        c.setLineDash([2, 1])
        c.lineWidth = 0.8
    })
    drawLine(context, right, top + (BAR_HEIGHT / 2), BORDER + timelineWidth + (LABEL_PADDING / 2), top + (BAR_HEIGHT / 2), c => {
        c.strokeStyle = event.colour || 'rgb(0,0,0)'
        c.globalAlpha = 0.75
        c.setLineDash([4, 3])
        c.lineWidth = 0.5
    })
}

function renderTimelineHeader(
    /** @type {CanvasRenderingContext2D} */ context,
    /** @type {number} */ timelineWidth,
    /** @type {TimelineExtents} */ extents,
    /** @type {number} */ totalMonths
) {
    drawLine(context,
        BORDER, TIMELINE_HEAD_HEIGHT,
        BORDER + timelineWidth, TIMELINE_HEAD_HEIGHT,
        c => c.lineWidth = 2)

    // Month Initials and Dividing Ticks
    /** @type {number[]} */
    const monthNumbers = extents
        .reduce((acc, next) => [
            ...acc,
            ...Array.from(new Array(next.endMonth - next.startMonth + 1), (_v, i) => i + next.startMonth)
        ], [])
    context.font = "10px sans-serif"
    for (i = 0; i < totalMonths; i++) {
        const letterWidth = context.measureText(monthInitials[monthNumbers[i]]).width
        context.fillText(monthInitials[monthNumbers[i]], (MONTH_WIDTH / 2) + BORDER + i * MONTH_WIDTH - (letterWidth / 2), TIMELINE_HEAD_HEIGHT - BORDER)
        if (i != totalMonths - 1) {
            drawLine(context,
                10 + (i + 1) * MONTH_WIDTH, (monthNumbers[i] == 12) ? TIMELINE_HEAD_HEIGHT - 30 : TIMELINE_HEAD_HEIGHT - 5,
                10 + (i + 1) * MONTH_WIDTH, (monthNumbers[i] == 12) ? TIMELINE_HEAD_HEIGHT + 5 : TIMELINE_HEAD_HEIGHT,
                c => c.lineWidth = 1)
        }
    }

    // Year Number Text
    const yearWidths = extents.map(it => MONTH_WIDTH * (it.endMonth - it.startMonth + 1))
    const yearEndXs = yearWidths.reduce((acc, next) => ([...acc, acc[acc.length - 1] + next]), [0])
    context.font = "12px sans-serif"
    for (i = 0; i < yearEndXs.length - 1; i++) {
        const yearTextWidth = context.measureText('' + extents[i].year).width
        const startX = BORDER + ((yearEndXs[i] + yearEndXs[i + 1]) / 2) - (yearTextWidth / 2)
        context.fillText('' + extents[i].year, startX, TIMELINE_HEAD_HEIGHT - 30)
    }
}

function drawLine(
    /** @type {CanvasRenderingContext2D} */ context,
    /** @type {number} */ fromX,
    /** @type {number} */ fromY,
    /** @type {number} */ toX,
    /** @type {number} */ toY,
    /** @type {undefined | (ctx: CanvasRenderingContext2D) => void} */ before) {
    context.save()
    if (before) before(context)
    context.beginPath()
    context.moveTo(fromX, fromY)
    context.lineTo(toX, toY)
    context.stroke()
    context.restore()
}

