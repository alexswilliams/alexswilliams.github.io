let title = 'New Diagram'

/** @type {HTMLSpanElement} */
const docTitle = document.getElementById('subtitle')
/** @type {HTMLInputElement} */
const titleTextbox = document.getElementById('subtitle-textbox')
/** @type {HTMLSpanElement} */
const titleEdit = document.getElementById('subtitle-edit')
/** @type {HTMLSpanElement} */
const titleDone = document.getElementById('subtitle-done')

titleEdit.addEventListener('click', () => {
    titleEdit.style.display = 'none'
    docTitle.style.display = 'none'
    titleTextbox.value = title
    titleTextbox.style.display = 'inline-block'
    titleDone.style.display = 'inline'
    titleTextbox.focus()
    titleTextbox.setSelectionRange(0, title.length)
})
function updateTitle(newTitle) {
    titleDone.style.display = 'none'
    titleTextbox.style.display = 'none'
    title = newTitle
    docTitle.textContent = title
    updateLocationHash()
    titleEdit.style.display = 'inline'
    docTitle.style.display = 'inline'
}
titleTextbox.addEventListener('keypress', (ev) => { if (ev.key == 'Enter') updateTitle(titleTextbox.value) })
titleDone.addEventListener('click', () => updateTitle(titleTextbox.value))


/** @typedef {{date: string, age: number, description: string, colour: string}} PointInTimeEvent */
/** @type {PointInTimeEvent[]} */
let eventList = []

function updateKnownEventsList() {
    /** @type {HTMLTableElement} */
    const oldParent = document.getElementById("all-events")
    const newParent = document.createElement("tbody")
    newParent.id = "all-events"
    for (i = 0; i < eventList.length; i++) {
        const child = createEventForm(eventList[i], i)
        newParent.appendChild(child)
    }
    oldParent.replaceWith(newParent)
    document.getElementById("events-legend").style.display = (eventList.length == 0)
        ? 'none'
        : 'table-header-group'

    updateLocationHash()
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
    date.pattern = "([1-9]|[12][0-9]|30|31) ([jJ]an|[fF]eb|[mM]ar|[aA]pr|[mM]ay|[jJ]un|[jJ]ul|[aA]ug|[sS]ep|[oO]ct|[nN]ov|[dD]ec) [12][0-9]{3}"
    date.addEventListener('input', dateChangeHandler)

    const ageTd = tr.appendChild(document.createElement("td"))
    const age = ageTd.appendChild(document.createElement("input"))
    age.type = "number"
    age.size = 4
    age.id = "age-" + n
    age.min = 0
    age.value = event.age
    age.addEventListener('input', ageChangeHandler)

    const descTd = tr.appendChild(document.createElement("td"))
    const desc = descTd.appendChild(document.createElement("input"))
    desc.type = "text"
    desc.size = 40
    desc.id = "desc-" + n
    desc.value = event.description
    desc.addEventListener('input', descriptionChangeHandler)

    const colourTd = tr.appendChild(document.createElement("td"))
    const colour = colourTd.appendChild(document.createElement("input"))
    colour.type = "color"
    colour.id = "colour-" + n
    colour.value = event.colour
    colour.addEventListener('change', colourChangeHandler)

    const controlsTd = tr.appendChild(document.createElement("td"))
    const deleteBtn = controlsTd.appendChild(document.createElement("button"))
    deleteBtn.id = "delete-" + n
    deleteBtn.appendChild(document.createTextNode("Delete"))
    deleteBtn.addEventListener('click', deleteHandler)

    return tr
}

function deleteHandler() {
    eventList.splice(+(this.id.split('-')[1]), 1)
    updateKnownEventsList()
    renderTimelineFromEventList()
}
function colourChangeHandler() {
    eventList[+(this.id.split('-')[1])].colour = this.value
    renderTimelineFromEventList()
}
function descriptionChangeHandler() {
    eventList[+(this.id.split('-')[1])].description = this.value
    renderTimelineFromEventList()
}
function ageChangeHandler() {
    eventList[+(this.id.split('-')[1])].age = +this.value
    renderTimelineFromEventList()
}
function dateChangeHandler() {
    if (this.checkValidity()) {
        eventList[+(this.id.split('-')[1])].date = this.value
        renderTimelineFromEventList()
    }
}


document.getElementById('add').addEventListener('click', () => {
    const newDate = document.getElementById('new-event-date')
    const newAge = document.getElementById('new-event-age')
    const newDesc = document.getElementById('new-event-desc')
    const newColour = document.getElementById('new-event-colour')
    if (newDate.checkValidity()) {
        const toAdd = {
            date: newDate.value,
            age: +(newAge.value),
            description: newDesc.value,
            colour: newColour.value
        }
        eventList.push(toAdd)
        eventList.sort((a, b) => (dateBefore(parseDate(a.date), parseDate(b.date))) ? -1 : 1)
        updateKnownEventsList()
        renderTimelineFromEventList()

        newDate.value = ''
        newAge.value = ''
        newDesc.value = ''
        newColour.value = '#cccccc'
    }
})


