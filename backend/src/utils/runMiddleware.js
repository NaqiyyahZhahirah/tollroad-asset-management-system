/**
 * Wraps an Express-style middleware (req, res, next) into a Promise
 * so it can be awaited inside a Vercel serverless function handler.
 *
 * Usage:
 *   await runMiddleware(req, res, verifyToken);
 *   if (res.headersSent) return; // middleware sudah kirim 401/403, stop di sini
 */
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

module.exports = runMiddleware;
