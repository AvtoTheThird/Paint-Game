const adminAuth = (req, res, next) => {
    const { password } = req.query;
    
    // In production, use environment variables for the secret password
    const ADMIN_PASSWORD = '123456';
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
};

module.exports = { adminAuth };
