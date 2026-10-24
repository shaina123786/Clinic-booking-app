const request = require('supertest')
const { setupApp, patientBody, createSlot } = require('./helpers')

describe('Bookings', () => {
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

    test('books an available slot', async () => {
        const slot = await createSlot(app)

        const response = await request(app).post('/bookings').send(patientBody(slot.id))

        expect(response.status).toBe(201)
        expect(response.body.status).toBe('confirmed')
        expect(response.body.patientName).toBe('Ravi Kumar')
    })

    test('slot shows as booked after booking', async () => {
        const slot = await createSlot(app)
        await request(app).post('/bookings').send(patientBody(slot.id))

        const response = await request(app).get(`/slots/${slot.id}`)

        expect(response.body.state).toBe('booked')
        expect(response.body.patientName).toBe('Ravi Kumar')
    })

    test('does not allow booking the same slot twice', async () => {
        const slot = await createSlot(app)
        await request(app).post('/bookings').send(patientBody(slot.id))

        const response = await request(app)
            .post('/bookings')
            .send(patientBody(slot.id, { patientName: 'Anita', patientEmail: 'anita@mail.com' }))

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('SLOT_ALREADY_BOOKED')
    })

    test('does not allow booking a cancelled slot', async () => {
        const slot = await createSlot(app)
        await request(app).delete(`/slots/${slot.id}`)

        const response = await request(app).post('/bookings').send(patientBody(slot.id))

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('SLOT_CANCELLED')
    })

    test('returns 404 when the slot does not exist', async () => {
        const response = await request(app).post('/bookings').send(patientBody(999))

        expect(response.status).toBe(404)
    })

    test('rejects invalid patient details', async () => {
        const slot = await createSlot(app)

        const response = await request(app)
            .post('/bookings')
            .send(patientBody(slot.id, { patientName: 'A', patientEmail: 'wrong' }))

        expect(response.status).toBe(400)
        expect(response.body.error.details).toHaveLength(2)
    })

    test('cancels a booking', async () => {
        const slot = await createSlot(app)
        const booking = await request(app).post('/bookings').send(patientBody(slot.id))

        const response = await request(app).delete(`/bookings/${booking.body.id}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('cancelled')
    })

    test('slot can be booked again after the booking is cancelled', async () => {
        const slot = await createSlot(app)
        const booking = await request(app).post('/bookings').send(patientBody(slot.id))
        await request(app).delete(`/bookings/${booking.body.id}`)

        const response = await request(app)
            .post('/bookings')
            .send(patientBody(slot.id, { patientName: 'Anita', patientEmail: 'anita@mail.com' }))

        expect(response.status).toBe(201)
    })

    test('cancelling an already cancelled booking gives 409', async () => {
        const slot = await createSlot(app)
        const booking = await request(app).post('/bookings').send(patientBody(slot.id))
        await request(app).delete(`/bookings/${booking.body.id}`)

        const response = await request(app).delete(`/bookings/${booking.body.id}`)

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('BOOKING_ALREADY_CANCELLED')
    })

    test('returns 404 for a booking that does not exist', async () => {
        const response = await request(app).delete('/bookings/999')

        expect(response.status).toBe(404)
    })
})