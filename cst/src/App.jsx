import { useState, useEffect } from 'react'

function App() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('adminKey') || '')
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('adminKey'))
  const [instances, setInstances] = useState([])
  const [error, setError] = useState('')
  const [port, setPort] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newInstancePassword, setNewInstancePassword] = useState('')
  const [newInstanceId, setNewInstanceId] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchInstances();
    }
  }, [isLoggedIn]);

  const fetchInstances = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances`, {
        headers: {
          'X-ST-Admin-Key': adminKey
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInstances(data)
      } else {
        setError('获取实例列表失败')
      }
    } catch (err) {
      setError('连接服务器失败')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances`, {
        headers: {
          'X-ST-Admin-Key': adminKey
        }
      })
      if (response.ok) {
        localStorage.setItem('adminKey', adminKey)
        setIsLoggedIn(true)
        setError('')
        const data = await response.json()
        setInstances(data)
      } else {
        setError('管理员密钥验证失败')
      }
    } catch (err) {
      setError('连接服务器失败')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminKey')
    setIsLoggedIn(false)
    setInstances([])
    setAdminKey('')
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newInstancePassword)
      alert('密码已复制到剪贴板')
    } catch (err) {
      alert('复制失败，请手动复制')
    }
  }

  const handleDownloadPassword = () => {
    const element = document.createElement('a')
    const file = new Blob([`用户名：${newInstanceId} 密码：${newInstancePassword}`], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${newInstanceId}-account-CST.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">🍷 CST联锁酒馆管理系统</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">管理员密钥</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">酒馆实例管理</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            退出登录
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          
          <div>
            <h2 className="text-xl font-semibold mb-4">创建新实例</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setCreating(true)
              setError('')
              try {
                const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-ST-Admin-Key': adminKey
                  },
                  body: JSON.stringify({ port: parseInt(port) })
                })
                if (response.ok) {
                  const newInstance = await response.json()
                  setInstances([...instances, newInstance])
                  setPort('')
                  setNewInstancePassword(newInstance.password)
                  setNewInstanceId(newInstance.id)
                  setShowPasswordModal(true)
                } else {
                  const errorData = await response.json()
                  setError(errorData.message || '创建实例失败, 请检查端口是否被占用')
                }
              } catch (err) {
                setError('连接服务器失败')
              } finally {
                setCreating(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">端口号</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="请输入端口号（如：8001）"
                  required
                  min="1024"
                  max="65535"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {creating ? '创建中...' : '创建实例'}
              </button>
            </form>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">实例列表</h2>
            <div className="grid gap-4">
              {instances.map((instance) => (
                <div key={instance.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">ID: {instance.id}</h3>
                      <p className="text-sm text-gray-600">端口: {instance.port}</p>
                      <p className="text-sm text-gray-600">状态: {instance.status}</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances/${instance.id}/backup`, {
                              headers: {
                                'X-ST-Admin-Key': adminKey
                              }
                            });
                            if (!response.ok) {
                              throw new Error('备份失败');
                            }
                            // 获取文件名
                            const contentDisposition = response.headers.get('content-disposition');
                            const fileName = contentDisposition
                              ? contentDisposition.split('filename=')[1]
                              : `${instance.id}-backup-${new Date().toISOString()}.zip`;
                            
                            // 创建blob并下载
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (err) {
                            setError('备份失败');
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600 mr-2"
                      >
                        备份
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('确定要重置此实例的密码吗？')) {
                            try {
                              const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances/${instance.id}/reset-password`, {
                                method: 'POST',
                                headers: {
                                  'X-ST-Admin-Key': adminKey
                                }
                              })
                              if (response.ok) {
                                const data = await response.json()
                                setNewInstancePassword(data.password)
                                setNewInstanceId(data.id)
                                setShowPasswordModal(true)
                              } else {
                                setError('重置密码失败')
                              }
                            } catch (err) {
                              setError('连接服务器失败')
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 mr-2"
                      >
                        重置密码
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('确定要删除此实例吗？此操作不可恢复。建议删除前先进行备份。')) {
                            try {
                              const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances/${instance.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'X-ST-Admin-Key': adminKey
                                }
                              })
                              if (response.ok) {
                                setInstances(instances.filter(inst => inst.id !== instance.id))
                              } else {
                                setError('删除实例失败')
                              }
                            } catch (err) {
                              setError('连接服务器失败')
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">实例账号</h3>
            <div className="text-gray-500 mb-1">用户名</div>
            <p className="mb-4 p-2 bg-gray-100 rounded break-all">{newInstanceId}</p>
            <div className="text-gray-500 mb-1">密码</div>
            <p className="p-2 bg-gray-100 rounded break-all">{newInstancePassword}</p>
            <div className="text-sm my-2 rounded text-red-500 ">此密码只显示一次，请妥善保管</div>
            <div className="flex space-x-4">
              <button
                onClick={handleCopyPassword}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                复制密码
              </button>
              <button
                onClick={handleDownloadPassword}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                保存为txt
              </button>
            </div>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
