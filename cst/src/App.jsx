import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'

function App() {
  const { t, i18n } = useTranslation()
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('adminKey') || '')
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('adminKey'))
  const [instances, setInstances] = useState([])
  const [error, setError] = useState('')
  const [port, setPort] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newInstancePassword, setNewInstancePassword] = useState('')
  const [newInstanceId, setNewInstanceId] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      fetchInstances()
    }
  }, [isLoggedIn])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const fetchInstances = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances?lang=${i18n.language}`, {
        headers: {
          'X-ST-Admin-Key': adminKey
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInstances(data)
      } else {
        setError(t('errors.fetchInstancesFailed'))
      }
    } catch (err) {
      setError(t('errors.serverConnectionFailed'))
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances?lang=${i18n.language}`, {
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
        setError(t('errors.adminKeyInvalid'))
      }
    } catch (err) {
      setError(t('errors.serverConnectionFailed'))
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
      alert(t('success.passwordCopied'))
    } catch (err) {
      alert(t('errors.copyFailed'))
    }
  }

  const handleDownloadPassword = () => {
    const element = document.createElement('a')
    const file = new Blob([`${t('username')}: ${newInstanceId} ${t('password')}: ${newInstancePassword}`], { type: 'text/plain' })
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('title')}</h2>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              {i18n.language === 'zh' ? 'English' : '中文'}
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('adminKey')}</label>
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
              {t('login')}
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
          <h1 className="text-3xl font-bold">{t('instanceManagement')}</h1>
          <div className="flex space-x-4">
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              {i18n.language === 'zh' ? 'English' : '中文'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {t('logout')}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('createNewInstance')}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setCreating(true)
              setError('')
              try {
                const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances?lang=${i18n.language}`, {
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
                  setError(errorData.message || t('errors.createInstanceFailed'))
                }
              } catch (err) {
                setError(t('errors.serverConnectionFailed'))
              } finally {
                setCreating(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('port')}</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={t('portPlaceholder')}
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
                {creating ? t('creating') : t('create')}
              </button>
            </form>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">{t('instanceList')}</h2>
            <div className="grid gap-4">
              {instances.map((instance) => (
                <div key={instance.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">ID: {instance.id}</h3>
                      <p className="text-sm text-gray-600">{t('port')}: {instance.port}</p>
                      <p className="text-sm text-gray-600">{t('status')}: {instance.status}</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${import.meta.env.VITE_API_URL||""}/api/instances/${instance.id}/backup?lang=${i18n.language}`, {
                              headers: {
                                'X-ST-Admin-Key': adminKey
                              }
                            });
                            if (!response.ok) {
                              throw new Error(t('errors.backupFailed'));
                            }
                            const contentDisposition = response.headers.get('content-disposition');
                            const fileName = contentDisposition
                              ? contentDisposition.split('filename=')[1]
                              : `${instance.id}-backup-${new Date().toISOString()}.zip`;
                            
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
                            setError(t('errors.backupFailed'));
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600 mr-2"
                      >
                        {t('backup')}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('confirmResetPassword'))) {
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
                                setError(t('errors.resetPasswordFailed'))
                              }
                            } catch (err) {
                              setError(t('errors.serverConnectionFailed'))
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 mr-2"
                      >
                        {t('resetPassword')}
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(t('confirmDelete'))) {
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
                                setError(t('errors.deleteInstanceFailed'))
                              }
                            } catch (err) {
                              setError(t('errors.serverConnectionFailed'))
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        {t('delete')}
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
            <h3 className="text-xl font-semibold mb-4">{t('instanceAccount')}</h3>
            <div className="text-gray-500 mb-1">{t('username')}</div>
            <p className="mb-4 p-2 bg-gray-100 rounded break-all">{newInstanceId}</p>
            <div className="text-gray-500 mb-1">{t('password')}</div>
            <p className="p-2 bg-gray-100 rounded break-all">{newInstancePassword}</p>
            <div className="text-sm my-2 rounded text-red-500">{t('passwordWarning')}</div>
            <div className="flex space-x-4">
              <button
                onClick={handleCopyPassword}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('copyPassword')}
              </button>
              <button
                onClick={handleDownloadPassword}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {t('saveAsTxt')}
              </button>
            </div>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
