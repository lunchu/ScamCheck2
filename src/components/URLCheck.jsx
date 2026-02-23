import { useState } from 'react'
import { Send, Trash2, ExternalLink } from 'lucide-react'
import { analyzeURL } from '../services/scamAnalyzer'

function URLCheck({ onResult, onError, onLoadingChange, isLoading, apiConfig }) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const validateURL = (value) => {
    if (!value) {
      setUrlError('')
      return false
    }

    try {
      // Add protocol if missing
      let testUrl = value
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        testUrl = 'https://' + value
      }
      new URL(testUrl)
      setUrlError('')
      return true
    } catch {
      setUrlError('Please enter a valid URL')
      return false
    }
  }

  const handleChange = (e) => {
    const value = e.target.value
    setUrl(value)
    if (value) {
      validateURL(value)
    } else {
      setUrlError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!url.trim()) {
      onError('Please enter a URL to analyze')
      return
    }

    if (!validateURL(url)) {
      onError('Please enter a valid URL')
      return
    }

    if (!apiConfig?.apiKey) {
      onError('Please enter your API credentials first.')
      return
    }

    // Add protocol if missing
    let fullUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url
    }

    onLoadingChange(true)

    try {
      const result = await analyzeURL(fullUrl, apiConfig)
      onResult(result)
    } catch (err) {
      onError(err.message)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setUrlError('')
  }

  const exampleScamURLs = [
    'amaz0n-secure-verify.com/account',
    'paypa1-support.xyz/login',
    'micr0soft-security-alert.click/verify'
  ]

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Enter a URL to check
      </label>
      <div className="relative">
        <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={url}
          onChange={handleChange}
          placeholder="example.com or https://example.com"
          className={`input-field pl-10 ${urlError ? 'border-red-300 focus:ring-red-500' : ''}`}
          disabled={isLoading}
        />
      </div>
      {urlError && (
        <p className="mt-1 text-sm text-red-600">{urlError}</p>
      )}

      <div className="mt-3">
        <p className="text-sm text-gray-500 mb-2">Try an example suspicious URL:</p>
        <div className="flex flex-wrap gap-2">
          {exampleScamURLs.map((exUrl) => (
            <button
              key={exUrl}
              type="button"
              onClick={() => {
                setUrl(exUrl)
                setUrlError('')
              }}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-mono"
            >
              {exUrl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={isLoading || !url.trim() || !!urlError}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Analyze URL
        </button>
        {url && (
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Note: We analyze the URL structure and patterns. We do not visit the actual website.
      </p>
    </form>
  )
}

export default URLCheck
