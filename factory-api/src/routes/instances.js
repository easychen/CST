import express from 'express';
import { exec } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import fs from 'fs';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// 检查SSL证书是否存在并返回SSL参数
const getSSLParams = () => {
    const certPath = join(__dirname, '..', '..', 'certs', 'cert.pem');
    const keyPath = join(__dirname, '..', '..', 'certs', 'privkey.pem');
    let command = '';
    
    
    if (existsSync(certPath) && existsSync(keyPath)) {
        command = ` --ssl=true --certPath=${certPath} --keyPath=${keyPath}`;
    }
    return command;
};
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建新的游戏实例
router.post('/', async (req, res) => {
    try {
        const { port } = req.body;
        
        if (!port) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 设置数据目录为 user-data/port
        const dataDir = join(__dirname, '..', '..', '..', 'user-data', port.toString());
        const sourceDir = join(__dirname, '..', '..', '..', 'stsource');
        const instanceName = `st-instance-${port}`;

        // 检查实例是否已存在
        try {
            const { stdout } = await execAsync(`pm2 show ${instanceName} -s`);
            if (stdout.includes('online')) {
                return res.status(400).json({ error: '端口已被占用' });
            }
        } catch (error) {
            // 实例不存在，可以继续创建
        }

        const password = uuidv4();
        const sslParams = getSSLParams();

        // 使用 PM2 启动游戏实例
        const info1 = await execAsync(`cd ${sourceDir} && pm2 start server.js --name ${instanceName} -- --port ${port} --dataRoot ${dataDir} --listen true --listenAddressIPv4 0.0.0.0  --whitelistMode false --basicAuthMode true --basicAuthUserName ${instanceName} --basicAuthUserPassword ${password} --enableUserAccounts true --enableDiscreetLogin true --autorun false ${sslParams}`);

        // console.log(info1);

        // 获取实例信息
        const { stdout: info } = await execAsync(`pm2 show ${instanceName} -s`);
        const startTime = new Date();

        res.status(201).json({
            id: instanceName,
            port,
            dataDir,
            status: 'running',
            startTime,
            password
        });
    } catch (error) {
        console.error('创建实例失败:', error);
        res.status(500).json({ error: '创建实例失败' });
    }
});

// 获取所有游戏实例
router.get('/', async (req, res) => {
    try {
        const { stdout } = await execAsync('pm2 jlist -s');
        // console.log("stdout", stdout);
        const processes = JSON.parse(stdout);
        const instances = processes
            .filter(proc => proc.name.startsWith('st-instance-'))
            .map(proc => ({
                id: proc.name,
                port: parseInt(proc.name.split('-')[2]),
                status: proc.pm2_env.status,
                startTime: new Date(proc.pm2_env.pm_uptime)
            }));
        res.json(instances);
    } catch (error) {
        console.error('获取实例列表失败:', error);
        res.status(500).json({ error: '获取实例列表失败' });
    }
});

// 停止游戏实例
router.post('/:id/stop', async (req, res) => {
    try {
        const instanceName = req.params.id;

        // 检查实例是否存在并运行中
        try {
            const { stdout } = await execAsync(`pm2 show ${instanceName} -s`);
            if (!stdout.includes('online')) {
                return res.status(400).json({ error: '实例未在运行' });
            }
        } catch (error) {
            return res.status(404).json({ error: '实例不存在' });
        }

        // 停止实例
        await execAsync(`pm2 stop ${instanceName} -s`);

        res.json({ 
            id: instanceName,
            status: 'stopped',
            stopTime: new Date()
        });
    } catch (error) {
        console.error('停止实例失败:', error);
        res.status(500).json({ error: '停止实例失败' });
    }
});

router.post('/:id/reset-password', async (req, res) => {
    try {
        const instanceName = req.params.id;
        const port = parseInt(instanceName.split('-')[2]);
        const dataDir = join(__dirname, '..', '..', '..', 'user-data', port.toString());
        const sourceDir = join(__dirname, '..', '..', '..', 'stsource');
        const password = uuidv4();

        // 先停止实例
        await execAsync(`pm2 stop ${instanceName} -s`);

        const sslParams = getSSLParams();

        // 使用新密码重启游戏实例
        await execAsync(`cd ${sourceDir} && pm2 start server.js --name ${instanceName} -- --port ${port} --dataRoot ${dataDir} --listen true --listenAddressIPv4 0.0.0.0 --whitelistMode false --basicAuthMode true --basicAuthUserName ${instanceName} --basicAuthUserPassword ${password} --enableUserAccounts true --enableDiscreetLogin true --autorun false ${sslParams}`);

        res.json({
            id: instanceName,
            password
        });
    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ error: '重置密码失败' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const instanceName = req.params.id;
        const port = parseInt(instanceName.split('-')[2]);
        const dataDir = join(__dirname, '..', '..', '..', 'user-data', port.toString());

        // 删除PM2实例
        await execAsync(`pm2 delete ${instanceName} -s`);

        // 删除数据目录
        await execAsync(`rm -rf "${dataDir}"`);

        res.json({ message: '实例已删除' });
    } catch (error) {
        console.error('删除实例失败:', error);
        res.status(500).json({ error: '删除实例失败' });
    }
});



const unlinkAsync = promisify(fs.unlink);

router.get('/:id/backup', async (req, res) => {
    try {
        const instanceName = req.params.id;
        const port = parseInt(instanceName.split('-')[2]);
        const backupFileName = `${instanceName}-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        const backupFilePath = join('/tmp', backupFileName);
        const userDataPath = join(__dirname, '..', '..', '..', 'user-data', port.toString());

        // 创建写入流
        const output = fs.createWriteStream(backupFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 设置最大压缩级别
        });

        // 监听压缩完成事件
        const archivePromise = new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
        });

        // 将用户数据目录添加到压缩文件
        archive.directory(userDataPath, port.toString());

        // 设置响应头
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${backupFileName}`);

        // 完成压缩
        archive.pipe(output);
        await archive.finalize();
        await archivePromise;

        // 发送文件并在发送完成后删除
        res.download(backupFilePath, backupFileName, async (err) => {
            if (err) {
                console.error('下载备份文件失败:', err);
            }
            try {
                await unlinkAsync(backupFilePath);
            } catch (error) {
                console.error('删除临时备份文件失败:', error);
            }
        });
    } catch (error) {
        console.error('创建备份失败:', error);
        res.status(500).json({ error: '创建备份失败' });
    }
});

export default router;