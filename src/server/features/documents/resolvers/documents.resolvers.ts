import { validateInput } from '@/server/features/common/middleware/validate-input';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { generateDocumentInputSchema } from '@/server/features/documents/schemas/validators/documents.validators';
import { generateDocumentUseCase } from '@/server/features/documents/use-cases/generate-document.use-case';

export const documentsResolvers = {
  Mutation: {
    async generateDocument(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(generateDocumentInputSchema, args.input);
      const { bytes, filename } = await generateDocumentUseCase(input, context);

      return { base64: Buffer.from(bytes).toString('base64'), filename };
    },
  },
};

interface ResolverArgs<TInput> {
  input: TInput;
}
