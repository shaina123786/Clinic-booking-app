const tabButtons = document.querySelectorAll('.tab')
const views = document.querySelectorAll('.view')
const filterDate = document.getElementById('filterDate')
const clearFilter = document.getElementById('clearFilter')
const patientSlots = document.getElementById('patientSlots')
const clinicSlots = document.getElementById('clinicSlots')
const slotForm = document.getElementById('slotForm')
const bookingForm = document.getElementById('bookingForm')
const bookingDialog = document.getElementById('bookingDialog')
const bookingSummary = document.getElementById('bookingSummary')
const confirmBookingButton = document.getElementById('confirmBooking')
const closeBookingButton = document.getElementById('closeBooking')
const confirmDialog = document.getElementById('confirmDialog')
const confirmMessage = document.getElementById('confirmMessage')
const toastBox = document.getElementById('toastBox')

let selectedSlot = null

function make(tag, className, text) {
    const element = document.createElement(tag)
    if (className) element.className = className
    if (text) element.textContent = text
    return element
}

function todayText() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

function formatDate(dateText) {
    const date = new Date(`${dateText}T00:00:00`)
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function formatTime(timeText) {
    const [hourText, minute] = timeText.split(':')
    const hour = Number(hourText)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute} ${suffix}`
}

function showToast(message, type = 'success') {
    const toast = make('div', `toast ${type}`, message)
    toastBox.appendChild(toast)
    setTimeout(() => toast.remove(), 3500)
}

async function callApi(path, options = {}) {
    const response = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    })
    const data = await response.json()

    if (!response.ok) {
        const error = new Error(data.error.message)
        error.details = data.error.details || []
        throw error
    }

    return data
}

function showMessage(container, text) {
    container.innerHTML = ''
    container.appendChild(make('div', 'message-box', text))
}

function clearFieldErrors(form) {
    form.querySelectorAll('.field-error').forEach((item) => {
        item.textContent = ''
    })
}

function showFieldErrors(form, details) {
    details.forEach((detail) => {
        const target = form.querySelector(`[data-for="${detail.field}"]`)
        if (target) target.textContent = detail.message
    })
}

function askConfirm(message) {
    confirmMessage.textContent = message
    confirmDialog.returnValue = ''
    confirmDialog.showModal()

    return new Promise((resolve) => {
        confirmDialog.addEventListener(
            'close',
            () => resolve(confirmDialog.returnValue === 'yes'),
            { once: true }
        )
    })
}

function buildPatientCard(slot) {
    const card = make('article', 'slot-card')
    const info = make('div')

    info.appendChild(make('h3', '', slot.clinicName))
    info.appendChild(make('p', '', formatDate(slot.slotDate)))
    info.appendChild(make('p', 'slot-time', `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`))

    const button = make('button', 'btn primary', 'Book Now')
    button.addEventListener('click', () => openBookingDialog(slot))

    card.appendChild(info)
    card.appendChild(button)
    return card
}

async function loadPatientSlots() {
    showMessage(patientSlots, 'Loading available slots...')

    try {
        let path = '/slots?state=available'
        if (filterDate.value) path += `&date=${filterDate.value}`

        const slots = await callApi(path)

        if (slots.length === 0) {
            showMessage(patientSlots, 'No slots available right now. Please check another date.')
            return
        }

        patientSlots.innerHTML = ''
        slots.forEach((slot) => patientSlots.appendChild(buildPatientCard(slot)))
    } catch (error) {
        showMessage(patientSlots, 'Could not load slots. Is the server running?')
    }
}

function openBookingDialog(slot) {
    selectedSlot = slot
    bookingSummary.textContent = `${slot.clinicName} | ${formatDate(slot.slotDate)} | ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    bookingForm.reset()
    clearFieldErrors(bookingForm)
    bookingDialog.showModal()
}

async function submitBooking(event) {
    event.preventDefault()
    clearFieldErrors(bookingForm)
    confirmBookingButton.disabled = true
    confirmBookingButton.textContent = 'Booking...'

    const formData = new FormData(bookingForm)

    try {
        const booking = await callApi('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                slotId: selectedSlot.id,
                patientName: formData.get('patientName'),
                patientEmail: formData.get('patientEmail'),
                patientPhone: formData.get('patientPhone')
            })
        })

        bookingDialog.close()
        showToast(`Booking confirmed! Your booking id is #${booking.id}`)
        loadPatientSlots()
    } catch (error) {
        if (error.details.length > 0) {
            showFieldErrors(bookingForm, error.details)
        } else {
            bookingDialog.close()
            showToast(error.message, 'error')
            loadPatientSlots()
        }
    }

    confirmBookingButton.disabled = false
    confirmBookingButton.textContent = 'Confirm Booking'
}

