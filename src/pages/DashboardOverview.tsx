import { useDashboardData } from '@/hooks/useDashboardData';
import type { AbcEingabe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AbcEingabeDialog } from '@/components/dialogs/AbcEingabeDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconSearch, IconPencil, IconTrash, IconUser,
  IconCalendar, IconFileText, IconUsers,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a0207f98ca86dab1b54fde8';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const { abcEingabe, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AbcEingabe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AbcEingabe | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return abcEingabe;
    return abcEingabe.filter((r) => {
      const { vorname, nachname, beschreibung } = r.fields;
      return (
        (vorname ?? '').toLowerCase().includes(q) ||
        (nachname ?? '').toLowerCase().includes(q) ||
        (beschreibung ?? '').toLowerCase().includes(q)
      );
    });
  }, [abcEingabe, search]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return abcEingabe.filter((r) => {
      if (!r.fields.datum) return false;
      const d = new Date(r.fields.datum);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [abcEingabe]);

  const withDescription = useMemo(
    () => abcEingabe.filter((r) => !!r.fields.beschreibung).length,
    [abcEingabe]
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreate = async (fields: AbcEingabe['fields']) => {
    await LivingAppsService.createAbcEingabeEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: AbcEingabe['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateAbcEingabeEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteAbcEingabeEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const openEdit = (r: AbcEingabe) => {
    setEditRecord(r);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditRecord(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Einträge gesamt"
          value={String(abcEingabe.length)}
          description="Alle Einträge"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diesen Monat"
          value={String(thisMonth)}
          description="Neue Einträge"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Beschreibung"
          value={String(withDescription)}
          description="Einträge mit Notiz"
          icon={<IconFileText size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Name oder Beschreibung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <IconPlus size={16} className="mr-2 shrink-0" />
          Neuer Eintrag
        </Button>
      </div>

      {/* Entry Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <IconUser size={28} className="text-muted-foreground" stroke={1.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {search ? 'Keine Ergebnisse' : 'Noch keine Einträge'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? 'Versuche einen anderen Suchbegriff.'
                : 'Lege den ersten Eintrag an, um zu starten.'}
            </p>
          </div>
          {!search && (
            <Button onClick={openCreate}>
              <IconPlus size={16} className="mr-2" />
              Ersten Eintrag anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <EntryCard
              key={r.record_id}
              record={r}
              onEdit={() => openEdit(r)}
              onDelete={() => setDeleteTarget(r)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AbcEingabeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['AbcEingabe']}
        enablePhotoLocation={AI_PHOTO_LOCATION['AbcEingabe']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`Soll der Eintrag von "${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EntryCard({
  record,
  onEdit,
  onDelete,
}: {
  record: AbcEingabe;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { vorname, nachname, beschreibung, datum } = record.fields;
  const initials =
    ((vorname?.[0] ?? '') + (nachname?.[0] ?? '')).toUpperCase() || '?';

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {[vorname, nachname].filter(Boolean).join(' ') || '—'}
          </p>
          {datum && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <IconCalendar size={12} className="shrink-0" />
              {formatDate(datum)}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {beschreibung && (
        <div className="px-4 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3">{beschreibung}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto border-t border-border px-4 py-2 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
          aria-label="Bearbeiten"
        >
          <IconPencil size={15} className="shrink-0" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive"
          aria-label="Löschen"
        >
          <IconTrash size={15} className="shrink-0" />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-md" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
