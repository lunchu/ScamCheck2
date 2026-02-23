import { useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { analyzeText } from '../services/scamAnalyzer'

function TextCheck({ onResult, onError, onLoadingChange, isLoading, apiConfig }) {
  const [text, setText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!text.trim()) {
      onError('Please enter some text to analyze')
      return
    }

    if (!apiConfig?.apiKey) {
      onError('Please enter your API credentials first.')
      return
    }

    onLoadingChange(true)

    try {
      const result = await analyzeText(text, apiConfig)
      onResult(result)
    } catch (err) {
      onError(err.message)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleClear = () => {
    setText('')
  }

  const exampleScam = `URGENT: Your bank account has been compromised!

We detected suspicious activity on your account ending in ****1234. To prevent unauthorized access, you must verify your identity immediately.

Click here to verify: http://secure-bankverify.com/login

If you don't respond within 24 hours, your account will be permanently locked.

Bank Security Team`

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Paste suspicious text, message, or email
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the suspicious message here..."
        className="input-field min-h-[200px] resize-y font-mono text-sm"
        disabled={isLoading}
        maxLength={5000}
      />
      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
        <span>{text.length}/5000 characters</span>
        <button
          type="button"
          onClick={() => setText(exampleScam)}
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          Load example scam
        </button>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Analyze Text
        </button>
        {text && (
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
    </form>
  )
}

export default TextCheck
