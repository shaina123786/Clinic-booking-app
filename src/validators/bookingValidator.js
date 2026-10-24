const { ValidationError } = require('../errors')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[0-9+\-\s]{7,15}$/

function validateNewBooking(body) {
    const problems = []

    const slotId = Number(body.slotId)
    const patientName = String(body.patientName || '').trim()
    const patientEmail = String(body.patientEmail || '').trim()
    const patientPhone = String(body.patientPhone || '').trim()

    if (!Number.isInteger(slotId) || slotId < 1) {
        problems.push({ field: 'slotId', message: 'Slot id must be a positive number' })
    }

    if (patientName.length < 2) {
        problems.push({ field: 'patientName', message: 'Name must have at least 2 characters' })
    }

    if (!emailPattern.test(patientEmail)) {
        problems.push({ field: 'patientEmail', message: 'Please enter a valid email' })
    }

    if (patientPhone && !phonePattern.test(patientPhone)) {
        problems.push({ field: 'patientPhone', message: 'Phone must have 7 to 15 digits' })
    }

    if (problems.length > 0) {
        throw new ValidationError(problems)
    }

    return { slotId, patientName, patientEmail, patientPhone }
}

module.exports = { validateNewBooking }