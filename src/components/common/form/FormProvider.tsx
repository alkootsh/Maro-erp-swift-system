import React from 'react';
import { FormProvider as RHFFormProvider, UseFormReturn, FieldErrors } from 'react-hook-form';

interface FormProviderProps {
  methods: UseFormReturn<any>;
  onSubmit: (data: any) => void | Promise<void>;
  onError?: (errors: FieldErrors) => void;
  className?: string;
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({
  methods,
  onSubmit,
  onError,
  className = '',
  children
}) => {
  return (
    <RHFFormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit(onSubmit, onError)}
        className={className}
      >
        {children}
      </form>
    </RHFFormProvider>
  );
};
