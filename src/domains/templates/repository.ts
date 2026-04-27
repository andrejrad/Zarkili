/**
 * Templates repository
 *
 * Collection: tenants/{tenantId}/templates/{templateId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  TemplateError,
  renderTemplate,
  type Template,
  type TemplateChannel,
  type RenderedTemplate,
} from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type TemplateRepository = {
  createTemplate(draft: Omit<Template, "templateId" | "createdAt" | "updatedAt">): Promise<Template>;
  getTemplate(tenantId: string, templateId: string): Promise<Template | null>;
  updateTemplate(tenantId: string, templateId: string, updates: Partial<Pick<Template, "name" | "subject" | "body" | "variables">>): Promise<void>;
  deleteTemplate(tenantId: string, templateId: string): Promise<void>;
  getDefaultTemplates(tenantId: string, channel?: TemplateChannel): Promise<Template[]>;
  previewTemplate(tenantId: string, templateId: string, sampleVariables: Record<string, string>): Promise<RenderedTemplate>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTemplateRepository(db: Firestore): TemplateRepository {
  function templateCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/templates`);
  }

  function templateRef(tenantId: string, templateId: string) {
    return doc(db, `tenants/${tenantId}/templates`, templateId);
  }

  async function createTemplate(
    draft: Omit<Template, "templateId" | "createdAt" | "updatedAt">,
  ): Promise<Template> {
    if (!draft.tenantId) throw new TemplateError("TENANT_REQUIRED", "tenantId is required");

    const templateId = `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const template: Template = {
      ...draft,
      templateId,
      createdAt: serverTimestamp() as never,
      updatedAt: serverTimestamp() as never,
    };

    await setDoc(templateRef(draft.tenantId, templateId), template);
    return template;
  }

  async function getTemplate(tenantId: string, templateId: string): Promise<Template | null> {
    const snap = await getDoc(templateRef(tenantId, templateId));
    if (!snap.exists()) return null;
    return snap.data() as Template;
  }

  async function updateTemplate(
    tenantId: string,
    templateId: string,
    updates: Partial<Pick<Template, "name" | "subject" | "body" | "variables">>,
  ): Promise<void> {
    const snap = await getDoc(templateRef(tenantId, templateId));
    if (!snap.exists()) throw new TemplateError("TEMPLATE_NOT_FOUND", `Template ${templateId} not found`);

    await setDoc(
      templateRef(tenantId, templateId),
      { ...(snap.data() as Template), ...updates, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    const snap = await getDoc(templateRef(tenantId, templateId));
    if (!snap.exists()) throw new TemplateError("TEMPLATE_NOT_FOUND", `Template ${templateId} not found`);

    const template = snap.data() as Template;
    if (template.isDefault) {
      throw new TemplateError("CANNOT_DELETE_DEFAULT", "Default templates cannot be deleted");
    }

    // Mark as deleted by setting a tombstone field rather than physically deleting
    await setDoc(
      templateRef(tenantId, templateId),
      { ...template, _deleted: true, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function getDefaultTemplates(tenantId: string, channel?: TemplateChannel): Promise<Template[]> {
    if (!tenantId) throw new TemplateError("TENANT_REQUIRED", "tenantId is required");

    const clauses = channel
      ? [where("isDefault", "==", true), where("channel", "==", channel)]
      : [where("isDefault", "==", true)];

    const q = query(templateCol(tenantId), ...clauses);
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Template);
  }

  async function previewTemplate(
    tenantId: string,
    templateId: string,
    sampleVariables: Record<string, string>,
  ): Promise<RenderedTemplate> {
    const template = await getTemplate(tenantId, templateId);
    if (!template) throw new TemplateError("TEMPLATE_NOT_FOUND", `Template ${templateId} not found`);

    return renderTemplate(template, sampleVariables);
  }

  return {
    createTemplate,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    getDefaultTemplates,
    previewTemplate,
  };
}
