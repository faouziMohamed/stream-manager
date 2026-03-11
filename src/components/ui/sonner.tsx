"use client"

import {useTheme} from "next-themes"
import {Toaster as Sonner, type ToasterProps} from "sonner"
import {CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon,} from "lucide-react"

const Toaster = ({...props}: ToasterProps) => {
    const {theme = "system"} = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            position="bottom-right"
            expand={false}
            richColors={false}
            gap={8}
            toastOptions={{
                duration: 5000,
                classNames: {
                    toast: [
                        "group/toast",
                        "flex items-start gap-3 w-full",
                        "rounded-lg border px-4 py-3 shadow-lg",
                        "bg-popover text-popover-foreground border-border",
                        "text-sm font-medium",
                        "data-[type=error]:border-destructive/40 data-[type=error]:bg-destructive/5",
                        "data-[type=success]:border-primary/30 data-[type=success]:bg-primary/5",
                        "data-[type=warning]:border-orange-400/30 data-[type=warning]:bg-orange-400/5",
                        "data-[type=info]:border-blue-400/30 data-[type=info]:bg-blue-400/5",
                    ].join(' '),
                    title: "text-sm font-semibold leading-snug",
                    description: "text-xs text-muted-foreground mt-0.5 font-normal",
                    icon: [
                        "shrink-0 mt-0.5",
                        "group-data-[type=error]/toast:text-destructive",
                        "group-data-[type=success]/toast:text-primary",
                        "group-data-[type=warning]/toast:text-orange-500",
                        "group-data-[type=info]/toast:text-blue-500",
                    ].join(' '),
                    closeButton: [
                        "absolute top-2.5 right-2.5 rounded-md p-0.5",
                        "text-muted-foreground hover:text-foreground",
                        "opacity-0 group-hover/toast:opacity-100 transition-opacity",
                    ].join(' '),
                    actionButton: "text-xs font-semibold text-primary underline-offset-2 hover:underline",
                    cancelButton: "text-xs text-muted-foreground",
                },
            }}
            icons={{
                success: <CircleCheckIcon className="size-4"/>,
                info: <InfoIcon className="size-4"/>,
                warning: <TriangleAlertIcon className="size-4"/>,
                error: <OctagonXIcon className="size-4"/>,
                loading: <Loader2Icon className="size-4 animate-spin"/>,
            }}
            {...props}
        />
    )
}

export {Toaster}
