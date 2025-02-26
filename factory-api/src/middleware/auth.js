// 验证管理员密钥的中间件
export const verifyAdminKey = (req, res, next) => {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.headers['x-st-admin-key'];

    if (!adminKey) {
        return res.status(500).json({ error: '服务器未配置管理员密钥' });
    }

    if (!providedKey) {
        return res.status(401).json({ error: '缺少管理员密钥' });
    }

    if (providedKey !== adminKey) {
        return res.status(401).json({ error: '管理员密钥无效' });
    }

    next();
};