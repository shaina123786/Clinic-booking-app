const { NotFoundError, ConflictError } = require('../errors')
const { validateNewBooking } = require('../validators/bookingValidator')

function createBookingService(db) {
    async function getBooking(id) {
        const booking = await db.get(
            `SELECT
                id,
                slot_id AS slotId,
                patient_name AS patientName,
                patient_email AS patientEmail,
                patient_phone AS patientPhone,
                status,
                created_at AS createdAt
             FROM bookings
             WHERE id = ?`,
            [id]
        )

        if (!booking) {
            throw new NotFoundError('Booking not found')
        }

        return booking
    }

    async function bookSlot(body) {
        const { slotId, patientName, patientEmail, patientPhone } = validateNewBooking(body)

        const slot = await db.get('SELECT id, status FROM slots WHERE id = ?', [slotId])

        if (!slot) {
            throw new NotFoundError('Slot not found')
        }

        if (slot.status === 'cancelled') {
            throw new ConflictError('SLOT_CANCELLED', 'This slot has been cancelled')
        }

        try {
            const result = await db.run(
                `INSERT INTO bookings (slot_id, patient_name, patient_email, patient_phone)
                 VALUES (?, ?, ?, ?)`,
                [slotId, patientName, patientEmail, patientPhone || null]
            )
            return getBooking(result.id)
        } catch (error) {
            if (String(error.message).includes('UNIQUE')) {
                throw new ConflictError('SLOT_ALREADY_BOOKED', 'This slot has already been booked')
            }
            throw error
        }
    }

    async function cancelBooking(id) {
        const booking = await getBooking(id)

        if (booking.status === 'cancelled') {
            throw new ConflictError('BOOKING_ALREADY_CANCELLED', 'This booking is already cancelled')
        }

        await db.run(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [id])

        return getBooking(id)
    }

    return { bookSlot, cancelBooking, getBooking }
}

module.exports = { createBookingService }