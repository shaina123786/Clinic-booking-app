const express = require('express')
const { catchErrors } = require('../middleware/catchErrors')

function createBookingRoutes(bookingController) {
    const router = express.Router()

    router.post('/', catchErrors(bookingController.create))
    router.get('/:id', catchErrors(bookingController.getOne))
    router.delete('/:id', catchErrors(bookingController.cancel))

    return router
}

module.exports = { createBookingRoutes }