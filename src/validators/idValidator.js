const { ValidationError } = require('../errors')

function readId(value) {
    const id = Number(value)

    if (!Number.isInteger(id) || id < 1) {
        throw new ValidationError([{ field: 'id', message: 'Id must be a positive number' }])
    }

    return id
}

module.exports = { readId }