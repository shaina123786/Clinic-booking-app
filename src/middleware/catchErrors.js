function catchErrors(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next)
    }
}

module.exports = { catchErrors }