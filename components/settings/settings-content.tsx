"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Globe,
  LogOut,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsContent() {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      if (data.language) {
        setLocale(data.language as "en" | "my");
      }
    }
    setLoading(false);
  }, [supabase, setLocale]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        language: locale,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success(t("settingsSaved"));
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  async function handleLanguageChange(value: string) {
    const lang = value as "en" | "my";
    setLocale(lang);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ language: lang, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("settingsDescription")}
        </p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t("profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{t("displayName")}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("enterDisplayName")}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={locale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="my">Myanmar (မြန်မာ)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Separator />

      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("signOutDescription")}
          </p>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
