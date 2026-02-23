import { useState, useEffect } from 'react'
import { Shield, FileText, Image, Link, AlertTriangle, Key, X } from 'lucide-react'
import TextCheck from './components/TextCheck'
import ImageCheck from './components/ImageCheck'
import URLCheck from './components/URLCheck'
import ResultsDisplay from './components/ResultsDisplay'

const tabs = [
  { id: 'text', label: 'Text', icon: FileText, description: 'Check messages, emails, SMS' },
  { id: 'image', label: 'Image', icon: Image, description: 'Analyze screenshots, photos' },
  { id: 'url', label: 'URL', icon: Link, description: 'Verify websites, links' },
]

function App() {
  const [activeTab, setActiveTab] = useState('text')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userApiKey, setUserApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('anthropic_auth_token')
    if (savedKey) {
      setUserApiKey(savedKey)
    }
  }, [])

  const handleResult = (data) => {
    setResult(data)
    setError(null)
  }

  const handleError = (err) => {
    setError(err)
    setResult(null)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  const handleSaveApiKey = () => {
    if (userApiKey.trim()) {
      localStorage.setItem('anthropic_auth_token', userApiKey.trim())
      setShowApiKeyInput(false)
    }
  }

  const handleClearApiKey = () => {
    localStorage.removeItem('anthropic_auth_token')
    setUserApiKey('')
  }

  // Use env variable first, then user-provided key
  const apiConfig = {
    apiKey: import.meta.env.VITE_ANTHROPIC_AUTH_TOKEN || userApiKey,
    baseUrl: import.meta.env.VITE_ANTHROPIC_BASE_URL
  }
  const isConfigured = !!apiConfig.apiKey

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scam Check</h1>
                <p className="text-sm text-gray-500">AI-powered scam detection</p>
              </div>
            </div>
            {isConfigured && (
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="API Key Settings"
              >
                <Key className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* API Key Input */}
        {(!isConfigured || showApiKeyInput) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-amber-800">
                    {isConfigured ? 'API Key Settings' : 'API Key Required'}
                  </p>
                  {showApiKeyInput && isConfigured && (
                    <button
                      onClick={() => setShowApiKeyInput(false)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-amber-700 mt-1 mb-3">
                  Enter your Anthropic API key to use the scam checker.
                  Get one at{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900"
                  >
                    Anthropic Console
                  </a>
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!userApiKey.trim()}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  {isConfigured && (
                    <button
                      onClick={handleClearApiKey}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Your key is stored locally in your browser only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="card mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    handleReset()
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Input Section */}
        <div className="card mb-6">
          {activeTab === 'text' && (
            <TextCheck
              onResult={handleResult}
              onError={handleError}
              onLoadingChange={setIsLoading}
              isLoading={isLoading}
              apiConfig={apiConfig}
            />
          )}
          {activeTab === 'image' && (
            <ImageCheck
              onResult={handleResult}
              onError={handleError}
              onLoadingChange={setIsLoading}
              isLoading={isLoading}
              apiConfig={apiConfig}
            />
          )}
          {activeTab === 'url' && (
            <URLCheck
              onResult={handleResult}
              onError={handleError}
              onLoadingChange={setIsLoading}
              isLoading={isLoading}
              apiConfig={apiConfig}
            />
          )}
        </div>

        {/* Results Section */}
        {(result || error || isLoading) && (
          <div className="card">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Analyzing for scam indicators...</p>
                <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            ) : result ? (
              <ResultsDisplay result={result} onReset={handleReset} />
            ) : null}
          </div>
        )}

        {/* Tips Section */}
        {!result && !isLoading && !error && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3">Tips for staying safe</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Never share passwords, PINs, or verification codes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Be suspicious of urgent requests or threats
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Verify sender identity through official channels
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Check URLs carefully for typos or unusual domains
              </li>
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>This tool provides guidance only and should not be relied upon as definitive.</p>
          <p className="mt-1">Always verify suspicious content through official channels.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
