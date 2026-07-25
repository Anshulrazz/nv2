/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Settings, User as UserIcon, Lock, Loader2, Check, Camera, ArrowUpRight } from "lucide-react";
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
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Page header */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
            <Settings className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Account Settings
              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">
                VAULT SECURITY
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
              Manage your student profile attributes, visibility preferences, and secure credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 max-w-3xl w-full mx-auto space-y-8 relative z-10">
        {/* Profile Settings Form */}
        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
          <form onSubmit={handleProfileSave} className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 select-none">
              <UserIcon className="size-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                Profile Information
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-white/5 pb-6">
              {/* Avatar Preview */}
              <div className="relative shrink-0 select-none">
                <img
                  src={image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"}
                  alt="Avatar Preview"
                  className="size-20 rounded-2xl object-cover border border-white/10 bg-zinc-950 shadow-md"
                />
                <label className="absolute -bottom-1 -right-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 p-2 rounded-xl cursor-pointer transition-colors shadow-lg flex items-center justify-center">
                  {isUploadingPhoto ? (
                    <Loader2 className="size-4 animate-spin text-zinc-950" />
                  ) : (
                    <Camera className="size-4 text-zinc-950" />
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
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Display Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Avatar Image URL
                  </label>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Profile Visibility Toggle */}
            <div className="flex items-center justify-between pt-2 select-none">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block">
                  Profile Visibility
                </span>
                <p className="text-[10px] text-zinc-400 font-light leading-normal">
                  {isPublic ? "Public — other users can view your profile and contributions." : "Private — other users cannot view your profile."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`h-5 w-9 rounded-full transition-all relative shrink-0 ${
                  isPublic ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`h-3 w-3 bg-zinc-950 rounded-full absolute top-1 transition-all ${
                    isPublic ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 text-xs font-semibold select-none ${profileMsg.includes("successfully") ? "text-emerald-400" : "text-rose-400"}`}>
                {profileMsg.includes("successfully") && <Check className="size-4" />}
                <span>{profileMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isProfileSaving}
              className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              {isProfileSaving ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : (
                <>
                  <span>Save Profile</span>
                  <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Notification Settings */}
        <NotificationPermissionToggle />

        {/* Password Change Form */}
        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
          <form onSubmit={handlePasswordSave} className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 select-none">
              <Lock className="size-4 text-violet-400" />
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                Change Password
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-zinc-950 border-white/10 focus:border-cyan-400 text-white placeholder-zinc-600 h-11 text-xs rounded-xl"
                />
              </div>
            </div>

            {passwordMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 select-none">
                <Check className="size-4" />
                <span>{passwordMsg}</span>
              </div>
            )}
            {passwordError && (
              <p className="text-xs font-semibold text-rose-400 select-none">{passwordError}</p>
            )}

            <Button
              type="submit"
              disabled={isPasswordSaving}
              className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              {isPasswordSaving ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : (
                <>
                  <span>Update Password</span>
                  <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
