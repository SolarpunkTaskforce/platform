"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { MissingSupabaseEnvError } from "@/lib/supabaseConfig";
import { supabaseClient } from "@/lib/supabaseClient";

let supabaseInitializationError: MissingSupabaseEnvError | null = null;
let supabase: ReturnType<typeof supabaseClient> | null = null;

try {
  supabase = supabaseClient();
} catch (error) {
  if (error instanceof MissingSupabaseEnvError) {
    supabaseInitializationError = error;
    supabase = null;
  } else {
    throw error;
  }
}

type SocialLinkType =
  | "LinkedIn"
  | "YouTube"
  | "Instagram"
  | "Facebook"
  | "Website"
  | "X"
  | "Threads";

type SocialLink = { type: SocialLinkType; url: string };

type VerifiedOrganisation = { id: string; name: string };

const socialLinkTypes: SocialLinkType[] = [
  "LinkedIn",
  "YouTube",
  "Instagram",
  "Facebook",
  "Website",
  "X",
  "Threads",
];

const emptySocialLink: SocialLink = { type: "LinkedIn", url: "" };

const initialIndividual = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  date_of_birth: "",
  organisation_id: "independent",
  country_from: "",
  country_based: "",
  occupation: "",
  bio: "",
  avatar_url: "",
};

const initialOrganisation = {
  email: "",
  password: "",
  name: "",
  country_based: "",
  what_we_do: "",
  existing_since: "",
  website: "",
  logo_url: "",
};

export default function SignupTabs() {
  if (!supabase) {
    return (
      <div className="rounded-2xl border border-[#6B9FB8]/25 bg-white p-6 text-sm text-soltas-muted">
        {supabaseInitializationError?.message}
      </div>
    );
  }

  return <SignupTabsContent client={supabase} />;
}

type SupabaseClient = NonNullable<ReturnType<typeof supabaseClient>>;

