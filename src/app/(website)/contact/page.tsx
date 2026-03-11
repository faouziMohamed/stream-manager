"use client";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useState} from "react";
import {gqlRequest} from "@/lib/graphql/client";
import {clientLogger} from "@/lib/logger/client-logger";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

const logger = clientLogger("contact-page");
const SEND_INQUIRY = `
  mutation SendInquiry($input: CreateInquiryInput!) {
    createInquiry(input: $input)
  }
`;
const contactSchema = z.object({
    name: z.string().min(2, "Nom requis"),
    email: z.email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional(),
    message: z.string().min(10, "Message trop court (min. 10 caracteres)"),
});
type ContactForm = z.infer<typeof contactSchema>;
export default function ContactPage() {
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const {register, handleSubmit, formState: {errors, isSubmitting}} =
        useForm<ContactForm>({resolver: zodResolver(contactSchema)});
    const onSubmit = async (data: ContactForm) => {
        setServerError(null);
        try {
            await gqlRequest(SEND_INQUIRY, {
                input: {name: data.name, email: data.email || null, phone: data.phone || null, message: data.message},
            });
            setSent(true);
        } catch (err) {
            logger.error("Contact form submission failed", err);
            setServerError("Une erreur est survenue. Veuillez reessayer.");
        }
    };
    if (sent) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="text-5xl">&#x2705;</div>
                <h1 className="text-2xl font-bold">Message envoye !</h1>
                <p className="text-muted-foreground">Nous vous recontacterons rapidement.</p>
            </div>
        );
    }
    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Nous contacter</CardTitle>
                    <CardDescription>
                        Une question sur nos offres ? Remplissez ce formulaire et nous vous repondrons rapidement.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nom *</Label>
                            <Input id="name" placeholder="Votre nom"
                                   error={errors.name?.message} {...register("name")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="vous@exemple.com" {...register("email")} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Telephone</Label>
                                <Input id="phone" type="tel" placeholder="+212 6XX XXX XXX" {...register("phone")} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="message">Message *</Label>
                            <textarea
                                id="message"
                                rows={5}
                                placeholder="Decrivez votre besoin..."
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                {...register("message")}
                            />
                            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
