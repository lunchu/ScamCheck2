import { useState, useRef } from 'react'
import { Upload, Camera, Trash2, Send } from 'lucide-react'
import { analyzeImage } from '../services/scamAnalyzer'

function ImageCheck({ onResult, onError, onLoadingChange, isLoading, apiConfig }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      onError('Please upload a JPG, PNG, WEBP, or GIF image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('Image must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result
      setPreview(base64)
      setImage({
        base64: base64.split(',')[1],
        mimeType: file.type
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          handleFile(file)
          break
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!image) {
      onError('Please upload an image first')
      return
    }

    if (!apiConfig?.apiKey) {
      onError('API key is required. Add VITE_ANTHROPIC_AUTH_TOKEN to your .env file.')
      return
    }

    onLoadingChange(true)

    try {
      const result = await analyzeImage(image.base64, image.mimeType, apiConfig)
      onResult(result)
    } catch (err) {
      onError(err.message)
    } finally {
      onLoadingChange(false)
    }
  }

  const handleClear = () => {
    setImage(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div onPaste={handlePaste}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload or paste a screenshot
      </label>

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop an image here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:underline font-medium"
            >
              browse files
            </button>
          </p>
          <p className="text-gray-400 text-sm">
            You can also paste from clipboard (Ctrl/Cmd + V)
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Supports JPG, PNG, WEBP, GIF • Max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-[400px] mx-auto rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {preview && (
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Analyze Image
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            <Camera className="w-4 h-4" />
            Choose Different Image
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageCheck
