import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { db } from '@/core/db/client';
import { Card, PressableScale, PrimaryButton, Screen, Section } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { todayLocal } from '@/core/lib/dates';
import { repos } from '@/queries/repos';

import { buildExport } from '../export';

/** Datos: export JSON completo (backup) + reconstrucción de agregados. */
export default function DataScreen() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);

  const exportData = async () => {
    try {
      setStatus('Armando export…');
      const payload = buildExport(db);
      const rows = Object.values(payload.tables).reduce((s, t) => s + t.length, 0);
      const file = new File(Paths.cache, `healthos-export-${todayLocal()}.json`);
      if (file.exists) file.delete();
      file.write(JSON.stringify(payload, null, 2));
      setStatus(`${rows.toLocaleString('es-AR')} filas exportadas`);
      haptic.logged();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      } else {
        setStatus(`Guardado en ${file.uri}`);
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      haptic.warn();
    }
  };

  const rebuildAggregates = () => {
    setStatus('Reconstruyendo…');
    const rows = repos.aggregates.getRange('2000-01-01', todayLocal());
    for (const row of rows) repos.aggregates.rebuildDay(row.dayDate);
    void queryClient.invalidateQueries();
    haptic.logged();
    setStatus(`${rows.length} días reconstruidos`);
  };

  return (
    <Screen>
      <View className="mb-5 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">Datos</Text>
      </View>

      <Section title="Backup">
        <Card>
          <Text className="mb-3 text-subhead leading-5 text-txt-dim">
            Exporta TODO (registros, comidas, entrenamientos, labs, score) como JSON. Es tu backup:
            guardalo donde quieras — los datos nunca salen del dispositivo por su cuenta.
          </Text>
          <PrimaryButton label="Exportar todo (JSON)" onPress={() => void exportData()} />
        </Card>
      </Section>

      <Section title="Mantenimiento">
        <Card>
          <Text className="mb-3 text-subhead leading-5 text-txt-dim">
            Los agregados diarios son 100% derivados y siempre reconstruibles. Si algo se ve
            inconsistente, esto lo recalcula todo desde las tablas fuente.
          </Text>
          <PrimaryButton label="Reconstruir agregados" variant="tonal" onPress={rebuildAggregates} />
        </Card>
      </Section>

      {status ? <Text className="px-1 text-center text-footnote text-txt-dim">{status}</Text> : null}
    </Screen>
  );
}
