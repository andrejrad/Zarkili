import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Location } from "../../domains/locations";
import type { StaffMember } from "../../domains/staff";
import type { Service } from "../../domains/services";
import { brandTypography } from "../../shared/ui/brandTypography";

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

export type TenantProfileSummaryView = {
  name: string;
  slug: string;
  status: string;
  plan: string;
  country: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  brandingPrimary: string;
  brandingSecondary: string;
  allowGuestBooking: boolean;
  requireDeposit: boolean;
};

type TenantProfileScreenProps = {
  loading: boolean;
  errorMessage: string | null;
  profile: TenantProfileSummaryView | null;
  onRetry: () => void;
  onBack: () => void;
};

export function TenantProfileScreen({
  loading,
  errorMessage,
  profile,
  onRetry,
  onBack,
}: TenantProfileScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Tenant profile</Text>
      <Text style={styles.subtitle}>Display-only tenant branding and settings summary.</Text>

      {loading ? <Text style={styles.body}>Loading tenant profile...</Text> : null}
      {errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {profile ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <Text style={styles.body}>Name: {profile.name}</Text>
          <Text style={styles.body}>Slug: {profile.slug}</Text>
          <Text style={styles.body}>Status: {profile.status}</Text>
          <Text style={styles.body}>Plan: {profile.plan}</Text>

          <Text style={styles.sectionTitle}>Locale</Text>
          <Text style={styles.body}>Country: {profile.country}</Text>
          <Text style={styles.body}>Timezone: {profile.timezone}</Text>
          <Text style={styles.body}>Language: {profile.defaultLanguage}</Text>
          <Text style={styles.body}>Currency: {profile.defaultCurrency}</Text>

          <Text style={styles.sectionTitle}>Branding</Text>
          <Text style={styles.body}>Primary: {profile.brandingPrimary}</Text>
          <Text style={styles.body}>Secondary: {profile.brandingSecondary}</Text>

          <Text style={styles.sectionTitle}>Booking settings</Text>
          <Text style={styles.body}>Allow guest booking: {profile.allowGuestBooking ? "Yes" : "No"}</Text>
          <Text style={styles.body}>Require deposit: {profile.requireDeposit ? "Yes" : "No"}</Text>
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={onBack} />
    </ScrollView>
  );
}

type TenantLocationsScreenProps = {
  loading: boolean;
  errorMessage: string | null;
  locations: Location[];
  onRetry: () => void;
  onCreateLocation: () => void;
  onBack: () => void;
};

export function TenantLocationsScreen({
  loading,
  errorMessage,
  locations,
  onRetry,
  onCreateLocation,
  onBack,
}: TenantLocationsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Tenant locations</Text>
      <Text style={styles.subtitle}>Tenant-scoped list with loading, empty, and error states.</Text>

      <PrimaryButton label="Create location" onPress={onCreateLocation} />

      {loading ? <Text style={styles.body}>Loading tenant locations...</Text> : null}

      {errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {!loading && !errorMessage && locations.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.body}>No locations exist yet for this tenant.</Text>
        </View>
      ) : null}

      {!loading && !errorMessage && locations.length > 0 ? (
        <View style={styles.cardList}>
          {locations.map((location) => (
            <View key={location.locationId} style={styles.card}>
              <Text style={styles.sectionTitle}>{location.name}</Text>
              <Text style={styles.body}>Code: {location.code}</Text>
              <Text style={styles.body}>City: {location.address.city}</Text>
              <Text style={styles.body}>Country: {location.address.country}</Text>
              <Text style={styles.body}>Timezone: {location.timezone}</Text>
              <Text style={styles.body}>Status: {location.status}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={onBack} />
    </ScrollView>
  );
}

type CreateLocationScreenProps = {
  name: string;
  code: string;
  city: string;
  country: string;
  timezone: string;
  submitting: boolean;
  formErrorMessage: string | null;
  submitErrorMessage: string | null;
  submitSuccessMessage: string | null;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function CreateLocationScreen(props: CreateLocationScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Create location</Text>
      <Text style={styles.subtitle}>Minimal tenant-scoped location form with required-field validation.</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Location name</Text>
        <TextInput placeholder="Downtown Studio" style={styles.input} value={props.name} onChangeText={props.onNameChange} />

        <Text style={styles.inputLabel}>Location code</Text>
        <TextInput placeholder="DOWNTOWN" style={styles.input} value={props.code} onChangeText={props.onCodeChange} />

        <Text style={styles.inputLabel}>City</Text>
        <TextInput placeholder="Zagreb" style={styles.input} value={props.city} onChangeText={props.onCityChange} />

        <Text style={styles.inputLabel}>Country</Text>
        <TextInput placeholder="HR" style={styles.input} value={props.country} onChangeText={props.onCountryChange} />

        <Text style={styles.inputLabel}>Timezone</Text>
        <TextInput placeholder="Europe/Zagreb" style={styles.input} value={props.timezone} onChangeText={props.onTimezoneChange} />

        {props.formErrorMessage ? <Text style={styles.error}>{props.formErrorMessage}</Text> : null}
        {props.submitErrorMessage ? <Text style={styles.error}>{props.submitErrorMessage}</Text> : null}
        {props.submitSuccessMessage ? <Text style={styles.success}>{props.submitSuccessMessage}</Text> : null}

        <PrimaryButton
          disabled={props.submitting}
          label={props.submitting ? "Creating..." : "Submit location"}
          onPress={props.onSubmit}
        />
      </View>

      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

// ─── Staff screens ───────────────────────────────────────────────────────────

type StaffListScreenProps = {
  loading: boolean;
  errorMessage: string | null;
  staffList: StaffMember[];
  onRetry: () => void;
  onCreateStaff: () => void;
  onBack: () => void;
};

export function StaffListScreen({
  loading,
  errorMessage,
  staffList,
  onRetry,
  onCreateStaff,
  onBack,
}: StaffListScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Staff</Text>
      <Text style={styles.subtitle}>Tenant-scoped staff list.</Text>

      <PrimaryButton label="Add staff member" onPress={onCreateStaff} />

      {loading ? <Text style={styles.body}>Loading staff...</Text> : null}

      {errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {!loading && !errorMessage && staffList.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.body}>No staff members yet.</Text>
        </View>
      ) : null}

      {!loading && !errorMessage && staffList.length > 0 ? (
        <View style={styles.cardList}>
          {staffList.map((member) => (
            <View key={member.staffId} style={styles.card}>
              <Text style={styles.sectionTitle}>{member.displayName}</Text>
              <Text style={styles.body}>Role: {member.role}</Text>
              <Text style={styles.body}>Status: {member.status}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={onBack} />
    </ScrollView>
  );
}

type StaffCreateScreenProps = {
  displayName: string;
  role: string;
  locationIds: string;
  submitting: boolean;
  formErrorMessage: string | null;
  submitErrorMessage: string | null;
  submitSuccessMessage: string | null;
  onDisplayNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onLocationIdsChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function StaffCreateScreen(props: StaffCreateScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Add staff member</Text>
      <Text style={styles.subtitle}>Create a new staff member for this tenant.</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Display name</Text>
        <TextInput placeholder="Jane Smith" style={styles.input} value={props.displayName} onChangeText={props.onDisplayNameChange} />

        <Text style={styles.inputLabel}>Role (owner / manager / technician / assistant)</Text>
        <TextInput placeholder="technician" style={styles.input} value={props.role} onChangeText={props.onRoleChange} />

        <Text style={styles.inputLabel}>Location IDs (comma-separated)</Text>
        <TextInput placeholder="tenant_loc1,tenant_loc2" style={styles.input} value={props.locationIds} onChangeText={props.onLocationIdsChange} />

        {props.formErrorMessage ? <Text style={styles.error}>{props.formErrorMessage}</Text> : null}
        {props.submitErrorMessage ? <Text style={styles.error}>{props.submitErrorMessage}</Text> : null}
        {props.submitSuccessMessage ? <Text style={styles.success}>{props.submitSuccessMessage}</Text> : null}

        <PrimaryButton
          disabled={props.submitting}
          label={props.submitting ? "Creating..." : "Submit staff member"}
          onPress={props.onSubmit}
        />
      </View>

      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

type StaffEditScreenProps = {
  staffMember: StaffMember | null;
  loading: boolean;
  errorMessage: string | null;
  displayName: string;
  role: string;
  submitting: boolean;
  formErrorMessage: string | null;
  submitErrorMessage: string | null;
  submitSuccessMessage: string | null;
  onDisplayNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSubmit: () => void;
  onDeactivate: () => void;
  onBack: () => void;
};

export function StaffEditScreen(props: StaffEditScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Edit staff member</Text>

      {props.loading ? <Text style={styles.body}>Loading...</Text> : null}
      {props.errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{props.errorMessage}</Text>
        </View>
      ) : null}

      {props.staffMember ? (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Display name</Text>
          <TextInput style={styles.input} value={props.displayName} onChangeText={props.onDisplayNameChange} />

          <Text style={styles.inputLabel}>Role (owner / manager / technician / assistant)</Text>
          <TextInput style={styles.input} value={props.role} onChangeText={props.onRoleChange} />

          {props.formErrorMessage ? <Text style={styles.error}>{props.formErrorMessage}</Text> : null}
          {props.submitErrorMessage ? <Text style={styles.error}>{props.submitErrorMessage}</Text> : null}
          {props.submitSuccessMessage ? <Text style={styles.success}>{props.submitSuccessMessage}</Text> : null}

          <PrimaryButton
            disabled={props.submitting}
            label={props.submitting ? "Saving..." : "Save changes"}
            onPress={props.onSubmit}
          />
          <SecondaryButton label="Deactivate staff member" onPress={props.onDeactivate} />
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

// ─── Service screens ─────────────────────────────────────────────────────────

type ServiceListScreenProps = {
  loading: boolean;
  errorMessage: string | null;
  servicesList: Service[];
  onRetry: () => void;
  onCreateService: () => void;
  onBack: () => void;
};

export function ServiceListScreen({
  loading,
  errorMessage,
  servicesList,
  onRetry,
  onCreateService,
  onBack,
}: ServiceListScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Services</Text>
      <Text style={styles.subtitle}>Tenant-scoped services list.</Text>

      <PrimaryButton label="Add service" onPress={onCreateService} />

      {loading ? <Text style={styles.body}>Loading services...</Text> : null}

      {errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {!loading && !errorMessage && servicesList.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.body}>No services yet.</Text>
        </View>
      ) : null}

      {!loading && !errorMessage && servicesList.length > 0 ? (
        <View style={styles.cardList}>
          {servicesList.map((service) => (
            <View key={service.serviceId} style={styles.card}>
              <Text style={styles.sectionTitle}>{service.name}</Text>
              <Text style={styles.body}>Category: {service.category}</Text>
              <Text style={styles.body}>Duration: {service.durationMinutes} min</Text>
              <Text style={styles.body}>Price: {service.price} {service.currency}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={onBack} />
    </ScrollView>
  );
}

type ServiceCreateScreenProps = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  currency: string;
  submitting: boolean;
  formErrorMessage: string | null;
  submitErrorMessage: string | null;
  submitSuccessMessage: string | null;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ServiceCreateScreen(props: ServiceCreateScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Add service</Text>
      <Text style={styles.subtitle}>Create a new service for this tenant.</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Service name</Text>
        <TextInput placeholder="Haircut" style={styles.input} value={props.name} onChangeText={props.onNameChange} />

        <Text style={styles.inputLabel}>Category</Text>
        <TextInput placeholder="hair" style={styles.input} value={props.category} onChangeText={props.onCategoryChange} />

        <Text style={styles.inputLabel}>Duration (minutes)</Text>
        <TextInput keyboardType="numeric" placeholder="60" style={styles.input} value={props.durationMinutes} onChangeText={props.onDurationChange} />

        <Text style={styles.inputLabel}>Price</Text>
        <TextInput keyboardType="numeric" placeholder="0" style={styles.input} value={props.price} onChangeText={props.onPriceChange} />

        <Text style={styles.inputLabel}>Currency</Text>
        <TextInput placeholder="EUR" style={styles.input} value={props.currency} onChangeText={props.onCurrencyChange} />

        {props.formErrorMessage ? <Text style={styles.error}>{props.formErrorMessage}</Text> : null}
        {props.submitErrorMessage ? <Text style={styles.error}>{props.submitErrorMessage}</Text> : null}
        {props.submitSuccessMessage ? <Text style={styles.success}>{props.submitSuccessMessage}</Text> : null}

        <PrimaryButton
          disabled={props.submitting}
          label={props.submitting ? "Creating..." : "Submit service"}
          onPress={props.onSubmit}
        />
      </View>

      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

type ServiceEditScreenProps = {
  service: Service | null;
  loading: boolean;
  errorMessage: string | null;
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  submitting: boolean;
  formErrorMessage: string | null;
  submitErrorMessage: string | null;
  submitSuccessMessage: string | null;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSubmit: () => void;
  onArchive: () => void;
  onBack: () => void;
};

export function ServiceEditScreen(props: ServiceEditScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>Edit service</Text>

      {props.loading ? <Text style={styles.body}>Loading...</Text> : null}
      {props.errorMessage ? (
        <View style={styles.card}>
          <Text style={styles.error}>{props.errorMessage}</Text>
        </View>
      ) : null}

      {props.service ? (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Service name</Text>
          <TextInput style={styles.input} value={props.name} onChangeText={props.onNameChange} />

          <Text style={styles.inputLabel}>Category</Text>
          <TextInput style={styles.input} value={props.category} onChangeText={props.onCategoryChange} />

          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput keyboardType="numeric" style={styles.input} value={props.durationMinutes} onChangeText={props.onDurationChange} />

          <Text style={styles.inputLabel}>Price</Text>
          <TextInput keyboardType="numeric" style={styles.input} value={props.price} onChangeText={props.onPriceChange} />

          {props.formErrorMessage ? <Text style={styles.error}>{props.formErrorMessage}</Text> : null}
          {props.submitErrorMessage ? <Text style={styles.error}>{props.submitErrorMessage}</Text> : null}
          {props.submitSuccessMessage ? <Text style={styles.success}>{props.submitSuccessMessage}</Text> : null}

          <PrimaryButton
            disabled={props.submitting}
            label={props.submitting ? "Saving..." : "Save changes"}
            onPress={props.onSubmit}
          />
          <SecondaryButton label="Archive service" onPress={props.onArchive} />
        </View>
      ) : null}

      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rootContent: {
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  cardList: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1A1A1A",
    fontFamily: brandTypography.medium,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: "#F44336",
    fontFamily: brandTypography.regular,
  },
  success: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4CAF50",
    fontFamily: brandTypography.regular,
  },
  button: {
    marginTop: 6,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#E3A9A0",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.medium,
  },
  secondaryButton: {
    marginTop: 6,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E0D1",
  },
  secondaryButtonLabel: {
    color: "#6B6B6B",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.medium,
  },
  inputLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: "#1A1A1A",
    fontFamily: brandTypography.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
});
