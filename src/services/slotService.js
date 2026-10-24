const { NotFoundError, ConflictError } = require('../errors')
const { validateNewSlot } = require('../validators/slotValidator')

function createSlotService(db) {
    const slotQuery = `
        SELECT
            slots.id,
            slots.clinic_name AS clinicName,
            slots.slot_date AS slotDate,
            slots.start_time AS startTime,
            slots.end_time AS endTime,
            slots.status AS slotStatus,
            bookings.id AS bookingId,
            bookings.patient_name AS patientName
        FROM slots
        LEFT JOIN bookings
            ON bookings.slot_id = slots.id AND bookings.status = 'confirmed'
    `

    function addState(row) {
        let state = 'available'

        if (row.slotStatus === 'cancelled') {
            state = 'cancelled'
        } else if (row.bookingId) {
            state = 'booked'
        }

        return {
            id: row.id,
            clinicName: row.clinicName,
            slotDate: row.slotDate,
            startTime: row.startTime,
            endTime: row.endTime,
            state: state,
            bookingId: row.bookingId,
            patientName: row.patientName
        }
    }

    async function getSlot(id) {
        const row = await db.get(`${slotQuery} WHERE slots.id = ?`, [id])

        if (!row) {
            throw new NotFoundError('Slot not found')
        }

        return addState(row)
    }

    async function createSlot(body) {
        const { clinicName, slotDate, startTime, endTime } = validateNewSlot(body)

        const overlapping = await db.get(
            `SELECT id FROM slots
             WHERE clinic_name = ? AND slot_date = ? AND status = 'open'
             AND start_time < ? AND end_time > ?`,
            [clinicName, slotDate, endTime, startTime]
        )

        if (overlapping) {
            throw new ConflictError('SLOT_OVERLAPS', 'This clinic already has a slot in that time')
        }

        try {
            const result = await db.run(
                `INSERT INTO slots (clinic_name, slot_date, start_time, end_time)
                 VALUES (?, ?, ?, ?)`,
                [clinicName, slotDate, startTime, endTime]
            )
            return getSlot(result.id)
        } catch (error) {
            if (String(error.message).includes('UNIQUE')) {
                throw new ConflictError('SLOT_EXISTS', 'This slot already exists')
            }
            throw error
        }
    }

    async function listSlots(filters = {}) {
        const conditions = []
        const values = []

        if (filters.clinicName) {
            conditions.push('slots.clinic_name = ?')
            values.push(filters.clinicName)
        }

        if (filters.date) {
            conditions.push('slots.slot_date = ?')
            values.push(filters.date)
        }

        const whereText = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const rows = await db.all(
            `${slotQuery} ${whereText} ORDER BY slots.slot_date, slots.start_time`,
            values
        )

        const slots = rows.map(addState)

        if (filters.state) {
            return slots.filter((slot) => slot.state === filters.state)
        }

        return slots
    }

    async function cancelSlot(id) {
        const slot = await getSlot(id)

        if (slot.state === 'cancelled') {
            throw new ConflictError('SLOT_ALREADY_CANCELLED', 'This slot is already cancelled')
        }

        await db.run(`UPDATE slots SET status = 'cancelled' WHERE id = ?`, [id])
        await db.run(
            `UPDATE bookings SET status = 'cancelled' WHERE slot_id = ? AND status = 'confirmed'`,
            [id]
        )

        return getSlot(id)
    }

    return { createSlot, listSlots, cancelSlot, getSlot }
}

module.exports = { createSlotService }