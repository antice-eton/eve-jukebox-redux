const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
        .catch(next);
    };

function require_session_character_id(req, res, next) {
    if (!req.session.character_id) {
        res.status(403).json({
            status: 403,
            message: 'You must select an EVE character to continue'
        });
        next('route');
    } else {
        next();
    }
}

module.exports = {
    require_session_character_id,
    asyncMiddleware
}
