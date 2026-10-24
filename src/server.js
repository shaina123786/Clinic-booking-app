const { createDatabase } = require('./db/connection')
const { createApp } = require('./app')

const port = process.env.PORT || 3000

async function startServer() {
    const db = createDatabase('./booking.db')
    await db.ready

    const app = createApp(db)

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`)
    })
}

startServer()