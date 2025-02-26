#!/bin/bash

# 检查并删除已存在的 stsource 目录
if [ -d "stsource" ]; then
    echo "正在删除已存在的 stsource 目录..."
    rm -rf stsource
fi

# 克隆 SillyTavern 仓库
echo "正在克隆 SillyTavern 仓库..."
git clone https://github.com/SillyTavern/SillyTavern.git stsource

if [ $? -ne 0 ]; then
    echo "克隆仓库失败"
    exit 1
fi

# 切换到指定的 commit
echo "正在切换到指定版本..."
cd stsource && git checkout 938c8a9a364919433ac1cb0e6d82710116dabf86

if [ $? -ne 0 ]; then
    echo "切换版本失败"
    cd ..
    exit 1
fi

cd ..

# 删除版本管理信息，避免冲突
rm -rf stsource/.git

# 复制修改过的文件
echo "正在应用自定义修改..."
cp -rf stsource-changed/* stsource/

if [ $? -ne 0 ]; then
    echo "应用修改失败"
    exit 1
fi

# 运行 npm
echo "初始化并启动服务"
cd stsource && npm install && cd ../cst && npm install && cd ../factory-api && npm install && npm run build && npm run start &
