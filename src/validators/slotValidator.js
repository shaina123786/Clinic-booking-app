const { ValidationError } = require('../errors')

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function validateNewSlot(body) {
    const problems = []

    const clinicName = String(body.clinicName || '').trim()
    const slotDate = String(body.slotDate || '').trim()
    const startTime = String(body.startTime || '').trim()
    const endTime = String(body.endTime || '').trim()

    if (clinicName.length < 2) {
        problems.push({ field: 'clinicName', message: 'Clinic name must have at least 2 characters' })
    }

    if (!datePattern.test(slotDate)) {
        problems.push({ field: 'slotDate', message: 'Date must look like 2026-12-01' })
    }

    if (!timePattern.test(startTime)) {
        problems.push({ field: 'startTime', message: 'Start time must look like 10:30' })
    }

    if (!timePattern.test(endTime)) {
        problems.push({ field: 'endTime', message: 'End time must look like 11:00' })
    }

    if (problems.length > 0) {
        throw new ValidationError(problems)
    }

    if (endTime <= startTime) {
        throw new ValidationError([{ field: 'endTime', message: 'End time must be after start time' }])
    }

    const slotStart = new Date(`${slotDate}T${startTime}:00`)

    if (slotStart < new Date()) {
        throw new ValidationError([{ field: 'slotDate', message: 'Slot cannot be in the past' }])
    }

    return { clinicName, slotDate, startTime, endTime }
}

module.exports = { validateNewSlot }