'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';

/**
 * Hook wrapper pour react-hook-form avec validation Zod
 *
 * @example
 * ```tsx
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 *
 * const form = useZodForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' }
 * });
 * ```
 */
export function useZodForm<
  TFieldValues extends FieldValues,
>(
  props: Omit<UseFormProps<TFieldValues>, 'resolver'> & {
    schema: unknown;
  }
): UseFormReturn<TFieldValues> {
  const { schema, ...formProps } = props;

  return useForm<TFieldValues>({
    ...formProps,
    resolver: zodResolver(schema as never) as unknown as Resolver<TFieldValues>,
  });
}
