const express = require('express')
const { catchErrors } = require('../middleware/catchErrors')

function createSlotRoutes(slotController) {
    const router = express.Router()

    router.post('/', catchErrors(slotController.create))
    router.get('/', catchErrors(slotController.list))
    router.get('/:id', catchErrors(slotController.getOne))
    router.delete('/:id', catchErrors(slotController.cancel))

    return router
}

module.exports = { createSlotRoutes }