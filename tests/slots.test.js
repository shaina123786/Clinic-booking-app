const request = require('supertest')
const { setupApp, slotBody, patientBody, createSlot } = require('./helpers')

describe('Slots', () => {
    let app
    let db

    beforeEach(async () => {
        const setup = await setupApp()
        app = setup.app
        db = setup.db
    })

    afterEach(async () => {
        await db.close()
    })

    test('creates a slot', async () => {
        const response = await request(app).post('/slots').send(slotBody())

        expect(response.status).toBe(201)
        expect(response.body.state).toBe('available')
        expect(response.body.clinicName).toBe('City Care Clinic')
    })

    test('rejects a slot when end time is before start time', async () => {
        const response = await request(app)
            .post('/slots')
            .send(slotBody({ startTime: '11:00', endTime: '10:00' }))

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    test('rejects a slot in the past', async () => {
        const response = await request(app)
            .post('/slots')
            .send(slotBody({ slotDate: '2020-01-01' }))

        expect(response.status).toBe(400)
    })

    test('rejects missing fields with helpful details', async () => {
        const response = await request(app).post('/slots').send({})

        expect(response.status).toBe(400)
        expect(response.body.error.details.length).toBeGreaterThan(0)
    })

    test('rejects overlapping slots in the same clinic', async () => {
        await createSlot(app)

        const response = await request(app)
            .post('/slots')
            .send(slotBody({ startTime: '10:15', endTime: '10:45' }))

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('SLOT_OVERLAPS')
    })

    test('lists slots', async () => {
        await createSlot(app)
        await createSlot(app, { startTime: '11:00', endTime: '11:30' })

        const response = await request(app).get('/slots')

        expect(response.status).toBe(200)
        expect(response.body).toHaveLength(2)
    })

    test('filters slots by state', async () => {
        const first = await createSlot(app)
        await createSlot(app, { startTime: '11:00', endTime: '11:30' })
        await request(app).post('/bookings').send(patientBody(first.id))

        const response = await request(app).get('/slots?state=available')

        expect(response.body).toHaveLength(1)
        expect(response.body[0].startTime).toBe('11:00')
    })

    test('cancels a slot', async () => {
        const slot = await createSlot(app)

        const response = await request(app).delete(`/slots/${slot.id}`)

        expect(response.status).toBe(200)
        expect(response.body.state).toBe('cancelled')
    })

    test('cancelling a slot also cancels its booking', async () => {
        const slot = await createSlot(app)
        const booking = await request(app).post('/bookings').send(patientBody(slot.id))

        await request(app).delete(`/slots/${slot.id}`)
        const bookingAfter = await request(app).get(`/bookings/${booking.body.id}`)

        expect(bookingAfter.body.status).toBe('cancelled')
    })

    test('returns 404 for a slot that does not exist', async () => {
        const response = await request(app).delete('/slots/999')

        expect(response.status).toBe(404)
    })

    test('returns 400 for a bad slot id', async () => {
        const response = await request(app).delete('/slots/abc')

        expect(response.status).toBe(400)
    })
})