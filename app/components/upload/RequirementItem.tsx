type RequirementItemProps = {
  text: string
}

export function RequirementItem({ text }: RequirementItemProps) {
  return (
    <li className="flex items-start gap-3 font-bold text-lg">
      <span className="text-2xl text-green-600">✓</span>
      <span>{text}</span>
    </li>
  )
}
