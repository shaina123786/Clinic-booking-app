const path = require('path')
const express = require('express')
const cors = require('cors')
const { createSlotService } = require('./services/slotService')
const { createBookingService } = require('./services/bookingService')
const { createSlotController } = require('./controllers/slotController')
const { createBookingController } = require('./controllers/bookingController')
const { createSlotRoutes } = require('./routes/slotRoutes')
const { createBookingRoutes } = require('./routes/bookingRoutes')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')

function createApp(db) {
    const app = express()

    const slotService = createSlotService(db)
    const bookingService = createBookingService(db)

    app.use(cors())
    app.use(express.json())
    app.use(express.static(path.join(__dirname, '..', 'public')))

    app.use('/slots', createSlotRoutes(createSlotController(slotService)))
    app.use('/bookings', createBookingRoutes(createBookingController(bookingService)))

    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}

module.exports = { createApp }