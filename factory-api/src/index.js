import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import instancesRouter from './routes/instances.js';
import { verifyAdminKey } from './middleware/auth.js';
import fs from 'fs';
import https from 'https';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 中间件配置
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
const frontendDistPath = join(__dirname, '..', '..', 'cst', 'dist');
if (!fs.existsSync(frontendDistPath)) {
    app.use('/', (req, res) => {
        res.json({ message: 'CST API Server is ON 🍷' });
    });
} else {
    app.use(express.static(frontendDistPath));
}

// 注册路由
app.use('/api/instances', verifyAdminKey, instancesRouter);

// 基础路由
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 检查SSL证书文件
const certPath = join(__dirname, '..', 'certs', 'cert.pem');
const keyPath = join(__dirname, '..', 'certs', 'privkey.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    // 启动HTTPS服务器
    const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`CST API server is running on port ${port} (HTTPS)`);
    });
} else {
    // 启动HTTP服务器
    app.listen(port, () => {
        console.log(`CST API server is running on port ${port} (HTTP)`);
    });
}