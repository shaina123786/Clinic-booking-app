const { readId } = require('../validators/idValidator')

function createBookingController(bookingService) {
    async function create(req, res) {
        const booking = await bookingService.bookSlot(req.body || {})
        res.status(201).json(booking)
    }

    async function getOne(req, res) {
        const booking = await bookingService.getBooking(readId(req.params.id))
        res.json(booking)
    }

    async function cancel(req, res) {
        const booking = await bookingService.cancelBooking(readId(req.params.id))
        res.json(booking)
    }

    return { create, getOne, cancel }
}

module.exports = { createBookingController }