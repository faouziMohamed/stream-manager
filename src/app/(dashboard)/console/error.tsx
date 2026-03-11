"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientLogger } from "@/lib/logger/client-logger";

const logger = clientLogger("console-error-boundary");

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Console page error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center border-destructive/30">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle>Une erreur est survenue</CardTitle>
          <CardDescription>
            {error.message ||
              "Impossible de charger cette page. Veuillez réessayer."}
          </CardDescription>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-1">
              Code : {error.digest}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
