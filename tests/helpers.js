const request = require('supertest')
const { createDatabase } = require('../src/db/connection')
const { createApp } = require('../src/app')

async function setupApp() {
    const db = createDatabase(':memory:')
    await db.ready
    const app = createApp(db)
    return { app, db }
}

function futureDate() {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().slice(0, 10)
}

function slotBody(overrides = {}) {
    return {
        clinicName: 'City Care Clinic',
        slotDate: futureDate(),
        startTime: '10:00',
        endTime: '10:30',
        ...overrides
    }
}

function patientBody(slotId, overrides = {}) {
    return {
        slotId: slotId,
        patientName: 'Ravi Kumar',
        patientEmail: 'ravi@mail.com',
        ...overrides
    }
}

async function createSlot(app, overrides = {}) {
    const response = await request(app).post('/slots').send(slotBody(overrides))
    return response.body
}

module.exports = { setupApp, slotBody, patientBody, createSlot }