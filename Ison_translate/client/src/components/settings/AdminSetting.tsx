import {
  CheckCircle2,
  CircleMinus,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/Input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const LS_MODELS = 'admin.voiceLLM.models'

const LEGACY_KEYS = {
  provider: 'admin.voiceLLM.provider',
  model: 'admin.voiceLLM.model',
  baseUrl: 'admin.voiceLLM.baseUrl',
  apiKey: 'admin.voiceLLM.apiKey',
} as const

export type VoiceModel = {
  id: string
  name: string
  provider: string
  modelId: string
  baseUrl: string
  apiKey: string
  isDefault: boolean
}

const SEED_MODELS: VoiceModel[] = [
  {
    id: 'seed-openai-mini',
    name: 'OpenAI Mini TTS',
    provider: 'openai',
    modelId: 'gpt-4o-mini-tts',
    baseUrl: '',
    apiKey: '',
    isDefault: true,
  },
  {
    id: 'seed-openai-tts1',
    name: 'OpenAI TTS-1',
    provider: 'openai',
    modelId: 'tts-1',
    baseUrl: '',
    apiKey: '',
    isDefault: false,
  },
  {
    id: 'seed-azure-neural',
    name: 'Azure Neural Voice',
    provider: 'azure-openai',
    modelId: 'en-US-JennyNeural',
    baseUrl: '',
    apiKey: '',
    isDefault: false,
  },
  {
    id: 'seed-eleven',
    name: 'ElevenLabs Turbo',
    provider: 'elevenlabs',
    modelId: 'eleven_turbo_v2',
    baseUrl: '',
    apiKey: '',
    isDefault: false,
  },
]

function readLS(key: string, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function loadModels(): VoiceModel[] {
  try {
    const raw = localStorage.getItem(LS_MODELS)
    if (raw) {
      const parsed = JSON.parse(raw) as VoiceModel[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasDefault = parsed.some((m) => m.isDefault)
        if (!hasDefault) parsed[0] = { ...parsed[0], isDefault: true }
        return parsed
      }
    }
  } catch {
    /* fall through */
  }

  const provider = readLS(LEGACY_KEYS.provider, 'openai')
  const modelId = readLS(LEGACY_KEYS.model, 'gpt-4o-mini-tts')
  const baseUrl = readLS(LEGACY_KEYS.baseUrl)
  const apiKey = readLS(LEGACY_KEYS.apiKey)

  if (provider || modelId) {
    return [
      {
        id: 'legacy-primary',
        name: 'Primary voice model',
        provider: provider || 'openai',
        modelId: modelId || 'gpt-4o-mini-tts',
        baseUrl,
        apiKey,
        isDefault: true,
      },
      ...SEED_MODELS.filter((m) => m.id !== 'seed-openai-mini'),
    ]
  }

  return SEED_MODELS.map((m) => ({ ...m }))
}

function persistModels(models: VoiceModel[]) {
  localStorage.setItem(LS_MODELS, JSON.stringify(models))
  const defaultModel = models.find((m) => m.isDefault)
  if (defaultModel) {
    localStorage.setItem(LEGACY_KEYS.provider, defaultModel.provider)
    localStorage.setItem(LEGACY_KEYS.model, defaultModel.modelId)
    localStorage.setItem(LEGACY_KEYS.baseUrl, defaultModel.baseUrl)
    localStorage.setItem(LEGACY_KEYS.apiKey, defaultModel.apiKey)
  }
}

function newId() {
  return `model-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const menuItemClass =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-muted focus:bg-muted disabled:pointer-events-none disabled:opacity-50'

function ModelActionsMenu({
  model,
  isOnlyModel,
  onSetDefault,
  onEdit,
  onRemove,
  onDelete,
}: {
  model: VoiceModel
  isOnlyModel: boolean
  onSetDefault: () => void
  onEdit: () => void
  onRemove: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={`Actions for ${model.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={6} className="w-44 p-1">
          <button
            type="button"
            className={menuItemClass}
            disabled={model.isDefault}
            onClick={() => {
              onSetDefault()
              setOpen(false)
            }}
          >
            <Star className="size-3.5" />
            Set as default
          </button>
          <button
            type="button"
            className={menuItemClass}
            onClick={() => {
              onEdit()
              setOpen(false)
            }}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            className={menuItemClass}
            disabled={model.isDefault || isOnlyModel}
            onClick={() => {
              onRemove()
              setOpen(false)
            }}
          >
            <CircleMinus className="size-3.5" />
            Remove
          </button>
          <button
            type="button"
            className={cn(menuItemClass, 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10')}
            disabled={isOnlyModel}
            onClick={() => {
              setDeleteOpen(true)
              setOpen(false)
            }}
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              {model.isDefault
                ? `"${model.name}" is the default model. Choose another default before deleting it.`
                : `"${model.name}" will be removed permanently.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={model.isDefault}
              onClick={() => {
                onDelete()
                setDeleteOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type ModelFormState = {
  name: string
  provider: string
  modelId: string
  baseUrl: string
  apiKey: string
}

const emptyForm: ModelFormState = {
  name: '',
  provider: 'openai',
  modelId: '',
  baseUrl: '',
  apiKey: '',
}

function ModelFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initial: ModelFormState
  onSave: (values: ModelFormState) => void
}) {
  const [form, setForm] = useState(initial)

  useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
  }

  const canSave = form.name.trim() && form.provider.trim() && form.modelId.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="model-name">Display name</FieldLabel>
            <Input
              id="model-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="OpenAI Mini TTS"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="model-provider">Provider</FieldLabel>
              <Input
                id="model-provider"
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                placeholder="openai"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="model-id">Model ID</FieldLabel>
              <Input
                id="model-id"
                value={form.modelId}
                onChange={(e) => setForm((f) => ({ ...f, modelId: e.target.value }))}
                placeholder="gpt-4o-mini-tts"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="model-base-url">Base URL (optional)</FieldLabel>
            <Input
              id="model-base-url"
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              placeholder="https://api.example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="model-api-key">API key (optional)</FieldLabel>
            <Input
              id="model-api-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </Field>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              onSave({
                name: form.name.trim(),
                provider: form.provider.trim(),
                modelId: form.modelId.trim(),
                baseUrl: form.baseUrl.trim(),
                apiKey: form.apiKey,
              })
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminSetting() {
  const [models, setModels] = useState<VoiceModel[]>(() => loadModels())
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VoiceModel | null>(null)
  const [error, setError] = useState<string | null>(null)

  const defaultModel = useMemo(() => models.find((m) => m.isDefault), [models])

  const updateModels = useCallback((updater: (prev: VoiceModel[]) => VoiceModel[]) => {
    setModels((prev) => {
      const next = updater(prev)
      try {
        persistModels(next)
        setError(null)
      } catch {
        setError('Could not save models to local storage.')
      }
      return next
    })
  }, [])

  function setDefault(id: string) {
    updateModels((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    )
  }

  function addModel(values: ModelFormState) {
    updateModels((prev) => {
      const entry: VoiceModel = {
        id: newId(),
        ...values,
        isDefault: prev.length === 0,
      }
      return [...prev, entry]
    })
  }

  function saveEdit(values: ModelFormState) {
    if (!editTarget) return
    updateModels((prev) =>
      prev.map((m) => (m.id === editTarget.id ? { ...m, ...values } : m))
    )
    setEditTarget(null)
  }

  function removeModel(id: string) {
    updateModels((prev) => {
      const target = prev.find((m) => m.id === id)
      if (!target || target.isDefault || prev.length <= 1) return prev
      return prev.filter((m) => m.id !== id)
    })
  }

  function deleteModel(id: string) {
    updateModels((prev) => {
      const target = prev.find((m) => m.id === id)
      if (!target || prev.length <= 1 || target.isDefault) return prev
      return prev.filter((m) => m.id !== id)
    })
  }

  const editForm: ModelFormState = editTarget
    ? {
        name: editTarget.name,
        provider: editTarget.provider,
        modelId: editTarget.modelId,
        baseUrl: editTarget.baseUrl,
        apiKey: editTarget.apiKey,
      }
    : emptyForm

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Admin settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage voice synthesis models. The default model is used for TTS across the app.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-[18px]" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-base">Voice models</CardTitle>
              <CardDescription>
                {defaultModel
                  ? `Default: ${defaultModel.name} (${defaultModel.modelId})`
                  : 'No default model selected'}
              </CardDescription>
            </div>
          </div>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus data-icon="inline-start" />
            Add model
          </Button>
        </CardHeader>

        <CardContent className="px-0 pt-0">
          {error && (
            <p className="mx-4 mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-4 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="pl-4">
                    <div className="min-w-0">
                      <p className="font-medium leading-5">{model.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{model.modelId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{model.provider}</TableCell>
                  <TableCell>
                    {model.isDefault ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="size-3" />
                        Default
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ModelActionsMenu
                      model={model}
                      isOnlyModel={models.length <= 1}
                      onSetDefault={() => setDefault(model.id)}
                      onEdit={() => setEditTarget(model)}
                      onRemove={() => removeModel(model.id)}
                      onDelete={() => deleteModel(model.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ModelFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add voice model"
        description="Configure a new TTS provider and model identifier."
        initial={emptyForm}
        onSave={addModel}
      />

      <ModelFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        title="Edit voice model"
        description="Update provider settings for this model."
        initial={editForm}
        onSave={saveEdit}
      />
    </div>
  )
}
