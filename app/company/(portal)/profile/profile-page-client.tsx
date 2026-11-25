"use client";

import { FormEvent, useEffect, useState } from "react";

import { uploadImageFile } from "@/lib/upload-image";

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

type Profile = {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl: string | null;
  role: string;
};

export default function CompanyProfilePageClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/company/profile", { cache: "no-store" });
        const data = (await response.json()) as { profile?: Profile; error?: string };
        if (cancelled) return;
        if (!response.ok || !data.profile) {
          setProfile(null);
          setLoadError(data.error ?? "Could not load profile.");
          return;
        }
        setProfile(data.profile);
        setImageUrl(data.profile.imageUrl);
      } catch {
        if (!cancelled) {
          setProfile(null);
          setLoadError("Could not load profile. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePhoto = async (e: FormEvent) => {
    e.preventDefault();
    setPhotoError("");
    setPhotoSuccess("");
    setIsSavingPhoto(true);
    try {
      const response = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = (await response.json()) as {
        profile?: Profile;
        error?: string;
      };
      if (!response.ok || !data.profile) {
        setPhotoError(data.error ?? "Could not update profile photo.");
        return;
      }
      setProfile(data.profile);
      setImageUrl(data.profile.imageUrl);
      setPhotoSuccess("Profile photo updated.");
    } catch {
      setPhotoError("Could not update profile photo. Please try again.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Enter your current password and a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
    } catch {
      setPasswordError("Could not update password. Please try again.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const photoDirty = (imageUrl ?? null) !== (profile?.imageUrl ?? null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Profile</h1>
          <p className="mt-1 text-xs text-zinc-700">
            Update your photo and password for this lab account
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading profile…</p>
        ) : loadError ? (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {loadError}
          </p>
        ) : profile ? (
          <div className="mx-auto grid max-w-3xl gap-4">
            <section className="rounded-2xl border border-[#dfe4ef] bg-white px-5 py-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
              <div className="flex flex-wrap items-center gap-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-[#dfe4ef]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800 ring-1 ring-emerald-100">
                    {profile.initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-zinc-900">{profile.name}</h2>
                  <p className="truncate text-sm text-zinc-600">{profile.email}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">{profile.role}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#dfe4ef] bg-white px-5 py-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
              <h2 className="text-sm font-bold text-zinc-900">Profile picture</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Upload a square photo. It appears in the sidebar and on shared lab screens.
              </p>

              <form onSubmit={savePhoto} className="mt-5 space-y-4">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <label
                    className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200"
                    aria-label="Upload profile picture"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setPhotoError("");
                        setPhotoSuccess("");
                        setIsUploadingImage(true);
                        try {
                          const url = await uploadImageFile(file, "avatars");
                          setImageUrl(url);
                        } catch (error) {
                          setPhotoError(
                            error instanceof Error ? error.message : "Could not upload image.",
                          );
                        } finally {
                          setIsUploadingImage(false);
                        }
                      }}
                    />
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-white opacity-0 transition-opacity group-hover:bg-zinc-900/45 group-hover:opacity-100">
                          Change
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold">
                        {isUploadingImage ? "Uploading…" : "Upload"}
                      </span>
                    )}
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!imageUrl || isUploadingImage || isSavingPhoto}
                      onClick={() => {
                        setImageUrl(null);
                        setPhotoError("");
                        setPhotoSuccess("");
                      }}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {photoError ? (
                  <p className="text-sm font-semibold text-rose-700">{photoError}</p>
                ) : null}
                {photoSuccess ? (
                  <p className="text-sm font-semibold text-emerald-700">{photoSuccess}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={!photoDirty || isUploadingImage || isSavingPhoto}
                  className="inline-flex min-w-36 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPhoto ? "Saving…" : "Save photo"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-[#dfe4ef] bg-white px-5 py-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
              <h2 className="text-sm font-bold text-zinc-900">Password</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Choose a strong password you do not use elsewhere.
              </p>

              <form onSubmit={savePassword} className="mt-5 space-y-3">
                <div>
                  <label className="text-sm font-bold text-zinc-950">Current password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-zinc-800"
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showCurrent} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-zinc-800"
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showNew} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Confirm new password</label>
                  <input
                    type={showNew ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>

                {passwordError ? (
                  <p className="text-sm font-semibold text-rose-700">{passwordError}</p>
                ) : null}
                {passwordSuccess ? (
                  <p className="text-sm font-semibold text-emerald-700">{passwordSuccess}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="inline-flex min-w-36 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPassword ? "Updating…" : "Update password"}
                </button>
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
