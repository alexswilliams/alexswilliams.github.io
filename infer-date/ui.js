/** @type {HTMLInputElement|undefined} */
const x = undefined

/** @typedef {{date: string, age: number, description: string, colour: string}} PointInTimeEvent */
function updateKnownEventsList(/** @type {PointInTimeEvent[]} */ events) {
    /** @type {HTMLTableElement} */
    const oldParent = document.getElementById("all-events")
    const newParent = document.createElement("tbody")
    newParent.id = "all-events"
    for (i = 0; i < events.length; i++) {
        const child = createEventForm(events[i], i)
        newParent.appendChild(child)
    }
    oldParent.replaceWith(newParent)
    document.getElementById("events-legend").style.display = (events.length == 0)
        ? 'none'
        : 'table-header-group'
}

/** @type {number|undefined} */
let updateTimer = undefined

function createEventForm(/** @type {PointInTimeEvent} */ event, /** @type {number} */ n) {
    const tr = document.createElement("tr")

    const dateTd = tr.appendChild(document.createElement("td"))
    const date = dateTd.appendChild(document.createElement("input"))
    date.type = "text"
    date.size = 12
    date.id = "date-" + n
    date.value = event.date

    const ageTd = tr.appendChild(document.createElement("td"))
    const age = ageTd.appendChild(document.createElement("input"))
    age.type = "number"
    age.size = 4
    age.id = "age-" + n
    age.value = event.age

    const descTd = tr.appendChild(document.createElement("td"))
    const desc = descTd.appendChild(document.createElement("input"))
    desc.type = "text"
    desc.size = 40
    desc.id = "desc-" + n
    desc.value = event.description

    const colourTd = tr.appendChild(document.createElement("td"))
    const colour = colourTd.appendChild(document.createElement("input"))
    colour.type = "color"
    colour.id = "colour-" + n
    colour.value = event.colour

    const controlsTd = tr.appendChild(document.createElement("td"))
    const upBtn = controlsTd.appendChild(document.createElement("button"))
    const downBtn = controlsTd.appendChild(document.createElement("button"))
    const deleteBtn = controlsTd.appendChild(document.createElement("button"))

    upBtn.id = "up-" + n
    downBtn.id = "down-" + n
    deleteBtn.id = "delete-" + n
    upBtn.appendChild(document.createTextNode("Up"))
    downBtn.appendChild(document.createTextNode("Down"))
    deleteBtn.appendChild(document.createTextNode("Delete"))

    return tr
}

/** @type {PointInTimeEvent[]} */
let eventList = []
updateKnownEventsList([])
renderTimeline([], [])


document.getElementById("blank").addEventListener("click", () => {
    renderTimeline([], [])
    updateKnownEventsList([])
})
document.getElementById("single").addEventListener("click", () => {
    eventList = [
        { date: '4 May 2007', age: 10, description: 'A single event', colour: '#0099cc' }
    ]
    updateKnownEventsList(eventList)
    const { extents, eventViews } = eventsToTimelineView(eventList)
    renderTimeline(extents, eventViews)
})
document.getElementById("two-over").addEventListener("click", () => {
    eventList = [
        { date: '12 Apr 2007', age: 10, description: 'An event', colour: '#0099cc' },
        { date: '30 Aug 2008', age: 11, description: 'Another event', colour: '#ff9900' },
    ]
    updateKnownEventsList(eventList)
    const { extents, eventViews } = eventsToTimelineView(eventList)
    renderTimeline(extents, eventViews)
})
document.getElementById("two-non-over").addEventListener("click", () => {
    eventList = [
        { date: '12 Apr 2007', age: 10, description: 'An event', colour: '#0099cc' },
        { date: '30 Mar 2008', age: 12, description: 'Another event', colour: '#ff9900' },
    ]
    updateKnownEventsList(eventList)
    const { extents, eventViews } = eventsToTimelineView(eventList)
    renderTimeline(extents, eventViews)
})
document.getElementById("real-life-eg").addEventListener("click", () => {
    eventList = [
        { date: '3 Apr 1881', age: 7, description: '1881 Census', colour: '#ffcc66' },
        { date: '5 Apr 1891', age: 16, description: '1891 Census', colour: '#ffcc66' },
        { date: '1 Aug 1896', age: 21, description: 'Marriage Certificate', colour: '#66cc66' },
        { date: '31 Mar 1901', age: 26, description: '1901 Census', colour: '#ffcc66' },
        { date: '2 Apr 1911', age: 35, description: '1911 Census', colour: '#ffcc66' },
        { date: '18 Jun 1946', age: 72, description: 'Death Certificate', colour: '#99ccff' },
    ]
    updateKnownEventsList(eventList)
    const { extents, eventViews } = eventsToTimelineView(eventList)
    renderTimeline(extents, eventViews)
})
document.getElementById("real-life-eg-2").addEventListener("click", () => {
    eventList = [
        { date: '1 Aug 1896', age: 19, description: 'Marriage Certificate', colour: '#66cc66' },
        { date: '31 Mar 1901', age: 22, description: '1901 Census', colour: '#ffcc66' },
        { date: '2 Apr 1911', age: 33, description: '1911 Census', colour: '#ffcc66' },
        { date: '14 Jul 1938', age: 60, description: 'Death Certificate', colour: '#99ccff' },
        { date: '18 Jul 1938', age: 60, description: 'Burial Record', colour: '#cccccc' },
    ]
    updateKnownEventsList(eventList)
    const { extents, eventViews } = eventsToTimelineView(eventList)
    renderTimeline(extents, eventViews)
})
