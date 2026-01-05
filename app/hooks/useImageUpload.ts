import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { validateImage } from '~/services/imageValidation'
import { useStorage } from '~/hooks/useStorage'

type UploadState = 'idle' | 'validating' | 'success' | 'error'

type ValidationError = {
  errorKey: string
  errorParams?: Record<string, string | number>
}

export function useImageUpload() {
  const navigate = useNavigate()
  const storage = useStorage()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<ValidationError | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleFileDrop = async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    // Reset state
    setIsValidating(true)
    setValidationError(null)
    setIsValid(false)

    // Validate the image
    const result = await validateImage(uploadedFile)

    if (result.valid) {
      // Create preview URL
      const url = URL.createObjectURL(uploadedFile)
      setFile(uploadedFile)
      setPreviewUrl(url)
      setIsValid(true)
    } else {
      // Set validation error
      setValidationError({
        errorKey: result.errorKey,
        errorParams: result.errorParams,
      })
    }

    setIsValidating(false)
  }

  const handleContinue = async () => {
    if (!file) return

    // Check storage is ready
    if (storage.state !== 'ready') {
      setValidationError({
        errorKey: 'storage_not_available',
      })
      return
    }

    setIsSaving(true)

    try {
      // Store Blob directly (no base64 conversion)
      await storage.setSourceImage(file, file.name, file.type)
      navigate('/preview')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'storage_error'
      setValidationError({
        errorKey: errorMessage === 'storage_quota_exceeded'
          ? 'storage_quota_exceeded'
          : 'storage_error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
    setValidationError(null)
    setIsValidating(false)
    setIsValid(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Compute current state
  const state: UploadState = isValidating
    ? 'validating'
    : validationError
      ? 'error'
      : isValid
        ? 'success'
        : 'idle'

  return {
    file,
    previewUrl,
    validationError,
    isValidating,
    isValid,
    isSaving,
    storageReady: storage.state === 'ready',
    state,
    handleFileDrop,
    handleContinue,
    clearFile,
  }
}
