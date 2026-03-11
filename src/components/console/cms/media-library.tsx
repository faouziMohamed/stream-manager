'use client';

import {useCallback, useRef, useState} from 'react';
import {Loader2, RefreshCw, Trash2, UploadCloud, XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useQueryClient} from '@tanstack/react-query';
import {
    settingsKeys,
    useCloudinaryMedia,
    useDeleteFromCloudinary,
    useReplaceCloudinaryImage,
} from '@/lib/hooks/queries/use-settings.queries';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
import type {CloudinaryResourceDto} from '@/lib/graphql/operations/settings.operations';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Derive a human-readable section label from the sub-folder component. */
function sectionLabel(subFolder: string): string {
    const map: Record<string, string> = {
        logos: 'Logos services',
        avatars: 'Avatars',
        uploads: 'Uploads divers',
        tests: 'Images de test',
    };
    return map[subFolder] ?? `Dossier : ${subFolder}`;
}

/** Group resources by their immediate sub-folder (segment after the root folder). */
function groupBySubFolder(resources: CloudinaryResourceDto[], rootFolder: string) {
    const groups: Record<string, CloudinaryResourceDto[]> = {};
    for (const r of resources) {
        // publicId looks like: "streammanager/logos/netflix_123"
        // Strip root folder prefix to get the sub-path
        const withoutRoot = r.publicId.startsWith(rootFolder + '/')
            ? r.publicId.slice(rootFolder.length + 1)
            : r.publicId;
        // First segment is the sub-folder, or '_root_' if there is none
        const segment = withoutRoot.includes('/') ? withoutRoot.split('/')[0] : '_root_';
        if (!groups[segment]) groups[segment] = [];
        groups[segment].push(r);
    }
    return groups;
}

// ─── Single image card ────────────────────────────────────────────────────────

function MediaCard({
                       resource,
                       onDeleted,
                       onReplaced,
                   }: {
    resource: CloudinaryResourceDto;
    rootFolder?: string;
    onDeleted: (publicId: string) => void;
    onReplaced: (publicId: string, newUrl: string) => void;
}) {
    const deleteMutation = useDeleteFromCloudinary();
    const replaceMutation = useReplaceCloudinaryImage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [replacing, setReplacing] = useState(false);

    const readBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleReplaceFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setReplacing(true);
        try {
            const base64 = await readBase64(file);
            const result = await replaceMutation.mutateAsync({
                oldPublicId: resource.publicId,
                base64,
                filename: file.name,
            });
            if (result.success && result.url) {
                onReplaced(resource.publicId, result.url);
            }
        } finally {
            setReplacing(false);
        }
    }, [replaceMutation, resource.publicId, onReplaced]);

    const isPending = deleteMutation.isPending || replacing;

    return (
        <>
            <div className="group relative rounded-xl border bg-card overflow-hidden flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-square overflow-hidden bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={resource.url}
                        alt={resource.publicId}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Overlay on hover */}
                    <div
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={isPending}
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer gap-1.5 h-8 text-xs"
                        >
                            {replacing
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                : <UploadCloud className="h-3.5 w-3.5"/>}
                            Remplacer
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => setConfirmDelete(true)}
                            className="cursor-pointer gap-1.5 h-8 text-xs"
                        >
                            {deleteMutation.isPending
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                : <Trash2 className="h-3.5 w-3.5"/>}
                            Supprimer
                        </Button>
                    </div>
                </div>

                {/* Meta */}
                <div className="px-2 py-1.5 space-y-0.5">
                    <p className="text-xs font-medium truncate" title={resource.publicId}>
                        {resource.publicId.split('/').pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {resource.width}×{resource.height} · {formatBytes(resource.bytes)} · {resource.format.toUpperCase()}
                    </p>
                </div>

                {/* Hidden file input for replacement */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReplaceFile(f);
                        e.target.value = '';
                    }}
                />
            </div>

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Supprimer l'image"
                description="Cette action est irréversible. L'image sera définitivement supprimée de Cloudinary."
                onConfirm={async () => {
                    await deleteMutation.mutateAsync(resource.publicId);
                    setConfirmDelete(false);
                    onDeleted(resource.publicId);
                }}
                loading={deleteMutation.isPending}
            />
        </>
    );
}

// ─── Section (one sub-folder) ─────────────────────────────────────────────────

function MediaSection({
                          label,
                          resources,
                          onDeleted,
                          onReplaced,
                      }: {
    label: string;
    resources: CloudinaryResourceDto[];
    onDeleted: (publicId: string) => void;
    onReplaced: (publicId: string, newUrl: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{label}</h2>
                <Badge variant="secondary" className="text-xs">{resources.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {resources.map((r) => (
                    <MediaCard
                        key={r.publicId}
                        resource={r}
                        onDeleted={onDeleted}
                        onReplaced={onReplaced}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    rootFolder?: string;
}

export function MediaLibrary({rootFolder = 'streammanager'}: Props) {
    const qc = useQueryClient();
    const {data: resources = [], isLoading, isFetching, error} = useCloudinaryMedia(rootFolder);
    // Local state mirrors server data so we can remove/update items without a full refetch
    const [local, setLocal] = useState<CloudinaryResourceDto[] | null>(null);

    const displayed = local ?? resources;
    const groups = groupBySubFolder(displayed, rootFolder);

    // Sort sections: logos first, tests + root always last
    const sectionOrder = (key: string) => {
        if (key === 'logos') return '000_logos';
        if (key === 'avatars') return '001_avatars';
        if (key === '_root_') return 'zzz_root';
        if (key === 'tests') return 'zzz_tests';
        return `500_${key}`;
    };
    const sortedKeys = Object.keys(groups).sort((a, b) =>
        sectionOrder(a).localeCompare(sectionOrder(b))
    );

    const handleDeleted = (publicId: string) => {
        setLocal((prev) => (prev ?? resources).filter((r) => r.publicId !== publicId));
    };

    const handleReplaced = (oldPublicId: string, newUrl: string) => {
        setLocal((prev) =>
            (prev ?? resources).map((r) =>
                r.publicId === oldPublicId ? {...r, url: newUrl} : r
            )
        );
    };

    const refresh = () => {
        setLocal(null);
        qc.invalidateQueries({queryKey: settingsKeys.media(rootFolder)});
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Médiathèque</h1>
                    <p className="text-muted-foreground text-sm">
                        Images stockées sur Cloudinary dans le dossier <code
                        className="bg-muted px-1 rounded text-xs">{rootFolder}</code>.
                        Survolez une image pour la remplacer ou la supprimer.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={isFetching}
                    className="cursor-pointer gap-2 shrink-0"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}/>
                    Actualiser
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div
                    className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0"/>
                    <div className="space-y-0.5">
                        <p className="font-medium">Erreur lors du chargement des images Cloudinary</p>
                        <p className="opacity-80 font-mono text-xs break-all">{String(error)}</p>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                    <span>Chargement des images…</span>
                </div>
            )}

            {/* Empty */}
            {!isLoading && displayed.length === 0 && (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        Aucune image trouvée dans ce dossier Cloudinary.
                    </CardContent>
                </Card>
            )}

            {/* Sections */}
            {!isLoading && sortedKeys.map((key) => (
                <Card key={key}>
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base">
                            {key === '_root_' ? 'Racine du dossier' : sectionLabel(key)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <MediaSection
                            label=""
                            resources={groups[key]}
                            onDeleted={handleDeleted}
                            onReplaced={handleReplaced}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
