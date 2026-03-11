"use client"

import {useTheme} from "next-themes"
import {Toaster as Sonner, type ToasterProps} from "sonner"

const Toaster = ({...props}: ToasterProps) => {
    const {theme = "system"} = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            position="bottom-right"
            richColors
            closeButton
            expand={false}
            gap={8}
            toastOptions={{duration: 5000}}
            {...props}
        />
    )
}

export {Toaster}
