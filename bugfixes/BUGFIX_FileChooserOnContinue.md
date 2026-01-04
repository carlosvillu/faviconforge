# BUGFIX_FileChooserOnContinue.md

## 1. Bug Description

### Current Behavior (Bug)

When a user uploads a valid image and clicks the "Continue" button, the system file picker modal opens unexpectedly.

**Steps to reproduce:**
1. Navigate to `/upload`
2. Drop or select a valid image (e.g., 512x512 PNG)
3. Wait for validation to complete (success state shown)
4. Click "Continuar →" button
5. **Bug:** System file picker modal opens instead of just navigating to `/preview`

### Expected Behavior (After Fix)

After clicking "Continue", the app should:
1. Save the image to sessionStorage
2. Navigate to `/preview`
3. **NOT** open the file picker modal

## 2. Technical Analysis

### Conflicting Flow

1. `UploadDropzone.tsx` wraps the entire component with `{...getRootProps()}` from `react-dropzone`
2. `getRootProps()` attaches an `onClick` handler that opens the file picker
3. The "Continuar →" and "Elegir Otro" buttons are rendered INSIDE the dropzone div
4. When clicking any button, the event bubbles up to the parent div with `getRootProps()`
5. The dropzone's click handler fires, opening the file picker

### Root Cause

**OBVIOUS:** Event propagation. The buttons inside the dropzone do not stop event propagation, so clicks bubble up to the dropzone container which has `onClick` from `getRootProps()` that opens the file chooser.

**Location:** `app/components/upload/DropzoneSuccess.tsx` lines 43-54

## 3. Solution Plan

### `app/components/upload/DropzoneSuccess.tsx`

**Objective:** Stop event propagation on button clicks to prevent the dropzone from intercepting the click.

**Pseudocode:**
```pseudocode
BEFORE:
  Button onClick={onContinue}
  Button onClick={onChooseDifferent}

AFTER:
  Button onClick={(e) => { e.stopPropagation(); onContinue(); }}
  Button onClick={(e) => { e.stopPropagation(); onChooseDifferent(); }}
```

**Note:** The same fix should be applied to `DropzoneError.tsx` if it has interactive buttons inside the dropzone.

### `app/components/upload/DropzoneError.tsx`

**Objective:** Check if this component has buttons and apply the same fix if needed.

**Pseudocode:**
```pseudocode
IF button exists with onClick handler:
  Add e.stopPropagation() before calling the handler
```

## 4. Regression Tests (E2E Only)

### Test: Clicking "Continue" after upload does NOT open file picker

- **Preconditions:** User is on `/upload` page
- **Steps:**
  1. Upload a valid 512x512 image
  2. Wait for success state
  3. Click "Continuar →" button
  4. Check that no file chooser dialog appears
- **Expected:** Navigation occurs (or 404 since `/preview` doesn't exist yet), but NO file picker modal opens

### Test: Clicking "Choose Different" after upload does NOT open file picker twice

- **Preconditions:** User is on `/upload` page with a valid image uploaded
- **Steps:**
  1. Upload a valid 512x512 image
  2. Wait for success state
  3. Click "Elegir Otro" button
- **Expected:** State resets to idle, file picker opens ONCE (from the button action), not twice

## 5. Definition of Done

1. `npm run test:e2e -- --retries=1` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Manual verification: clicking "Continue" after upload does not trigger file picker
