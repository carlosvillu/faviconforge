export function CheckIcon() {
  return (
    <div className="w-32 h-32 mx-auto border-8 border-black bg-white flex items-center justify-center">
      <svg
        className="w-16 h-16 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  )
}
