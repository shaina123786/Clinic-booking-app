const sqlite3 = require('sqlite3')
const schema = require('./schema')

function createDatabase(filePath) {
    const db = new sqlite3.Database(filePath)

    function run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (error) {
                if (error) return reject(error)
                resolve({ id: this.lastID, changes: this.changes })
            })
        })
    }

    function get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (error, row) => {
                if (error) return reject(error)
                resolve(row)
            })
        })
    }

    function all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (error, rows) => {
                if (error) return reject(error)
                resolve(rows)
            })
        })
    }

    function exec(sql) {
        return new Promise((resolve, reject) => {
            db.exec(sql, (error) => {
                if (error) return reject(error)
                resolve()
            })
        })
    }

    function close() {
        return new Promise((resolve, reject) => {
            db.close((error) => {
                if (error) return reject(error)
                resolve()
            })
        })
    }

    const ready = exec('PRAGMA foreign_keys = ON').then(() => exec(schema))

    return { run, get, all, exec, close, ready }
}

module.exports = { createDatabase }