/**
 * EditProfileScreen.tsx — I.6 Edit Profile.
 *
 * Fields: avatar editor, display name, pronouns chip-row, bio (250 chars).
 * Email address and password reset sections rendered when handlers are provided.
 * States: default | dirty | saving | saved | validation-error | error.
 */

import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, colors, radius, spacing, textStyles } from "../../shared/ui";

export type EditProfileState = "default" | "dirty" | "saving" | "saved" | "error";

export type EditProfileScreenProps = {
  initialDisplayName: string;
  initialPronouns?: string;
  initialBio?: string;
  avatarUri?: string;
  onSave: (fields: {
    displayName: string;
    pronouns: string;
    bio: string;
  }) => Promise<void>;
  onChangeAvatar?: () => void;
  onBack?: () => void;
  testID?: string;
  // Profile save state (driven by shell; message props override fallback strings)
  profileSaving?: boolean;
  profileErrorMessage?: string | null;
  profileSuccessMessage?: string | null;
  // Email section — rendered only when onSaveEmail is provided
  initialEmail?: string;
  onSaveEmail?: (email: string) => Promise<void>;
  emailSaving?: boolean;
  emailErrorMessage?: string | null;
  emailSuccessMessage?: string | null;
  // Security section — rendered only when onSendPasswordReset is provided
  onSendPasswordReset?: () => Promise<void>;
  passwordResetSubmitting?: boolean;
  passwordResetErrorMessage?: string | null;
  passwordResetSuccessMessage?: string | null;
};

const BIO_MAX = 250;

const PRONOUN_OPTIONS = [
  "she/her",
  "he/him",
  "they/them",
  "she/they",
  "he/they",
  "prefer not to say",
];

