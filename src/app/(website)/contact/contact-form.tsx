'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  contactSchema,
  toCreateInquiryInput,
  type ContactFormData,
} from '@/app/(website)/contact/contact-form-utils';
import { RichTextEditor } from '@/components/rich-text/rich-text-editor';
import { createRichTextDocumentFromText } from '@/components/rich-text/rich-text-utils';
import { gqlRequest } from '@/lib/graphql/client';
import { clientLogger } from '@/lib/logger/client-logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const logger = clientLogger('contact-page');
const SEND_INQUIRY = `
  mutation SendInquiry($input: CreateInquiryInput!) {
    createInquiry(input: $input)
  }
`;

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: createRichTextDocumentFromText(''),
    },
  });
  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);
    try {
      await gqlRequest(SEND_INQUIRY, {
        input: toCreateInquiryInput(data),
      });
      setSent(true);
    } catch (error) {
      logger.error('Contact form submission failed', error);
      setServerError('Une erreur est survenue. Veuillez réessayer.');
    }
  };
  if (sent) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
        <div className="text-5xl">&#x2705;</div>
        <h1 className="text-2xl font-bold">Message envoyé !</h1>
        <p className="text-muted-foreground">Nous vous recontacterons rapidement.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Nous contacter</CardTitle>
          <CardDescription>
            Une question sur nos offres ? Remplissez ce formulaire et nous vous répondrons
            rapidement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Votre nom"
                error={errors.name?.message}
                {...register('name')}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  {...register('email')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  {...register('phone')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message *</Label>
              <Controller
                control={control}
                name="message"
                render={({ field }) => (
                  <RichTextEditor
                    preset="internal"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Décrivez votre besoin..."
                    className={errors.message ? 'rich-text-invalid' : undefined}
                  />
                )}
              />
              {errors.message && (
                <p className="text-destructive text-xs">{errors.message.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
