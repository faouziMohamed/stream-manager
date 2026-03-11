'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useDefaultCurrency, useSetDefaultCurrency} from '@/lib/hooks/queries/use-settings.queries';

const currencySchema = z.object({
    currency: z.string().min(1, 'Devise requise').max(10),
});
type CurrencyForm = z.infer<typeof currencySchema>;

interface Props {
    defaultCurrency?: string;
}

export function SettingsEditor({defaultCurrency = 'MAD'}: Props) {
    const {data: currency} = useDefaultCurrency(defaultCurrency);
    const setCurrency = useSetDefaultCurrency();

    const form = useForm<CurrencyForm>({
        resolver: zodResolver(currencySchema),
        defaultValues: {currency: defaultCurrency},
    });

    const onSubmit = async (data: CurrencyForm) => {
        await setCurrency.mutateAsync(data.currency.toUpperCase());
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Paramètres généraux</h1>
                <p className="text-muted-foreground text-sm">Configuration générale de l&apos;application</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Devise par défaut</CardTitle>
                    <CardDescription>
                        Utilisée pour les nouvelles formules. Ne modifie pas les prix existants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label htmlFor="currency">Code devise</Label>
                            <Input
                                id="currency"
                                placeholder="MAD"
                                defaultValue={currency}
                                className="max-w-30 uppercase"
                                {...form.register('currency')}
                            />
                            {form.formState.errors.currency && (
                                <p className="text-xs text-destructive">{form.formState.errors.currency.message}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={setCurrency.isPending} className="cursor-pointer">
                            {setCurrency.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
