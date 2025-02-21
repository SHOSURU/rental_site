const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Извлекаем токен из куков
    if (!token) {
        return res.redirect('profile/login'); // Если нет токена, перенаправляем на логин
    }
    
    try {
        const decoded = jwt.verify(token, 'secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('token'); // Если токен недействителен, очищаем куки
        return res.redirect('profile/login');
    }
};

module.exports = authMiddleware;
