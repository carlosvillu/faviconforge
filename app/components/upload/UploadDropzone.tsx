import { useDropzone } from 'react-dropzone'
import { useImageUpload } from '~/hooks/useImageUpload'
import { DropzoneIdle } from './DropzoneIdle'
import { DropzoneSuccess } from './DropzoneSuccess'
import { DropzoneError } from './DropzoneError'
import { DropzoneValidating } from './DropzoneValidating'

export function UploadDropzone() {
  const {
    file,
    previewUrl,
    validationError,
    state,
    handleFileDrop,
    handleContinue,
    clearFile,
  } = useImageUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/*': [],
    },
    multiple: false,
  })

  // Determine background and border classes based on state
  const baseClasses = 'border-8 border-black p-12'
  const stateClasses =
    state === 'success'
      ? 'bg-green-200'
      : isDragActive
        ? 'bg-yellow-300 border-dashed'
        : 'bg-white'

  return (
    <div {...getRootProps()} className={`${baseClasses} ${stateClasses}`}>
      {state === 'validating' && <DropzoneValidating />}
      {state === 'error' && validationError && (
        <DropzoneError
          errorKey={validationError.errorKey}
          errorParams={validationError.errorParams}
          onTryAgain={clearFile}
        />
      )}
      {state === 'success' && file && previewUrl && (
        <DropzoneSuccess
          fileName={file.name}
          fileSize={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
          previewUrl={previewUrl}
          onContinue={handleContinue}
          onChooseDifferent={clearFile}
        />
      )}
      {(state === 'idle' || isDragActive) && (
        <DropzoneIdle isDragActive={isDragActive} />
      )}
      <input {...getInputProps()} />
    </div>
  )
}