function updateListAndRenderTimeline(newTitle, newEventList) {
    title = newTitle
    docTitle.textContent = title
    eventList = newEventList
    updateKnownEventsList(eventList)
    renderTimelineFromEventList()
}

function renderTimelineFromEventList() {
    if (eventList.length == 0) {
        renderTimeline([], [])
    } else {
        const { extents, eventViews } = eventsToTimelineView(eventList)
        renderTimeline(extents, eventViews)
    }
}


function updateLocationHash() {
    if (title == 'New Diagram' && eventList.length == 0) {
        window.location.hash = ''
        return
    }
    const hash = JSON.stringify({ t: title, e: eventList.map(it => ({ d: it.date, a: it.age, t: it.description, c: it.colour })) })
    window.location.hash = btoa(unescape(encodeURIComponent(hash)))
}


if (window.location.hash != '') {
    try {
        const hash = JSON.parse(decodeURIComponent(escape(atob(window.location.hash.substring(1)))))
        if (!Object.keys(hash).includes('e')) throw Error('Hash missing e field')
        if (hash.t != undefined && typeof hash.t != 'string') throw Error('Hash title field was not a string')
        const newTitle = hash.t || 'New Diagram'
        const newEventList = hash.e.map(event => {
            const keys = Object.keys(event)
            if (!keys.includes('d')) throw Error('Event missing d field')
            if (typeof event.d != 'string' || !/^([1-9]|[12][0-9]|30|31) ([jJ]an|[fF]eb|[mM]ar|[aA]pr|[mM]ay|[jJ]un|[jJ]ul|[aA]ug|[sS]ep|[oO]ct|[nN]ov|[dD]ec) [12][0-9]{3}$/.test(event.d))
                throw Error('Event date not a properly formatted date string')
            if (!keys.includes('a')) throw Error('Event missing a field')
            if (typeof event.a != 'number' || !Number.isInteger(event.a)) throw Error('Event age not a whole number')
            if (event.t != undefined && typeof event.t != 'string') throw Error('Event title field was not a string')
            if (event.c != undefined && (typeof event.c != 'string' || !/^[#][0-9a-f]{6}$/.test(event.c))) throw Error('Event colour field was not a hex colour string')
            return {
                date: event.d,
                age: event.a,
                description: event.t,
                colour: event.c,
            }
        })

        updateListAndRenderTimeline(newTitle, newEventList)
    } catch (e) {
        console.error('Could not read hash', window.location.hash, e)
        window.location.hash = ''
        updateKnownEventsList()
        renderTimelineFromEventList()
    }
} else {
    updateKnownEventsList()
    renderTimelineFromEventList()
}

document.getElementById("blank").addEventListener("click", () => updateListAndRenderTimeline('Sample: Blank', []))
document.getElementById("single").addEventListener("click", () => updateListAndRenderTimeline('Sample: A Single Event', [
    { date: '4 May 2007', age: 10, description: 'A single event', colour: '#0099cc' }
]))
document.getElementById("two-over").addEventListener("click", () => updateListAndRenderTimeline('Sample: Two Overlapping Events', [
    { date: '12 Apr 2007', age: 10, description: 'An event', colour: '#0099cc' },
    { date: '30 Aug 2008', age: 11, description: 'Another event', colour: '#ff9900' },
]))
document.getElementById("two-non-over").addEventListener("click", () => updateListAndRenderTimeline('Sample: Two Distinct Events', [
    { date: '12 Apr 2007', age: 10, description: 'An event', colour: '#0099cc' },
    { date: '30 Mar 2008', age: 12, description: 'Another event', colour: '#ff9900' },
]))
document.getElementById("real-life-eg").addEventListener("click", () => updateListAndRenderTimeline('Sample: John Jones', [
    { date: '3 Apr 1881', age: 7, description: '1881 Census', colour: '#ffcc66' },
    { date: '5 Apr 1891', age: 16, description: '1891 Census', colour: '#ffcc66' },
    { date: '1 Aug 1896', age: 21, description: 'Marriage Certificate', colour: '#66cc66' },
    { date: '31 Mar 1901', age: 26, description: '1901 Census', colour: '#ffcc66' },
    { date: '2 Apr 1911', age: 35, description: '1911 Census', colour: '#ffcc66' },
    { date: '18 Jun 1946', age: 72, description: 'Death Certificate', colour: '#99ccff' },
]))
document.getElementById("real-life-eg-2").addEventListener("click", () => updateListAndRenderTimeline('Sample: Edith Davies', [
    { date: '1 Aug 1896', age: 19, description: 'Marriage Certificate', colour: '#66cc66' },
    { date: '31 Mar 1901', age: 22, description: '1901 Census', colour: '#ffcc66' },
    { date: '2 Apr 1911', age: 33, description: '1911 Census', colour: '#ffcc66' },
    { date: '14 Jul 1938', age: 60, description: 'Death Certificate', colour: '#99ccff' },
    { date: '18 Jul 1938', age: 60, description: 'Burial Record', colour: '#cccccc' },
]))
