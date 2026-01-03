import { createContext, useContext, useState, type ReactNode } from 'react'

type StepInfo = {
  current: number
  total: number
  label: string
}

type HeaderStepContextType = {
  step: StepInfo | null
  setStep: (step: StepInfo | null) => void
}

const HeaderStepContext = createContext<HeaderStepContextType | undefined>(
  undefined
)

export function HeaderStepProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<StepInfo | null>(null)

  return (
    <HeaderStepContext.Provider value={{ step, setStep }}>
      {children}
    </HeaderStepContext.Provider>
  )
}

export function useHeaderStep() {
  const context = useContext(HeaderStepContext)
  if (context === undefined) {
    throw new Error('useHeaderStep must be used within a HeaderStepProvider')
  }
  return context
}
