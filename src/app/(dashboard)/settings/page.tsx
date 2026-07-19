"use client";

import React, { useState, useEffect } from "react";
import { Settings, User as UserIcon, Lock, Loader2, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useAlertStore } from "@/stores/alertStore";
import { NotificationPermissionToggle } from "@/components/NotificationPermissionToggle";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { showAlert } = useAlertStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setImage(data.image || "");
          setIsPublic(data.isPublic !== false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImage(data.url);
      } else {
        showAlert("Upload Failed", "Could not upload profile photo. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Upload Error", "An error occurred while uploading profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfileSaving) return;
    setIsProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, isPublic }),
      });
      if (res.ok) {
        const updated = await res.json();
        await updateSession({
          ...session,
          user: { ...session?.user, name: updated.name, image: updated.image, isPublic: updated.isPublic },
        });
        setProfileMsg("Profile updated successfully!");
      } else {
        const data = await res.json();
        setProfileMsg(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setProfileMsg("Failed to update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordSaving) return;
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setIsPasswordSaving(true);
    setPasswordMsg("");
    setPasswordError("");
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Failed to update password.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll">
      {/* Page header */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 sm:px-8 py-4 sm:py-6 shrink-0 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <Settings className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Account Settings
            </h1>
            <p className="text-neutral-500 text-[11px]">
              Manage profile attributes and secure credential options.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Profile Settings form */}
        <form onSubmit={handleProfileSave} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-neutral-800 rounded-xl p-6 space-y-5 transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-2 border-b border-neutral-900/80 pb-3 select-none">
            <UserIcon className="h-4 w-4 text-cyan-400" />
            <h2
              className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Profile Information
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-neutral-900/60 pb-5">
            {/* Avatar Preview */}
            <div className="relative shrink-0 select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"}
                alt="Avatar Preview"
                className="w-20 h-20 rounded-2xl object-cover border border-neutral-800 bg-neutral-950"
              />
              <label className="absolute -bottom-1 -right-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 p-1.5 rounded-lg cursor-pointer transition-colors shadow flex items-center justify-center">
                {isUploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 w-full grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Display Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-premium h-10 text-xs placeholder-neutral-700 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Avatar Image URL
                </label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="input-premium h-10 text-xs placeholder-neutral-700 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Profile Visibility Toggle */}
          <div className="flex items-center justify-between border-t border-neutral-900/60 pt-4 select-none">
            <div className="space-y-0.5">
              <span
                className="text-[10px] font-bold text-neutral-200 uppercase tracking-wider block"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Profile Visibility
              </span>
              <p className="text-[10px] text-neutral-500 leading-normal">
                {isPublic ? "Public — other users can view your profile and contributions." : "Private — other users cannot view your profile."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`h-5 w-9 rounded-full transition-all relative shrink-0 ${
                isPublic ? "bg-cyan-500" : "bg-neutral-805"
              }`}
            >
              <div
                className={`h-3 w-3 bg-neutral-950 rounded-full absolute top-1 transition-all ${
                  isPublic ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 text-xs font-semibold select-none ${profileMsg.includes("successfully") ? "text-emerald-400" : "text-red-400"}`}>
              {profileMsg.includes("successfully") && <Check className="h-3.5 w-3.5" />}
              <span>{profileMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProfileSaving}
            className="btn-premium-primary text-xs h-9 px-5 font-bold cursor-pointer"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {isProfileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
          </Button>
        </form>

        {/* Notification Settings */}
        <NotificationPermissionToggle />

        {/* Password Change form */}
        <form onSubmit={handlePasswordSave} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-neutral-800 rounded-xl p-6 space-y-5 transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-2 border-b border-neutral-900/80 pb-3 select-none">
            <Lock className="h-4 w-4 text-violet-400" />
            <h2
              className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Change Password
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="input-premium h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="input-premium h-10 text-xs"
              />
            </div>
          </div>

          {passwordMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 select-none">
              <Check className="h-3.5 w-3.5" />
              <span>{passwordMsg}</span>
            </div>
          )}
          {passwordError && (
            <p className="text-xs font-semibold text-red-400 select-none">{passwordError}</p>
          )}

          <Button
            type="submit"
            disabled={isPasswordSaving}
            className="btn-premium-primary text-xs h-9 px-5 font-bold cursor-pointer"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {isPasswordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
