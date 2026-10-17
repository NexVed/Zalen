"use client";
import * as stylex from "@stylexjs/stylex";
import { ui } from "@/components/dashboard/ui";
import { formStyles } from "@/components/dashboard/forms";
import { colors } from "@/styles/tokens.stylex";

interface StepRoleDetailsProps {
  role: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

function Field({
  label,
  children,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label {...stylex.props(ui.label)}>
      {label}
      {optional && <span {...stylex.props(ui.caption)}> (optional)</span>}
      {children}
    </label>
  );
}

function Sel({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={e => onChange(e.target.value)}
      {...stylex.props(ui.input)}
    >
      <option value="">Select…</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function StepRoleDetails({ role, data, onChange, onNext, onBack, isLoading }: StepRoleDetailsProps) {
  function set(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }
  function val(key: string): string {
    return (data[key] as string | undefined) ?? "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onNext(data);
  }

  const workModeOptions = [
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
    { value: "on-site", label: "On-site" },
  ];

  const eduLevelOptions = [
    { value: "school", label: "School / High School" },
    { value: "diploma", label: "Diploma" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "postgraduate", label: "Postgraduate" },
    { value: "other", label: "Other" },
  ];

  const expLevelOptions = [
    { value: "fresher", label: "Fresher" },
    { value: "0-1yr", label: "0–1 year" },
    { value: "1-3yr", label: "1–3 years" },
    { value: "3-5yr", label: "3–5 years" },
    { value: "5yr+", label: "5+ years" },
  ];

  const orgStageOptions = [
    { value: "idea", label: "Idea" },
    { value: "prototype", label: "Prototype" },
    { value: "mvp", label: "MVP" },
    { value: "early-traction", label: "Early Traction" },
    { value: "established", label: "Established" },
  ];

  const availabilityOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "occasional", label: "Occasional" },
  ];

  const mentorFormatOptions = [
    { value: "1:1", label: "1-on-1" },
    { value: "group", label: "Group" },
    { value: "both", label: "Both" },
  ];

  function renderStudent() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Institution name">
            <input {...stylex.props(ui.input)} value={val("institution")} onChange={e => set("institution", e.target.value)} placeholder="Your college or school" />
          </Field>
          <Field label="Education level">
            <Sel name="educationLevel" value={val("educationLevel")} onChange={v => set("educationLevel", v)} options={eduLevelOptions} />
          </Field>
        </div>
        <Field label="Degree & specialization" optional>
          <input {...stylex.props(ui.input)} value={val("degree")} onChange={e => set("degree", e.target.value)} placeholder="B.Tech Computer Science" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Current year / semester">
            <input {...stylex.props(ui.input)} value={val("currentYear")} onChange={e => set("currentYear", e.target.value)} placeholder="3rd year / 5th sem" />
          </Field>
          <Field label="Graduation year">
            <input {...stylex.props(ui.input)} value={val("graduationYear")} onChange={e => set("graduationYear", e.target.value)} placeholder="2026" />
          </Field>
        </div>
        <Field label="Areas of interest">
          <input {...stylex.props(ui.input)} value={val("interests")} onChange={e => set("interests", e.target.value)} placeholder="AI, Web Development, Design" />
        </Field>
        <Field label="Preferred work mode">
          <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
        </Field>
        <Field label="Portfolio URL" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("portfolioUrl")} onChange={e => set("portfolioUrl", e.target.value)} placeholder="https://yourportfolio.com" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="LinkedIn" optional>
            <input {...stylex.props(ui.input)} value={val("linkedin")} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/you" />
          </Field>
          <Field label="GitHub" optional>
            <input {...stylex.props(ui.input)} value={val("github")} onChange={e => set("github", e.target.value)} placeholder="github.com/you" />
          </Field>
        </div>
      </>
    );
  }

  function renderGraduate() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Highest education">
            <Sel name="highestEducation" value={val("highestEducation")} onChange={v => set("highestEducation", v)} options={eduLevelOptions} />
          </Field>
          <Field label="College / University">
            <input {...stylex.props(ui.input)} value={val("college")} onChange={e => set("college", e.target.value)} placeholder="Your institution" />
          </Field>
        </div>
        <Field label="Degree & specialization" optional>
          <input {...stylex.props(ui.input)} value={val("degree")} onChange={e => set("degree", e.target.value)} placeholder="B.Com Finance" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Graduation year">
            <input {...stylex.props(ui.input)} value={val("graduationYear")} onChange={e => set("graduationYear", e.target.value)} placeholder="2024" />
          </Field>
          <Field label="Experience level">
            <Sel name="experienceLevel" value={val("experienceLevel")} onChange={v => set("experienceLevel", v)} options={expLevelOptions} />
          </Field>
        </div>
        <Field label="Areas of interest">
          <input {...stylex.props(ui.input)} value={val("interests")} onChange={e => set("interests", e.target.value)} placeholder="Marketing, Data Analysis" />
        </Field>
        <Field label="Preferred job roles">
          <input {...stylex.props(ui.input)} value={val("preferredRoles")} onChange={e => set("preferredRoles", e.target.value)} placeholder="Product Manager, Business Analyst" />
        </Field>
        <Field label="Preferred work mode">
          <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
        </Field>
        <Field label="Portfolio URL" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("portfolioUrl")} onChange={e => set("portfolioUrl", e.target.value)} placeholder="https://yourportfolio.com" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="LinkedIn" optional>
            <input {...stylex.props(ui.input)} value={val("linkedin")} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/you" />
          </Field>
          <Field label="GitHub" optional>
            <input {...stylex.props(ui.input)} value={val("github")} onChange={e => set("github", e.target.value)} placeholder="github.com/you" />
          </Field>
        </div>
      </>
    );
  }

  function renderFounder() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Startup / Org name">
            <input {...stylex.props(ui.input)} value={val("orgName")} onChange={e => set("orgName", e.target.value)} placeholder="Acme Inc." />
          </Field>
          <Field label="Your designation">
            <input {...stylex.props(ui.input)} value={val("designation")} onChange={e => set("designation", e.target.value)} placeholder="Co-founder & CEO" />
          </Field>
        </div>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Industry">
            <input {...stylex.props(ui.input)} value={val("industry")} onChange={e => set("industry", e.target.value)} placeholder="EdTech, FinTech…" />
          </Field>
          <Field label="Stage">
            <Sel name="orgStage" value={val("orgStage")} onChange={v => set("orgStage", v)} options={orgStageOptions} />
          </Field>
        </div>
        <Field label="Description">
          <textarea {...stylex.props(ui.input)} rows={3} value={val("description")} onChange={e => set("description", e.target.value)} placeholder="What does your startup do?" />
        </Field>
        <Field label="Website" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("website")} onChange={e => set("website", e.target.value)} placeholder="https://acme.com" />
        </Field>
        <Field label="Skills / expertise">
          <input {...stylex.props(ui.input)} value={val("skills")} onChange={e => set("skills", e.target.value)} placeholder="Product, Growth, Engineering" />
        </Field>
        <Field label="Current hiring needs" optional>
          <input {...stylex.props(ui.input)} value={val("hiringNeeds")} onChange={e => set("hiringNeeds", e.target.value)} placeholder="Looking for frontend dev, designer…" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Location">
            <input {...stylex.props(ui.input)} value={val("location")} onChange={e => set("location", e.target.value)} placeholder="Bangalore, KA" />
          </Field>
          <Field label="Work mode">
            <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
          </Field>
        </div>
      </>
    );
  }

  function renderRecruiter() {
    const opportunityTypes = ["Internship", "Full-time", "Freelance", "Contract"];
    const currentTypes = (data["opportunityTypes"] as string[] | undefined) ?? [];

    function toggleType(t: string) {
      const next = currentTypes.includes(t)
        ? currentTypes.filter(x => x !== t)
        : [...currentTypes, t];
      set("opportunityTypes", next);
    }

    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Organisation name">
            <input {...stylex.props(ui.input)} value={val("orgName")} onChange={e => set("orgName", e.target.value)} placeholder="Acme Corp" />
          </Field>
          <Field label="Your job title">
            <input {...stylex.props(ui.input)} value={val("jobTitle")} onChange={e => set("jobTitle", e.target.value)} placeholder="Talent Acquisition Lead" />
          </Field>
        </div>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Industry">
            <input {...stylex.props(ui.input)} value={val("industry")} onChange={e => set("industry", e.target.value)} placeholder="Technology, Finance…" />
          </Field>
          <Field label="Org website" optional>
            <input {...stylex.props(ui.input)} type="url" value={val("website")} onChange={e => set("website", e.target.value)} placeholder="https://acme.com" />
          </Field>
        </div>
        <Field label="Hiring domains">
          <input {...stylex.props(ui.input)} value={val("hiringDomains")} onChange={e => set("hiringDomains", e.target.value)} placeholder="Engineering, Design, Marketing" />
        </Field>
        <Field label="Preferred candidate skills">
          <input {...stylex.props(ui.input)} value={val("preferredSkills")} onChange={e => set("preferredSkills", e.target.value)} placeholder="React, Python, Figma" />
        </Field>
        <div {...stylex.props(s.checkboxGroup)}>
          <span {...stylex.props(s.checkboxGroupLabel)}>Types of opportunities</span>
          {opportunityTypes.map(t => (
            <label key={t} {...stylex.props(s.checkboxLabel)}>
              <input
                type="checkbox"
                checked={currentTypes.includes(t)}
                onChange={() => toggleType(t)}
              />
              {t}
            </label>
          ))}
        </div>
        <Field label="Preferred work mode">
          <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
        </Field>
      </>
    );
  }

  function renderBusiness() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Business name">
            <input {...stylex.props(ui.input)} value={val("businessName")} onChange={e => set("businessName", e.target.value)} placeholder="My Shop Pvt Ltd" />
          </Field>
          <Field label="Business category">
            <input {...stylex.props(ui.input)} value={val("category")} onChange={e => set("category", e.target.value)} placeholder="Retail, F&B, Services…" />
          </Field>
        </div>
        <Field label="Description">
          <textarea {...stylex.props(ui.input)} rows={3} value={val("description")} onChange={e => set("description", e.target.value)} placeholder="What does your business do?" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Address / locality">
            <input {...stylex.props(ui.input)} value={val("address")} onChange={e => set("address", e.target.value)} placeholder="Andheri West" />
          </Field>
          <Field label="City">
            <input {...stylex.props(ui.input)} value={val("city")} onChange={e => set("city", e.target.value)} placeholder="Mumbai" />
          </Field>
        </div>
        <Field label="Website" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("website")} onChange={e => set("website", e.target.value)} placeholder="https://mybusiness.com" />
        </Field>
        <Field label="Services offered">
          <input {...stylex.props(ui.input)} value={val("services")} onChange={e => set("services", e.target.value)} placeholder="Web design, Photography…" />
        </Field>
        <Field label="Skills needed">
          <input {...stylex.props(ui.input)} value={val("skillsNeeded")} onChange={e => set("skillsNeeded", e.target.value)} placeholder="Digital marketing, React…" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Preferred contact method">
            <input {...stylex.props(ui.input)} value={val("contactMethod")} onChange={e => set("contactMethod", e.target.value)} placeholder="WhatsApp, Email" />
          </Field>
          <Field label="Work mode">
            <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
          </Field>
        </div>
      </>
    );
  }

  function renderFreelancer() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Professional title">
            <input {...stylex.props(ui.input)} value={val("title")} onChange={e => set("title", e.target.value)} placeholder="Full-Stack Developer" />
          </Field>
          <Field label="Experience level">
            <Sel name="experienceLevel" value={val("experienceLevel")} onChange={v => set("experienceLevel", v)} options={expLevelOptions} />
          </Field>
        </div>
        <Field label="Primary skills">
          <input {...stylex.props(ui.input)} value={val("primarySkills")} onChange={e => set("primarySkills", e.target.value)} placeholder="React, Node.js, Figma" />
        </Field>
        <Field label="Services offered">
          <textarea {...stylex.props(ui.input)} rows={3} value={val("services")} onChange={e => set("services", e.target.value)} placeholder="Web development, UI/UX design…" />
        </Field>
        <Field label="Portfolio website" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("portfolioUrl")} onChange={e => set("portfolioUrl", e.target.value)} placeholder="https://yourportfolio.com" />
        </Field>
        <Field label="Preferred project categories">
          <input {...stylex.props(ui.input)} value={val("projectCategories")} onChange={e => set("projectCategories", e.target.value)} placeholder="SaaS, E-commerce, Branding" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Availability">
            <Sel name="availability" value={val("availability")} onChange={v => set("availability", v)} options={availabilityOptions} />
          </Field>
          <Field label="Work mode">
            <Sel name="workMode" value={val("workMode")} onChange={v => set("workMode", v)} options={workModeOptions} />
          </Field>
        </div>
      </>
    );
  }

  function renderMentor() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Current designation">
            <input {...stylex.props(ui.input)} value={val("designation")} onChange={e => set("designation", e.target.value)} placeholder="Senior Engineer" />
          </Field>
          <Field label="Organisation">
            <input {...stylex.props(ui.input)} value={val("organisation")} onChange={e => set("organisation", e.target.value)} placeholder="Google, IIT Bombay…" />
          </Field>
        </div>
        <Field label="Areas of expertise">
          <input {...stylex.props(ui.input)} value={val("expertise")} onChange={e => set("expertise", e.target.value)} placeholder="Machine Learning, Product Strategy" />
        </Field>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Years of experience">
            <input {...stylex.props(ui.input)} value={val("yearsOfExperience")} onChange={e => set("yearsOfExperience", e.target.value)} placeholder="8" />
          </Field>
          <Field label="Preferred format">
            <Sel name="mentorFormat" value={val("mentorFormat")} onChange={v => set("mentorFormat", v)} options={mentorFormatOptions} />
          </Field>
        </div>
        <Field label="Topics for mentoring">
          <input {...stylex.props(ui.input)} value={val("mentorTopics")} onChange={e => set("mentorTopics", e.target.value)} placeholder="Career transitions, interview prep…" />
        </Field>
        <Field label="Availability">
          <Sel name="availability" value={val("availability")} onChange={v => set("availability", v)} options={availabilityOptions} />
        </Field>
        <Field label="LinkedIn / profile URL" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("profileUrl")} onChange={e => set("profileUrl", e.target.value)} placeholder="https://linkedin.com/in/you" />
        </Field>
      </>
    );
  }

  function renderInstitution() {
    return (
      <>
        <div {...stylex.props(formStyles.twoColumns)}>
          <Field label="Institution name">
            <input {...stylex.props(ui.input)} value={val("institutionName")} onChange={e => set("institutionName", e.target.value)} placeholder="IIT Bombay" />
          </Field>
          <Field label="Your designation">
            <input {...stylex.props(ui.input)} value={val("designation")} onChange={e => set("designation", e.target.value)} placeholder="Dean, Placement Officer" />
          </Field>
        </div>
        <Field label="Department">
          <input {...stylex.props(ui.input)} value={val("department")} onChange={e => set("department", e.target.value)} placeholder="Computer Science" />
        </Field>
        <Field label="Institution website" optional>
          <input {...stylex.props(ui.input)} type="url" value={val("website")} onChange={e => set("website", e.target.value)} placeholder="https://iitb.ac.in" />
        </Field>
        <Field label="Student communities served">
          <input {...stylex.props(ui.input)} value={val("communities")} onChange={e => set("communities", e.target.value)} placeholder="E-Cell, Coding Club, NSS" />
        </Field>
        <Field label="Opportunity types to promote">
          <input {...stylex.props(ui.input)} value={val("opportunityTypes")} onChange={e => set("opportunityTypes", e.target.value)} placeholder="Internships, Hackathons, Placements" />
        </Field>
      </>
    );
  }

  function renderFields() {
    switch (role) {
      case "student": return renderStudent();
      case "graduate": return renderGraduate();
      case "founder": return renderFounder();
      case "recruiter": return renderRecruiter();
      case "business": return renderBusiness();
      case "freelancer": return renderFreelancer();
      case "mentor": return renderMentor();
      case "institution": return renderInstitution();
      default: return <p {...stylex.props(s.unknown)}>Unknown role type.</p>;
    }
  }

  return (
    <form {...stylex.props(s.container)} onSubmit={handleSubmit}>
      <p {...stylex.props(s.description)}>
        Tell us more about your background so we can tailor your experience.
      </p>
      {renderFields()}
      <div {...stylex.props(s.actions)}>
        <button type="button" {...stylex.props(ui.secondary)} onClick={onBack}>Back</button>
        <button type="submit" {...stylex.props(ui.primary)} disabled={isLoading}>
          {isLoading ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

const s = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  description: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 1.7,
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  checkboxGroupLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.body,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: colors.body,
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  unknown: {
    color: colors.muted,
    fontSize: 13,
  },
});