function SignupTabsContent({ client }: { client: SupabaseClient }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"individual" | "organisation">(
    "individual"
  );
  const [individual, setIndividual] = useState(initialIndividual);
  const [organisation, setOrganisation] = useState(initialOrganisation);
  const [individualLinks, setIndividualLinks] = useState<SocialLink[]>([emptySocialLink]);
  const [organisationLinks, setOrganisationLinks] = useState<SocialLink[]>([emptySocialLink]);
  const [verifiedOrgs, setVerifiedOrgs] = useState<VerifiedOrganisation[]>([]);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    text: string;
    tone: "error" | "success" | "info";
  } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const siteUrl = useMemo(() => process.env.NEXT_PUBLIC_SITE_URL || "", []);

  useEffect(() => {
    let isActive = true;

    async function loadVerifiedOrgs() {
      setOrgsLoading(true);
      setOrgsError(null);
      const { data, error } = await client
        .from("verified_organisations")
        .select("id, name")
        .order("name");

      if (!isActive) return;

      if (error) {
        setOrgsError(error.message);
      } else {
        setVerifiedOrgs(data ?? []);
      }
      setOrgsLoading(false);
    }

    loadVerifiedOrgs();

    return () => {
      isActive = false;
    };
  }, [client]);

  function updateIndividualField(field: keyof typeof individual, value: string) {
    setIndividual((prev) => ({ ...prev, [field]: value }));
  }

  function updateOrganisationField(field: keyof typeof organisation, value: string) {
    setOrganisation((prev) => ({ ...prev, [field]: value }));
  }

  function updateSocialLinks(
    updater: Dispatch<SetStateAction<SocialLink[]>>,
    index: number,
    field: keyof SocialLink,
    value: string
  ) {
    updater((prev) =>
      prev.map((link, idx) => (idx === index ? { ...link, [field]: value } : link))
    );
  }

  function addSocialLink(updater: Dispatch<SetStateAction<SocialLink[]>>) {
    updater((prev) => [...prev, { ...emptySocialLink }]);
  }

  function removeSocialLink(
    updater: Dispatch<SetStateAction<SocialLink[]>>,
    index: number
  ) {
    updater((prev) => prev.filter((_, idx) => idx !== index));
  }

  function normalizeLinks(links: SocialLink[]) {
    return links
      .map((link) => ({ ...link, url: link.url.trim() }))
      .filter((link) => link.url.length > 0);
  }

  function validateIndividual() {
    const nextErrors: Record<string, string> = {};
    if (!individual.first_name.trim()) nextErrors.first_name = "First name is required.";
    if (!individual.last_name.trim()) nextErrors.last_name = "Last name is required.";
    if (!individual.email.trim()) nextErrors.email = "Email is required.";
    if (!individual.password.trim()) nextErrors.password = "Password is required.";
    if (!individual.date_of_birth) nextErrors.date_of_birth = "Date of birth is required.";
    if (!individual.organisation_id) {
      nextErrors.organisation_id = "Organisation selection is required.";
    }
    if (!individual.country_based.trim()) {
      nextErrors.country_based = "Country based is required.";
    }

    return nextErrors;
  }

  function validateOrganisation() {
    const nextErrors: Record<string, string> = {};
    if (!organisation.email.trim()) nextErrors.email = "Email is required.";
    if (!organisation.password.trim()) nextErrors.password = "Password is required.";
    if (!organisation.name.trim()) nextErrors.name = "Organisation name is required.";
    if (!organisation.country_based.trim()) {
      nextErrors.country_based = "Country based is required.";
    }
    if (!organisation.what_we_do.trim()) nextErrors.what_we_do = "What we do is required.";
    return nextErrors;
  }

  function getSignupErrorMessage(err: unknown) {
    if (typeof err !== "object" || err === null) {
      return "Unable to sign up.";
    }

    const errorLike = err as {
      message?: string;
      error_description?: string;
      details?: string;
    };

    return (
      errorLike.message ||
      errorLike.error_description ||
      errorLike.details ||
      "Unable to sign up."
    );
  }

  function handleSignupError(scope: "Individual" | "Organisation", err: unknown) {
    console.error(`${scope} signup failed:`, err);
    setMessage({ text: getSignupErrorMessage(err), tone: "error" });
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const { error } = await client.auth.resend({
        type: "signup",
        email: pendingConfirmationEmail,
      });

      if (error) throw error;

      setResendMessage("Confirmation email sent.");
    } catch (err: unknown) {
      console.error("Resend confirmation failed:", err);
      setResendMessage(getSignupErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  }

  async function handleIndividualSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const nextErrors = validateIndividual();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { data, error } = await client.auth.signUp({
        email: individual.email,
        password: individual.password,
        options: {
          emailRedirectTo: siteUrl ? `${siteUrl}/auth` : undefined,
        },
      });
      if (error) throw error;
      if (!data.user?.id) throw new Error("Unable to create user profile.");

      const organisationId =
        individual.organisation_id === "independent" ? null : individual.organisation_id;

      const { error: profileError } = await client.from("profiles").upsert({
        id: data.user.id,
        first_name: individual.first_name.trim(),
        last_name: individual.last_name.trim(),
        date_of_birth: individual.date_of_birth,
        organisation_id: organisationId,
        country_from: individual.country_from.trim() || null,
        country_based: individual.country_based.trim(),
        occupation: individual.occupation.trim() || null,
        bio: individual.bio.trim() || null,
        social_links: normalizeLinks(individualLinks),
        avatar_url: individual.avatar_url.trim() || null,
      });
      if (profileError) throw profileError;

      setMessage({ text: "Signup successful! Redirecting...", tone: "success" });
      setTimeout(() => {
        router.replace("/projects");
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      handleSignupError("Individual", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrganisationSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const nextErrors = validateOrganisation();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { error } = await client.auth.signUp({
        email: organisation.email,
        password: organisation.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;

      const { data: sessionData } = await client.auth.getSession();

      if (!sessionData.session) {
        // Email confirmation required - save pending org data
        const pendingOrgData = {
          email: organisation.email,
          name: organisation.name.trim(),
          country_based: organisation.country_based.trim(),
          what_we_do: organisation.what_we_do.trim(),
          existing_since: organisation.existing_since || undefined,
          website: organisation.website.trim() || undefined,
          logo_url: organisation.logo_url.trim() || undefined,
          social_links: normalizeLinks(organisationLinks),
        };
        localStorage.setItem("pending_organisation_data", JSON.stringify(pendingOrgData));

        setPendingConfirmationEmail(organisation.email);
        setMessage({
          tone: "info",
          text: "Account created. Please check your email to confirm your address, then log in to complete organisation setup.",
        });
        return;
      }

      // Session exists immediately - create org and membership now
      const { data: newOrg, error: organisationError } = await client
        .from("organisations")
        .insert({
          name: organisation.name.trim(),
          country_based: organisation.country_based.trim(),
          what_we_do: organisation.what_we_do.trim(),
          existing_since: organisation.existing_since || null,
          website: organisation.website.trim() || null,
          social_links: normalizeLinks(organisationLinks),
          logo_url: organisation.logo_url.trim() || null,
          verification_status: "pending",
          created_by: sessionData.session.user.id,
        })
        .select("id")
        .single();

      if (organisationError) throw organisationError;
      if (!newOrg?.id) throw new Error("Failed to create organisation");

      // Create membership linking user to organisation
      const { error: memberError } = await client.from("organisation_members").insert({
        organisation_id: newOrg.id,
        user_id: sessionData.session.user.id,
        role: "owner",
      });

      if (memberError) throw memberError;

      setMessage({ text: "Signup successful! Redirecting...", tone: "success" });
      setTimeout(() => {
        router.replace(`/organisations/${newOrg.id}`);
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      handleSignupError("Organisation", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#6B9FB8]/25 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2 rounded-2xl bg-[#EEF2F5] p-2">
        <button
          type="button"
          onClick={() => setActiveTab("individual")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "individual" ? "bg-[#2E6B8A] text-white shadow" : "text-soltas-muted"
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("organisation")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "organisation" ? "bg-[#2E6B8A] text-white shadow" : "text-soltas-muted"
          }`}
        >
          Organisation
        </button>
      </div>

      {activeTab === "individual" ? (
        <form onSubmit={handleIndividualSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="First name"
              value={individual.first_name}
              onChange={(value) => updateIndividualField("first_name", value)}
              error={errors.first_name}
              required
            />
            <Field
              label="Last name"
              value={individual.last_name}
              onChange={(value) => updateIndividualField("last_name", value)}
              error={errors.last_name}
              required
            />
            <Field
              label="Email"
              type="email"
              value={individual.email}
              onChange={(value) => updateIndividualField("email", value)}
              error={errors.email}
              required
            />
            <Field
              label="Password"
              type="password"
              value={individual.password}
              onChange={(value) => updateIndividualField("password", value)}
              error={errors.password}
              required
            />
            <Field
              label="Date of birth"
              type="date"
              value={individual.date_of_birth}
              onChange={(value) => updateIndividualField("date_of_birth", value)}
              error={errors.date_of_birth}
              required
            />
            <SelectField
              label="Organisation"
              value={individual.organisation_id}
              onChange={(value) => updateIndividualField("organisation_id", value)}
              error={errors.organisation_id}
              required
              options={[
                { value: "independent", label: "Independent / No organisation" },
                ...verifiedOrgs.map((org) => ({ value: org.id, label: org.name })),
              ]}
              helperText={
                orgsLoading
                  ? "Loading verified organisations..."
                  : orgsError
                    ? orgsError
                    : "Only verified organisations are shown."
              }
            />
            <Field
              label="Country from"
              value={individual.country_from}
              onChange={(value) => updateIndividualField("country_from", value)}
            />
            <Field
              label="Country based"
              value={individual.country_based}
              onChange={(value) => updateIndividualField("country_based", value)}
              error={errors.country_based}
              required
            />
            <Field
              label="Occupation"
              value={individual.occupation}
              onChange={(value) => updateIndividualField("occupation", value)}
            />
            <Field
              label="Avatar URL"
              value={individual.avatar_url}
              onChange={(value) => updateIndividualField("avatar_url", value)}
              helperText="Upload support will be added later."
            />
          </div>

          <TextAreaField
            label="Bio"
            value={individual.bio}
            onChange={(value) => updateIndividualField("bio", value)}
          />

          <SocialLinksField
            title="Social links"
            links={individualLinks}
            onChange={(index, field, value) =>
              updateSocialLinks(setIndividualLinks, index, field, value)
            }
            onAdd={() => addSocialLink(setIndividualLinks)}
            onRemove={(index) => removeSocialLink(setIndividualLinks, index)}
          />

          <SubmitRow
            loading={loading}
            message={message}
            onResendConfirmation={handleResendConfirmation}
            resendLoading={resendLoading}
            resendMessage={resendMessage}
            canResend={!!pendingConfirmationEmail}
          />
        </form>
      ) : (
        <form onSubmit={handleOrganisationSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={organisation.email}
              onChange={(value) => updateOrganisationField("email", value)}
              error={errors.email}
              required
            />
            <Field
              label="Password"
              type="password"
              value={organisation.password}
              onChange={(value) => updateOrganisationField("password", value)}
              error={errors.password}
              required
            />
            <Field
              label="Organisation name"
              value={organisation.name}
              onChange={(value) => updateOrganisationField("name", value)}
              error={errors.name}
              required
            />
            <Field
              label="Country based"
              value={organisation.country_based}
              onChange={(value) => updateOrganisationField("country_based", value)}
              error={errors.country_based}
              required
            />
            <Field
              label="Existing since"
              type="date"
              value={organisation.existing_since}
              onChange={(value) => updateOrganisationField("existing_since", value)}
              helperText="Optional"
            />
            <Field
              label="Website"
              value={organisation.website}
              onChange={(value) => updateOrganisationField("website", value)}
            />
            <Field
              label="Logo URL"
              value={organisation.logo_url}
              onChange={(value) => updateOrganisationField("logo_url", value)}
              helperText="Upload support will be added later."
            />
          </div>

          <TextAreaField
            label="What we do"
            value={organisation.what_we_do}
            onChange={(value) => updateOrganisationField("what_we_do", value)}
            error={errors.what_we_do}
            required
          />

          <SocialLinksField
            title="Social links"
            links={organisationLinks}
            onChange={(index, field, value) =>
              updateSocialLinks(setOrganisationLinks, index, field, value)
            }
            onAdd={() => addSocialLink(setOrganisationLinks)}
            onRemove={(index) => removeSocialLink(setOrganisationLinks, index)}
          />

          <SubmitRow
            loading={loading}
            message={message}
            onResendConfirmation={handleResendConfirmation}
            resendLoading={resendLoading}
            resendMessage={resendMessage}
            canResend={!!pendingConfirmationEmail}
          />
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}) {
  return (
    <label className="space-y-1 text-sm text-soltas-text">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-[#6B9FB8]/40 focus:border-[#6B9FB8] focus:ring-[#6B9FB8]/60"
        }`}
      />
      {helperText && <p className="text-xs text-soltas-muted">{helperText}</p>}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  required,
  error,
  helperText,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1 text-sm text-soltas-text">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-[#6B9FB8]/40 focus:border-[#6B9FB8] focus:ring-[#6B9FB8]/60"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <p className="text-xs text-soltas-muted">{helperText}</p>}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm text-soltas-text">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-[#6B9FB8]/40 focus:border-[#6B9FB8] focus:ring-[#6B9FB8]/60"
        }`}
      />
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}

function SocialLinksField({
  title,
  links,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  links: SocialLink[];
  onChange: (index: number, field: keyof SocialLink, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-soltas-text">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-[#6B9FB8]/40 px-3 py-1 text-xs font-medium text-[#2E6B8A] hover:bg-[#EEF2F5] transition-colors duration-150"
        >
          Add link
        </button>
      </div>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${link.type}-${index}`} className="grid gap-3 md:grid-cols-[160px,1fr,auto]">
            <select
              value={link.type}
              onChange={(event) => onChange(index, "type", event.target.value)}
              className="w-full rounded-xl border border-[#6B9FB8]/40 bg-white px-3 py-2 text-sm focus:border-[#6B9FB8] focus:outline-none focus:ring-2 focus:ring-[#6B9FB8]/60"
            >
              {socialLinkTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="https://"
              value={link.url}
              onChange={(event) => onChange(index, "url", event.target.value)}
              className="w-full rounded-xl border border-[#6B9FB8]/40 px-3 py-2 text-sm focus:border-[#6B9FB8] focus:outline-none focus:ring-2 focus:ring-[#6B9FB8]/60"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-full border border-[#6B9FB8]/40 px-3 py-1 text-xs text-[#8A9BAB] hover:bg-[#EEF2F5] transition-colors duration-150"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmitRow({
  loading,
  message,
  onResendConfirmation,
  resendLoading,
  resendMessage,
  canResend,
}: {
  loading: boolean;
  message: { text: string; tone: "error" | "success" | "info" } | null;
  onResendConfirmation?: () => void;
  resendLoading?: boolean;
  resendMessage?: string | null;
  canResend?: boolean;
}) {
  const showResendButton = message?.tone === "info" && canResend && onResendConfirmation;

  return (
    <div className="space-y-3">
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#2E6B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1A3F54] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
      {message && (
        <p
          className={`text-sm font-medium ${
            message.tone === "success"
              ? "text-[#2E6B8A]"
              : message.tone === "info"
                ? "text-soltas-muted"
                : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
      {showResendButton && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onResendConfirmation}
            disabled={resendLoading}
            className="w-full rounded-xl border border-[#6B9FB8]/40 bg-white px-4 py-2 text-sm font-medium text-[#2E6B8A] transition hover:bg-[#EEF2F5] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resendLoading ? "Sending..." : "Resend confirmation email"}
          </button>
          {resendMessage && (
            <p className="text-sm font-medium text-[#2E6B8A]">{resendMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
