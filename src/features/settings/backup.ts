import type { ChangeEvent } from 'react';
import { exportAppData, restoreAppData } from '../../repositories/appDataRepository';

export async function exportBackup() {
  const data = await exportAppData();

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `smarttracker_backup_${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
}

export async function importBackupFromFile(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (loadEvent) => {
    try {
      const result = loadEvent.target?.result;
      if (typeof result !== 'string') return;

      const data = JSON.parse(result);
      await restoreAppData(data);

      alert('Data restored successfully!');
      window.location.reload();
    } catch {
      alert('Failed to import data. Invalid file format.');
    }
  };

  reader.readAsText(file);
}
