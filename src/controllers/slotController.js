const { readId } = require('../validators/idValidator')

function createSlotController(slotService) {
    async function create(req, res) {
        const slot = await slotService.createSlot(req.body || {})
        res.status(201).json(slot)
    }

    async function list(req, res) {
        const slots = await slotService.listSlots({
            clinicName: req.query.clinicName,
            date: req.query.date,
            state: req.query.state
        })
        res.json(slots)
    }

    async function getOne(req, res) {
        const slot = await slotService.getSlot(readId(req.params.id))
        res.json(slot)
    }

    async function cancel(req, res) {
        const slot = await slotService.cancelSlot(readId(req.params.id))
        res.json(slot)
    }

    return { create, list, getOne, cancel }
}

module.exports = { createSlotController }