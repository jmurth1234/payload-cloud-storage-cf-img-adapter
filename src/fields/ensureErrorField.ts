export function ensureErrorField(fields: any[], fieldName: string): void {
  const exists = Array.isArray(fields)
    && fields.some((f: any) => typeof f === 'object' && 'name' in f && (f as any).name === fieldName)
  if (!exists) {
    fields.unshift({
      name: fieldName,
      type: 'text',
      label: 'Upload Error',
      admin: { readOnly: true, description: 'Set by cloud storage adapter when an upload fails.' },
    })
  }
}


