import { memo } from 'react'

type PageHeaderProps = {
  title: string
  subtitle: string
}

function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <h2 className="text-3xl font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-2xl text-sm text-[var(--text-secondary)]">{subtitle}</p>
    </div>
  )
}

export default memo(PageHeader)
