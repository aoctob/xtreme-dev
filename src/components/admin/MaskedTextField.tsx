'use client'

import { TextInput, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { useCallback } from 'react'
import { maskAadhaar, maskPan } from '@/lib/validation'

type Mask = 'aadhaar' | 'pan' | 'phone'

const MASKS: Record<Mask, (v: string) => string> = {
  aadhaar: maskAadhaar,
  pan: maskPan,
  // Digits, spaces and a leading +, at most "+91 98765 43210".
  phone: (v) => v.replace(/[^\d+ ]/g, '').replace(/(?!^)\+/g, '').slice(0, 16),
}

/** Admin text field that applies the same input mask as the Register form. */
export function MaskedTextField(props: TextFieldClientProps & { mask: Mask }) {
  const { field, path: pathFromProps, readOnly, validate, mask } = props
  const { label, required, admin } = field
  const memoizedValidate = useCallback(
    (value: unknown, options: Record<string, unknown>) =>
      typeof validate === 'function' ? validate(value as string, { ...options, required } as never) : true,
    [validate, required],
  )
  const { value, setValue, showError, path, disabled, customComponents } = useField<string>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate as never,
  })
  return (
    <TextInput
      path={path}
      label={label}
      required={required}
      readOnly={readOnly || disabled}
      showError={showError}
      value={value ?? ''}
      placeholder={admin?.placeholder}
      description={admin?.description}
      Description={customComponents?.Description}
      Error={customComponents?.Error}
      Label={customComponents?.Label}
      style={admin?.width ? { flex: `0 1 ${admin.width}` } : undefined}
      htmlAttributes={{ autoComplete: 'off' }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(MASKS[mask](e.target.value))}
    />
  )
}
