const { AppError } = require('../errors')

function notFoundHandler(req, res) {
    res.status(404).json({
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `No route for ${req.method} ${req.originalUrl}`,
            details: []
        }
    })
}

function errorHandler(error, req, res, next) {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        })
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: {
                code: 'INVALID_JSON',
                message: 'Request body is not valid JSON',
                details: []
            }
        })
    }

    console.error(error)

    res.status(500).json({
        error: {
            code: 'SERVER_ERROR',
            message: 'Something went wrong on our side',
            details: []
        }
    })
}

module.exports = { notFoundHandler, errorHandler }