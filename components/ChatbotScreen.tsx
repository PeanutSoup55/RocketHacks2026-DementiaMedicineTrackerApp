import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "../constants/theme";
import { sendChatMessage } from "../services/api";

interface Props {
  patientId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your Scheduling Assistant. 🌿\n\nI can help with medication timing — for example, working around physical therapy, meal times, or other appointments.\n\nPlease note: I cannot give medical advice, change prescriptions, or recommend medications. For any medical concerns, please contact the doctor or nurse directly.",
  ts: new Date(),
};

const QUICK_PROMPTS = [
  "Is there a conflict with 10am physical therapy?",
  "Which medications should be taken with food?",
  "Can the evening doses be moved earlier?",
  "Map out the full schedule for today",
];

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function ChatbotScreen({ patientId }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages]);

  const send = async (text?: string) => {
    const body = (text ?? input).trim();
    if (!body || loading) return;

    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: body, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const { reply } = await sendChatMessage({ message: body, conversationHistory: history, patientId });

      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: "assistant", content: reply, ts: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't connect right now. Please try again in a moment.",
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showQuickPrompts = messages.length <= 2;

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Text style={styles.botEmoji}>🤖</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Scheduling Assistant</Text>
          <Text style={styles.headerSub}>Timing help only — not medical advice</Text>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTxt}>
          ℹ️  For medical concerns, contact the doctor or nurse directly.
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgList}
        contentContainerStyle={styles.msgContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubbleWrap, msg.role === "user" ? styles.userWrap : styles.asstWrap]}
          >
            {msg.role === "assistant" && (
              <View style={styles.miniAvatar}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            )}
            <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.asstBubble]}>
              <Text style={[styles.bubbleTxt, msg.role === "user" ? styles.userTxt : styles.asstTxt]}>
                {msg.content}
              </Text>
              <Text style={[styles.ts, msg.role === "user" ? styles.userTs : styles.asstTs]}>
                {fmtTime(msg.ts)}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubbleWrap, styles.asstWrap]}>
            <View style={styles.miniAvatar}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <View style={[styles.bubble, styles.asstBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingTxt}>Thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      {showQuickPrompts && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {QUICK_PROMPTS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.chip}
              onPress={() => send(p)}
              accessibilityLabel={p}
            >
              <Text style={styles.chipTxt}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about scheduling…"
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendBtnTxt}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  botAvatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  botEmoji: { fontSize: 28 },
  headerTitle: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSub: { fontSize: Typography.bodyS, color: Colors.textMuted },

  disclaimer: {
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + "40",
  },
  disclaimerTxt: { fontSize: Typography.bodyM, color: Colors.warning, lineHeight: Typography.bodyM * 1.5 },

  msgList: { flex: 1 },
  msgContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  bubbleWrap: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-end" },
  userWrap: { justifyContent: "flex-end" },
  asstWrap: { justifyContent: "flex-start" },

  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 4,
  },
  bubble: { maxWidth: "78%", borderRadius: Radius.lg, padding: Spacing.md },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  asstBubble: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, ...Shadow.card },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.md },

  bubbleTxt: { fontSize: Typography.bodyL, lineHeight: Typography.bodyL * 1.6 },
  userTxt: { color: Colors.textOnDark },
  asstTxt: { color: Colors.textPrimary },

  ts: { fontSize: Typography.tiny, marginTop: Spacing.xs },
  userTs: { color: Colors.textOnDark + "90", textAlign: "right" },
  asstTs: { color: Colors.textMuted },

  typingTxt: { fontSize: Typography.bodyM, color: Colors.textMuted, fontStyle: "italic" },

  chipsScroll: { maxHeight: 58, flexShrink: 0 },
  chipsContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.primary + "14",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    minHeight: 42,
    justifyContent: "center",
  },
  chipTxt: { fontSize: Typography.bodyM, color: Colors.primary, fontWeight: Typography.semibold },

  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.bodyL,
    color: Colors.textPrimary,
    minHeight: MinTouchTarget,
    maxHeight: 120,
    backgroundColor: Colors.background,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: MinTouchTarget,
    justifyContent: "center",
    ...Shadow.card,
  },
  sendBtnOff: { backgroundColor: Colors.textMuted },
  sendBtnTxt: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textOnDark },
});