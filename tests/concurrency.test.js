const request = require('supertest')
const { setupApp, patientBody, createSlot } = require('./helpers')

describe('Double booking protection', () => {
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

    test('only one of 10 simultaneous requests wins', async () => {
        const slot = await createSlot(app)

        const requests = Array.from({ length: 10 }, (_, index) =>
            request(app)
                .post('/bookings')
                .send(
                    patientBody(slot.id, {
                        patientName: `Patient ${index + 1}`,
                        patientEmail: `patient${index + 1}@mail.com`
                    })
                )
        )

        const responses = await Promise.all(requests)

        const created = responses.filter((response) => response.status === 201)
        const rejected = responses.filter((response) => response.status === 409)

        expect(created).toHaveLength(1)
        expect(rejected).toHaveLength(9)
    })

    test('exactly one confirmed booking exists in the database', async () => {
        const slot = await createSlot(app)

        await Promise.all(
            Array.from({ length: 10 }, (_, index) =>
                request(app)
                    .post('/bookings')
                    .send(patientBody(slot.id, { patientEmail: `patient${index + 1}@mail.com` }))
            )
        )

        const rows = await db.all(
            `SELECT id FROM bookings WHERE slot_id = ? AND status = 'confirmed'`,
            [slot.id]
        )

        expect(rows).toHaveLength(1)
    })
})