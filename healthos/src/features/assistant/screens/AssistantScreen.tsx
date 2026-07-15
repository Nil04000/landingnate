import { router, type Href } from 'expo-router';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '@/core/db/client';
import { Chip, PressableScale } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { durations } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';
import { LocalAssistantProvider, type AssistantAnswer } from '../engine/provider';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  links?: [string, string][];
};

const SUGGESTIONS = [
  '¿Por qué duermo peor?',
  '¿Qué cambió este mes?',
  '¿Qué micronutrientes me faltan?',
  '¿Cómo vengo hoy?',
  '¿Cuándo estuve mejor?',
  '¿Qué hábitos empeoraron?',
];

/**
 * Asistente: preguntas sobre TUS datos respondidas 100% en el dispositivo
 * (matcher de intents + herramientas estadísticas — sin nube, sin API).
 */
export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const provider = useMemo(() => new LocalAssistantProvider(db), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    haptic.select();
    setInput('');

    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text: trimmed };
    let answer: AssistantAnswer;
    try {
      answer = provider.answer(trimmed);
    } catch {
      answer = { text: 'Algo falló analizando tus datos. Probá de nuevo.', links: [] };
    }
    const assistantMessage: ChatMessage = {
      id: nextId.current++,
      role: 'assistant',
      text: answer.text,
      links: answer.links,
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="px-5 pb-4"
        contentContainerStyle={{ paddingTop: insets.top + 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-5 mt-2">
          <Text className="text-title1 text-txt">Asistente</Text>
          <Text className="mt-0.5 text-footnote text-txt-dim">
            Respuestas desde tus datos, 100% en tu dispositivo
          </Text>
        </View>

        {messages.length === 0 ? (
          <View className="mt-6 items-center">
            <Sparkles color={palette.text.tertiary} size={28} strokeWidth={1.5} />
            <Text className="mb-5 mt-3 text-center text-subhead text-txt-dim">
              Preguntame sobre tu sueño, nutrición, entrenamiento o cualquier patrón de tus datos.
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} onPress={() => ask(s)} />
              ))}
            </View>
          </View>
        ) : (
          <View className="gap-3">
            {messages.map((message) => (
              <Animated.View
                key={message.id}
                entering={FadeInDown.duration(durations.fast)}
                className={message.role === 'user' ? 'items-end' : 'items-start'}
              >
                <View
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] rounded-card rounded-br-md bg-tint px-4 py-2.5'
                      : 'max-w-[92%] rounded-card rounded-bl-md border border-stroke bg-surface px-4 py-3'
                  }
                >
                  <Text
                    className={
                      message.role === 'user' ? 'text-body text-white' : 'text-subhead leading-5 text-txt'
                    }
                  >
                    {message.text}
                  </Text>
                  {message.links && message.links.length > 0 ? (
                    <View className="mt-2.5 flex-row flex-wrap gap-2">
                      {message.links.map(([label, href]) => (
                        <PressableScale
                          key={href}
                          onPress={() => {
                            haptic.select();
                            router.push(href as Href);
                          }}
                        >
                          <Text className="overflow-hidden rounded-chip bg-tint/15 px-2.5 py-1 text-footnote text-tint">
                            {label} →
                          </Text>
                        </PressableScale>
                      ))}
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            ))}
            <View className="mt-1 flex-row flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <Chip key={s} label={s} onPress={() => ask(s)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="flex-row items-center gap-2 border-t border-stroke bg-canvas px-4 pt-2"
        style={{ paddingBottom: insets.bottom + 56 }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => ask(input)}
          placeholder="Preguntá sobre tus datos…"
          placeholderTextColor={palette.text.tertiary}
          returnKeyType="send"
          className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-body text-txt"
        />
        <PressableScale onPress={() => ask(input)}>
          <View
            className={`h-10 w-10 items-center justify-center rounded-full ${input.trim() ? 'bg-tint' : 'bg-surface-2'}`}
          >
            <ArrowUp color={input.trim() ? '#FFFFFF' : palette.text.tertiary} size={20} strokeWidth={2.2} />
          </View>
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}
