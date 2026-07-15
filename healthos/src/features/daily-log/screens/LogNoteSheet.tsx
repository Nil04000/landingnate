import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { SheetScaffold } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useDayEntries } from '@/queries/useDay';

export default function LogNoteSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const { data: entries } = useDayEntries(dayDate);

  // El editor se monta recién cuando hay datos: el prefill entra como estado
  // inicial y nunca pisa lo que se está tipeando.
  if (!entries) return <SheetScaffold title="Nota del día">{null}</SheetScaffold>;

  return <NoteEditor dayDate={dayDate} initialContent={entries.note?.content ?? ''} />;
}

function NoteEditor({ dayDate, initialContent }: { dayDate: string; initialContent: string }) {
  const [content, setContent] = useState(initialContent);

  const mutation = useLogMutation((args: { dayDate: string; content: string }) =>
    repos.wellbeing.upsertNote(args.dayDate, args.content),
  );

  const trimmed = content.trim();

  const save = () => {
    if (!trimmed) return;
    mutation.mutate({ dayDate, content: trimmed }, { onSuccess: () => router.back() });
  };

  return (
    <SheetScaffold
      title="Nota del día"
      onSave={save}
      saveDisabled={trimmed === '' || trimmed === initialContent}
    >
      <TextInput
        value={content}
        onChangeText={setContent}
        multiline
        placeholder="¿Cómo fue tu día?"
        placeholderTextColor={palette.text.tertiary}
        textAlignVertical="top"
        className="min-h-[160px] rounded-card bg-surface-2 p-4 text-body text-txt"
      />
    </SheetScaffold>
  );
}
