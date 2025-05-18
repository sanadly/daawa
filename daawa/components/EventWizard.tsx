"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { Info, Calendar, MapPin, Tag, Users } from "lucide-react";
import { createEvent } from '@/services/apiEvents';

const steps = [
  { key: "basic", icon: Info, label: "event.form.step.basic" },
  { key: "datetime", icon: Calendar, label: "event.form.step.datetime" },
  { key: "location", icon: MapPin, label: "event.form.step.location" },
  { key: "type", icon: Tag, label: "event.form.step.type" },
];

const defaultValues = {
  title: "",
  description: "",
  dateTime: "",
  location: "",
  type: "WEDDING",
  language: "en",
  state: "Pending",
  expectedGuests: 1,
};

export default function EventWizard() {
  const { t } = useTranslation('event');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({ defaultValues });

  const onNext = async () => {
    // Validate current step fields
    let valid = false;
    if (step === 0) valid = await trigger(["title"]);
    if (step === 1) valid = await trigger(["dateTime"]);
    if (step === 2) valid = await trigger(["location"]);
    if (step === 3) valid = await trigger(["type", "language", "expectedGuests"]);
    if (valid) setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const onBack = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (data: any) => {
    if (step < steps.length - 1) return; // Prevent submit if not on last step
    setLoading(true);
    setError("");
    try {
      // Fix dateTime to be a valid ISO string
      if (data.dateTime && !data.dateTime.endsWith('Z')) {
        // Add seconds if missing
        if (data.dateTime.length === 16) {
          data.dateTime = data.dateTime + ':00';
        }
        // Convert to ISO string (local time to UTC)
        data.dateTime = new Date(data.dateTime).toISOString();
      }
      await createEvent(data);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Stepper */}
      <div className="flex justify-between mb-8">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`flex flex-col items-center transition-colors duration-200 ${
              i === step
                ? "text-primary"
                : i < step
                ? "text-success"
                : "text-base-content/40"
            }`}
          >
            <s.icon className="w-7 h-7 mb-1" />
            <span className="text-xs font-semibold">{t(s.label)}</span>
          </div>
        ))}
      </div>
      {/* Step Content */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card bg-base-200 p-6 mb-4 shadow-xl"
        autoComplete="off"
      >
        {step === 0 && (
          <>
            <h2 className="text-xl font-bold mb-2">{t("event.form.titleLabel")}</h2>
            <p className="mb-4 text-base-content/60">{t("event.form.titleDesc")}</p>
            <Controller
              name="title"
              control={control}
              rules={{ required: t("event.form.titleRequired") as string }}
              render={({ field }) => (
                <input
                  {...field}
                  className={`input input-bordered w-full mb-4 ${errors.title ? "input-error" : ""}`}
                  placeholder={t("event.form.titlePlaceholder")}
                  aria-label={t("event.form.titleLabel")}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="textarea textarea-bordered w-full"
                  placeholder={t("event.form.descriptionPlaceholder")}
                  aria-label={t("event.form.descriptionLabel")}
                />
              )}
            />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-2">{t("event.form.dateLabel")}</h2>
            <p className="mb-4 text-base-content/60">{t("event.form.dateDesc")}</p>
            <Controller
              name="dateTime"
              control={control}
              rules={{ required: t("event.form.dateRequired") as string }}
              render={({ field }) => (
                <input
                  {...field}
                  type="datetime-local"
                  className={`input input-bordered w-full ${errors.dateTime ? "input-error" : ""}`}
                  aria-label={t("event.form.dateLabel")}
                />
              )}
            />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-2">{t("event.form.locationLabel")}</h2>
            <p className="mb-4 text-base-content/60">{t("event.form.locationDesc")}</p>
            <Controller
              name="location"
              control={control}
              rules={{ required: t("event.form.locationRequired") as string }}
              render={({ field }) => (
                <input
                  {...field}
                  className={`input input-bordered w-full ${errors.location ? "input-error" : ""}`}
                  placeholder={t("event.form.locationPlaceholder")}
                  aria-label={t("event.form.locationLabel")}
                />
              )}
            />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold mb-2">{t("event.form.typeLabel")}</h2>
            <p className="mb-4 text-base-content/60">{t("event.form.typeDesc")}</p>
            <Controller
              name="type"
              control={control}
              rules={{ required: t("event.form.typeRequired") as string }}
              render={({ field }) => (
                <select
                  {...field}
                  className="select select-bordered w-full mb-4"
                  aria-label={t("event.form.typeLabel")}
                >
                  <option value="WEDDING">{t("event.form.type.wedding")}</option>
                  <option value="CONFERENCE">{t("event.form.type.conference")}</option>
                  <option value="PARTY">{t("event.form.type.party")}</option>
                  <option value="OTHER">{t("event.form.type.other")}</option>
                </select>
              )}
            />
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <div className="mb-4">
                  <label className="block font-semibold mb-1">{t("event.form.languageLabel")}</label>
                  <p className="mb-2 text-base-content/60">{t("event.form.languageDesc")}</p>
                  <select
                    {...field}
                    className="select select-bordered w-full"
                    aria-label={t("event.form.languageLabel")}
                  >
                    <option value="en">{t("event.form.language.en")}</option>
                    <option value="ar">{t("event.form.language.ar")}</option>
                  </select>
                </div>
              )}
            />
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="select select-bordered w-full mb-4"
                  aria-label={t("event.form.stateLabel")}
                >
                  <option value="Pending">{t("event.form.state.pending")}</option>
                  <option value="Draft">{t("event.form.state.draft")}</option>
                  <option value="Active">{t("event.form.state.active")}</option>
                </select>
              )}
            />
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <Controller
                name="expectedGuests"
                control={control}
                rules={{ required: t("event.form.expectedGuestsRequired") as string, min: 1 }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min={1}
                    className={`input input-bordered w-full ${errors.expectedGuests ? "input-error" : ""}`}
                    placeholder={t("event.form.expectedGuestsPlaceholder")}
                    aria-label={t("event.form.expectedGuestsLabel")}
                  />
                )}
              />
            </div>
          </>
        )}
        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            className="btn"
            onClick={onBack}
            disabled={step === 0 || loading}
          >
            {t("common.back")}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNext}
              disabled={loading}
            >
              {t("common.next")}
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? t("common.loading") : t("common.submit")}
            </button>
          )}
        </div>
        {error && <div className="alert alert-error mt-4">{error}</div>}
        {success && <div className="alert alert-success mt-4">{t("event.form.success")}</div>}
      </form>
    </div>
  );
} 