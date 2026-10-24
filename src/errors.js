class AppError extends Error {
    constructor(statusCode, code, message, details = []) {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }
}

class ValidationError extends AppError {
    constructor(details) {
        super(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields', details)
    }
}

class NotFoundError extends AppError {
    constructor(message) {
        super(404, 'NOT_FOUND', message)
    }
}

class ConflictError extends AppError {
    constructor(code, message) {
        super(409, code, message)
    }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError }