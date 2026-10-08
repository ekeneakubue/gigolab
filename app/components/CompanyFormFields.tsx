"use client";

import { useState } from "react";

import { uploadImageFile } from "@/lib/upload-image";

export type CompanyFormValues = {
  logo: string | null;
  name: string;
  labCode: string;
  password: string;
  location: string;
  status: "Active" | "Trial" | "Inactive";
  contact: string;
  phone: string;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const readOnlyClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-base font-semibold text-zinc-950 outline-none";

type CompanyFormFieldsProps = {
  form: CompanyFormValues;
  onChange: (updater: (prev: CompanyFormValues) => CompanyFormValues) => void;
  onImageError?: (message: string) => void;
  infoLine: string;
  statusMode?: "select" | "readonly";
  passwordMode?: "editable" | "readonly";
  passwordPlaceholder?: string;
  showPasswordToggle?: boolean;
  /** Hide the password field (e.g. admin modals where credentials live on users). */
  hidePassword?: boolean;
  /** Hide the contact email and phone fields. */
  hideContactFields?: boolean;
};

export function CompanyFormFields({
  form,
  onChange,
  onImageError,
  infoLine,
  statusMode = "select",
  passwordMode = "editable",
  passwordPlaceholder,
  showPasswordToggle = false,
  hidePassword = false,
  hideContactFields = false,
}: CompanyFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-bold text-zinc-950">Upload logo</p>
        <label
          className="group relative mx-auto mt-2 flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200 focus-within:ring-offset-2"
          aria-label="Upload logo"
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) {
                onChange((f) => ({ ...f, logo: null }));
                return;
              }
              setIsUploadingLogo(true);
              try {
                const url = await uploadImageFile(file, "logos");
                onChange((f) => ({ ...f, logo: url }));
              } catch (error) {
                onImageError?.(error instanceof Error ? error.message : "Could not upload image.");
              } finally {
                setIsUploadingLogo(false);
              }
            }}
          />
          {form.logo ? (
            <>
              <img src={form.logo} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-white opacity-0 transition-opacity group-hover:bg-zinc-900/40 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-7 w-7" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          )}
        </label>
        {isUploadingLogo ? <p className="mt-2 text-xs font-medium text-zinc-600">Uploading…</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      <div>
        <label className="text-sm font-bold text-zinc-950">Lab Name</label>
        <input
          value={form.name}
          onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-zinc-950">Lab Code</label>
        <input readOnly value={form.labCode} className={`${readOnlyClass} font-mono`} />
      </div>

      {hidePassword ? null : (
      <div>
        <label className="text-sm font-bold text-zinc-950">Password</label>
        {passwordMode === "readonly" ? (
          <input
            type="text"
            readOnly
            value={form.password}
            autoComplete="off"
            className={readOnlyClass}
          />
        ) : showPasswordToggle ? (
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => onChange((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
              placeholder={passwordPlaceholder}
              className={`${inputClass} mt-0 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-zinc-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <input
            type="password"
            value={form.password}
            onChange={(e) => onChange((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
            className={inputClass}
          />
        )}
      </div>
      )}

      <div>
        <label className="text-sm font-bold text-zinc-950">Status</label>
        {statusMode === "readonly" ? (
          <input readOnly value={form.status} className={readOnlyClass} />
        ) : (
          <select
            value={form.status}
            onChange={(e) =>
              onChange((f) => ({ ...f, status: e.target.value as CompanyFormValues["status"] }))
            }
            className={inputClass}
          >
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Inactive">Inactive</option>
          </select>
        )}
      </div>

      <div>
        <label className="text-sm font-bold text-zinc-950">Location</label>
        <input
          value={form.location}
          onChange={(e) => onChange((f) => ({ ...f, location: e.target.value }))}
          className={inputClass}
        />
      </div>
      {hideContactFields ? null : (
        <>
          <div>
            <label className="text-sm font-bold text-zinc-950">Contact email</label>
            <input
              type="email"
              value={form.contact}
              onChange={(e) => onChange((f) => ({ ...f, contact: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-zinc-950">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => onChange((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>
        </>
      )}
      </div>

      <p className="text-sm font-medium text-zinc-800">{infoLine}</p>
    </div>
  );
}
