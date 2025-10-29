module.exports = (err, req, res, next) => {
    console.error(err);
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Error');
    res.status(err.status || 500).json({ error: message });
};