export function EditProfileScreen({
  initialDisplayName,
  initialPronouns = "",
  initialBio = "",
  avatarUri,
  onSave,
  onChangeAvatar,
  onBack: _onBack,
  testID,
  profileSaving,
  profileErrorMessage,
  profileSuccessMessage,
  initialEmail,
  onSaveEmail,
  emailSaving,
  emailErrorMessage,
  emailSuccessMessage,
  onSendPasswordReset,
  passwordResetSubmitting,
  passwordResetErrorMessage,
  passwordResetSuccessMessage,
}: EditProfileScreenProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pronouns, setPronouns] = useState(initialPronouns);
  const [bio, setBio] = useState(initialBio);
  const [screenState, setScreenState] = useState<EditProfileState>("default");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emailInput, setEmailInput] = useState(initialEmail ?? "");
  const isEmailDirty = emailInput !== (initialEmail ?? "");

  const isDirty =
    displayName !== initialDisplayName ||
    pronouns !== initialPronouns ||
    bio !== initialBio;

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function handleBioChange(value: string) {
    setBio(value.slice(0, BIO_MAX));
    setScreenState("dirty");
  }

  function handleNameChange(value: string) {
    setDisplayName(value);
    setDisplayNameError(null);
    setScreenState("dirty");
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setDisplayNameError("Display name is required.");
      return;
    }
    setScreenState("saving");
    try {
      await onSave({ displayName, pronouns, bio });
      setScreenState("saved");
      toastTimer.current = setTimeout(() => setScreenState("default"), 2000);
    } catch {
      setScreenState("error");
    }
  }

  async function handleEmailSave() {
    if (!onSaveEmail) return;
    try {
      await onSaveEmail(emailInput.trim());
    } catch {
      // Error state is managed via emailErrorMessage prop
    }
  }

  async function handlePasswordReset() {
    if (!onSendPasswordReset) return;
    try {
      await onSendPasswordReset();
    } catch {
      // Error state is managed via passwordResetErrorMessage prop
    }
  }

  return (
    <KeyboardAvoidingView style={styles.kvContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable
          onPress={onChangeAvatar}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          testID={testID ? `${testID}-avatar` : undefined}
        >
          <View style={styles.avatarWrap}>
            {avatarUri ? (

              <View style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>
                  {displayName.trim().charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>{"📷"}</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {screenState === "error" ? (
        <Banner
          variant="error"
          message={profileErrorMessage ?? "Failed to save. Please try again."}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {screenState === "saved" ? (
        <Banner
          variant="success"
          message={profileSuccessMessage ?? "Profile saved."}
          testID={testID ? `${testID}-saved-banner` : undefined}
        />
      ) : null}

      <View style={styles.formCard}>
        <InputField
          label="Display name"
          value={displayName}
          onChangeText={handleNameChange}
          error={displayNameError ?? undefined}
          testID={testID ? `${testID}-name` : undefined}
        />
      </View>

      {/* Pronouns chip row */}
      <View>
        <Text style={styles.fieldLabel}>Pronouns (optional)</Text>
        <View style={styles.chipRow}>
          {PRONOUN_OPTIONS.map((p) => (
            <Pressable
              key={p}
              style={[styles.chip, pronouns === p ? styles.chipSelected : null]}
              onPress={() => {
                setPronouns(pronouns === p ? "" : p);
                setScreenState("dirty");
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: pronouns === p }}
              testID={testID ? `${testID}-pronoun-${p.replace(/\//g, "-")}` : undefined}
            >
              <Text
                style={[
                  styles.chipLabel,
                  pronouns === p ? styles.chipLabelSelected : null,
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formCard}>
        <View>
          <InputField
            label="Bio"
            value={bio}
            onChangeText={handleBioChange}
            placeholder="Tell the community a bit about yourself"
            maxLength={BIO_MAX}
            testID={testID ? `${testID}-bio` : undefined}
          />
          <Text style={styles.charCount}>
            {bio.length}/{BIO_MAX}
          </Text>
        </View>
      </View>

      <Button
        label={screenState === "saving" ? "Saving..." : "Save"}
        variant="primary"
        disabled={!isDirty || screenState === "saving" || profileSaving}
        loading={screenState === "saving" || profileSaving}
        onPress={handleSave}
        testID={testID ? `${testID}-save` : undefined}
      />

      {onSaveEmail != null ? (
        <View>
          <Text style={styles.sectionHeading}>Email address</Text>
          <View style={styles.formCard}>
            <InputField
              label="Email"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              testID={testID ? `${testID}-email` : undefined}
            />
          </View>
          {emailErrorMessage ? (
            <Banner
              variant="error"
              message={emailErrorMessage}
              testID={testID ? `${testID}-email-error-banner` : undefined}
            />
          ) : null}
          {emailSuccessMessage ? (
            <Banner
              variant="success"
              message={emailSuccessMessage}
              testID={testID ? `${testID}-email-success-banner` : undefined}
            />
          ) : null}
          <Button
            label={emailSaving ? "Saving..." : "Save email"}
            variant="secondary"
            disabled={!isEmailDirty || emailSaving}
            loading={emailSaving}
            onPress={handleEmailSave}
            testID={testID ? `${testID}-email-save` : undefined}
          />
        </View>
      ) : null}

      {onSendPasswordReset != null ? (
        <View>
          <Text style={styles.sectionHeading}>Security</Text>
          {passwordResetErrorMessage ? (
            <Banner
              variant="error"
              message={passwordResetErrorMessage}
              testID={testID ? `${testID}-password-reset-error-banner` : undefined}
            />
          ) : null}
          {passwordResetSuccessMessage ? (
            <Banner
              variant="success"
              message={passwordResetSuccessMessage}
              testID={testID ? `${testID}-password-reset-success-banner` : undefined}
            />
          ) : null}
          <Button
            label={passwordResetSubmitting ? "Sending..." : "Send password reset email"}
            variant="secondary"
            disabled={passwordResetSubmitting}
            loading={passwordResetSubmitting}
            onPress={handlePasswordReset}
            testID={testID ? `${testID}-password-reset` : undefined}
          />
        </View>
      ) : null}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kvContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s5,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.s4,
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    ...textStyles.heading2,
    color: colors.white,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    fontSize: 14,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.foreground,
    marginBottom: spacing.s2,
  },
  sectionHeading: {
    ...textStyles.label,
    color: colors.foreground,
    marginBottom: spacing.s2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...textStyles.bodySmall,
    color: colors.foreground,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  charCount: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.s1,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
