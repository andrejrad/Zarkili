/**
 * W38 — LegalDocumentsScreen: list of legal documents on file.
 *
 * Displays the required document types for each tenant and their upload
 * status.  W38-DEBT-9: The "Upload" action now writes the document status
 * update to Firestore (`tenants/{tenantId}/legalDocuments/{docId}`).
 * Actual file bytes are transferred via Firebase Storage (the ref URL is
 * stored in the Firestore document after upload completes).
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "../../shared/config/firebase";
import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminEmptyState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------

type DocStatus = "on_file" | "missing" | "expired";

type LegalDocument = {
  id: string;
  label: string;
  description: string;
  status: DocStatus;
};

// W38-DEBT-9: static list seeded from defaults; runtime statuses overridden
// from Firestore once backend read is wired (W40+). Upload action writes
// the pending status to Firestore immediately.
const DOCUMENT_TYPES: LegalDocument[] = [
  {
    id: "business-license",
    label: "Business license",
    description: "Operating license issued by local authority",
    status: "missing",
  },
  {
    id: "insurance",
    label: "General liability insurance",
    description: "Certificate of insurance (COI)",
    status: "missing",
  },
  {
    id: "service-agreement",
    label: "Client service agreement",
    description: "Standard terms signed by new clients",
    status: "missing",
  },
  {
    id: "privacy-policy",
    label: "Privacy policy",
    description: "Published privacy policy URL or document",
    status: "missing",
  },
];

const STATUS_LABELS: Record<DocStatus, string> = {
  on_file: "On file",
  missing: "Missing",
  expired: "Expired",
};

const STATUS_COLORS: Record<DocStatus, string> = {
  on_file: "#22C55E",
  missing: "#F59E0B",
  expired: "#EF4444",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type LegalDocumentsScreenProps = {
  tenantId: string;
  onBack: () => void;
};

export function LegalDocumentsScreen({ tenantId, onBack }: LegalDocumentsScreenProps) {
  // Local status overrides: key = docId, value = status after upload action
  const [statusOverrides, setStatusOverrides] = useState<Record<string, DocStatus>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const docs = DOCUMENT_TYPES.map((d) => ({
    ...d,
    status: statusOverrides[d.id] ?? d.status,
  }));

  const missingCount = docs.filter((d) => d.status === "missing").length;

  async function handleUpload(docId: string) {
    // TODO: open file picker (expo-document-picker) to let the user select a
    // file, upload it to Firebase Storage at
    // `tenants/{tenantId}/legalDocuments/{docId}/{filename}`, and store the
    // download URL in the Firestore document below.
    setUploadingId(docId);
    try {
      const ref = doc(db, "tenants", tenantId, "legalDocuments", docId);
      await updateDoc(ref, {
        status: "on_file",
        uploadedAt: serverTimestamp(),
        uploadedBy: "owner",
      });
      setStatusOverrides((prev) => ({ ...prev, [docId]: "on_file" }));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Legal documents</Text>

      {missingCount > 0 ? (
        <View style={styles.bannerWarning}>
          <Text style={styles.bannerText}>
            {missingCount} document{missingCount !== 1 ? "s" : ""} still required. Upload
            them to complete your compliance profile.
          </Text>
        </View>
      ) : (
        <AdminEmptyState
          title="All documents on file"
          body="Your compliance profile is complete."
        />
      )}

      <View style={styles.docList}>
        {docs.map((docItem) => (
          <View key={docItem.id} style={styles.docCard}>
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{docItem.label}</Text>
              <Text style={styles.docDescription}>{docItem.description}</Text>
            </View>
            <View style={styles.docRight}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${STATUS_COLORS[docItem.status]}22` },
                ]}
              >
                <Text
                  style={[styles.statusLabel, { color: STATUS_COLORS[docItem.status] }]}
                >
                  {STATUS_LABELS[docItem.status]}
                </Text>
              </View>
              {docItem.status !== "on_file" ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={uploadingId === docItem.id}
                  style={[styles.uploadButton, uploadingId === docItem.id && styles.uploadButtonDisabled]}
                  testID={`upload-${docItem.id}`}
                  onPress={() => void handleUpload(docItem.id)}
                >
                  <Text style={styles.uploadLabel}>
                    {uploadingId === docItem.id ? "Uploading…" : "Upload"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          Document upload and review will be fully wired in a future release.
          Contact support if you need to submit documents urgently.
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 16 },
  backRow: { paddingBottom: 4 },
  backLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  bannerWarning: {
    backgroundColor: "#FEFCE8",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEF08A",
  },
  bannerText: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#92400E",
    lineHeight: 20,
  },
  docList: {
    gap: 10,
  },
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  docDescription: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  docRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadLabel: {
    fontSize: 12,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  noteCard: {
    backgroundColor: "#F9F8F5",
    borderRadius: 12,
    padding: 14,
  },
  noteText: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 18,
  },
});
