import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contactSchema, toCreateInquiryInput } from '@/app/(website)/contact/contact-form-utils';
import { createRichTextDocumentFromText } from '@/components/rich-text/rich-text-utils';

test('contactSchema accepts a rich text message with enough plain text', () => {
  const message = createRichTextDocumentFromText('Bonjour, je veux un abonnement familial.');

  const result = contactSchema.safeParse({
    name: 'Mina',
    email: 'mina@example.com',
    phone: '',
    message,
  });

  assert.equal(result.success, true);
});

test('contactSchema rejects rich text messages with too little plain text', () => {
  const result = contactSchema.safeParse({
    name: 'Mina',
    email: '',
    phone: '',
    message: createRichTextDocumentFromText('Salut'),
  });

  assert.equal(result.success, false);
});

test('toCreateInquiryInput keeps rich text JSON and normalizes empty contact fields', () => {
  const message = createRichTextDocumentFromText('Une demande complete pour le support.');
  const input = toCreateInquiryInput({
    name: 'Mina',
    email: '',
    phone: '',
    message,
  });

  assert.equal(input.email, null);
  assert.equal(input.phone, null);
  assert.deepEqual(input.message, message);
});