function buildClinicRow(slot) {
    const row = make('article', 'slot-row')
    const info = make('div')

    info.appendChild(make('h3', '', slot.clinicName))
    info.appendChild(make('p', '', `${formatDate(slot.slotDate)} | ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`))

    if (slot.state === 'booked') {
        info.appendChild(make('p', '', `Patient: ${slot.patientName} (booking #${slot.bookingId})`))
    }

    const actions = make('div', 'row-actions')
    actions.appendChild(make('span', `badge ${slot.state}`, slot.state))

    if (slot.state === 'booked') {
        const cancelBookingButton = make('button', 'btn small outline-danger', 'Cancel booking')
        cancelBookingButton.addEventListener('click', () => cancelBooking(slot))
        actions.appendChild(cancelBookingButton)
    }

    if (slot.state !== 'cancelled') {
        const cancelSlotButton = make('button', 'btn small outline-danger', 'Cancel slot')
        cancelSlotButton.addEventListener('click', () => cancelSlot(slot))
        actions.appendChild(cancelSlotButton)
    }

    row.appendChild(info)
    row.appendChild(actions)
    return row
}

async function loadClinicSlots() {
    showMessage(clinicSlots, 'Loading slots...')

    try {
        const slots = await callApi('/slots')

        if (slots.length === 0) {
            showMessage(clinicSlots, 'No slots yet. Add your first slot above.')
            return
        }

        clinicSlots.innerHTML = ''
        slots.forEach((slot) => clinicSlots.appendChild(buildClinicRow(slot)))
    } catch (error) {
        showMessage(clinicSlots, 'Could not load slots. Is the server running?')
    }
}

async function submitSlot(event) {
    event.preventDefault()
    clearFieldErrors(slotForm)

    const formData = new FormData(slotForm)

    try {
        await callApi('/slots', {
            method: 'POST',
            body: JSON.stringify({
                clinicName: formData.get('clinicName'),
                slotDate: formData.get('slotDate'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime')
            })
        })

        slotForm.reset()
        showToast('Slot created successfully')
        loadClinicSlots()
    } catch (error) {
        if (error.details.length > 0) {
            showFieldErrors(slotForm, error.details)
        } else {
            showToast(error.message, 'error')
        }
    }
}

async function cancelSlot(slot) {
    const message = slot.state === 'booked'
        ? 'This slot has a booking. Cancelling the slot will cancel the booking too.'
        : 'Do you want to cancel this slot?'

    const confirmed = await askConfirm(message)
    if (!confirmed) return

    try {
        await callApi(`/slots/${slot.id}`, { method: 'DELETE' })
        showToast('Slot cancelled')
    } catch (error) {
        showToast(error.message, 'error')
    }

    loadClinicSlots()
}

async function cancelBooking(slot) {
    const confirmed = await askConfirm(`Cancel the booking of ${slot.patientName}? The slot will become available again.`)
    if (!confirmed) return

    try {
        await callApi(`/bookings/${slot.bookingId}`, { method: 'DELETE' })
        showToast('Booking cancelled')
    } catch (error) {
        showToast(error.message, 'error')
    }

    loadClinicSlots()
}

function switchView(viewId) {
    tabButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.view === viewId)
    })

    views.forEach((view) => {
        view.classList.toggle('hidden', view.id !== viewId)
    })

    if (viewId === 'patientView') loadPatientSlots()
    if (viewId === 'clinicView') loadClinicSlots()
}

tabButtons.forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view))
})

filterDate.addEventListener('change', loadPatientSlots)

clearFilter.addEventListener('click', () => {
    filterDate.value = ''
    loadPatientSlots()
})

closeBookingButton.addEventListener('click', () => bookingDialog.close())
bookingForm.addEventListener('submit', submitBooking)
slotForm.addEventListener('submit', submitSlot)

document.getElementById('slotDate').min = todayText()
filterDate.min = todayText()

loadPatientSlots()