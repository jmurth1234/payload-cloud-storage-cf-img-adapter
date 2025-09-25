export function ensureErrorField(fields: any[], fieldName: string): void {
  if (!Array.isArray(fields)) return
  const exists = fields.some(field => {
    if (typeof field !== 'object' || !field) return false
    const name = (field as { name?: string }).name
    return name === fieldName
  })

  if (!exists) {
    fields.unshift({
      name: fieldName,
      type: 'text',
      label: 'Upload Error',
      admin: {
        readOnly: true,
        description: 'Set by cloud storage adapter when an upload fails.',
      },
    })
  }
}
