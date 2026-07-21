import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, Loader2, Info } from "lucide-react";

interface SiteSettings {
  id: string;
  key: string;
  value: string;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    promo_banner_text: "",
    free_delivery_threshold: "50000",
    delivery_fee: "5000",
    express_delivery_fee: "8500",
    whatsapp_number: "",
    whatsapp_default_message: "Hi! I'd like to place an order.",
    paychangu_public_key: "",
    paychangu_secret_key: "",
    paychangu_webhook_key: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*");
    
    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((s: SiteSettings) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(prev => ({
        ...prev,
        promo_banner_text: settingsMap.promo_banner_text || "",
        free_delivery_threshold: settingsMap.free_delivery_threshold || "50000",
        delivery_fee: settingsMap.delivery_fee || "5000",
        express_delivery_fee: settingsMap.express_delivery_fee || "8500",
        whatsapp_number: settingsMap.whatsapp_number || "",
        whatsapp_default_message: settingsMap.whatsapp_default_message || "",
        paychangu_public_key: settingsMap.paychangu_public_key || "",
        paychangu_secret_key: settingsMap.paychangu_secret_key || "",
        paychangu_webhook_key: settingsMap.paychangu_webhook_key || "",
      }));
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: "promo_banner_text", value: settings.promo_banner_text },
        { key: "free_delivery_threshold", value: settings.free_delivery_threshold },
        { key: "delivery_fee", value: settings.delivery_fee },
        { key: "express_delivery_fee", value: settings.express_delivery_fee },
        { key: "whatsapp_number", value: settings.whatsapp_number },
        { key: "whatsapp_default_message", value: settings.whatsapp_default_message },
        { key: "paychangu_public_key", value: settings.paychangu_public_key },
        { key: "paychangu_secret_key", value: settings.paychangu_secret_key },
        { key: "paychangu_webhook_key", value: settings.paychangu_webhook_key },
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from("site_settings")
          .upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
      }

      toast({ title: "Settings saved!", description: "Your changes have been saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your store settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Info className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Promotional Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Promotional Banner Text</Label>
              <Textarea
                value={settings.promo_banner_text}
                onChange={e => setSettings(s => ({ ...s, promo_banner_text: e.target.value }))}
                placeholder="Free delivery on orders over MWK 50,000. New deals added daily."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This text appears in the promotional banner above the navigation bar. Use emojis for visual appeal.
              </p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                  {settings.promo_banner_text || "Enter your promotional text above..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Delivery Settings</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Free Delivery Threshold (MWK)</Label>
              <Input
                type="number"
                value={settings.free_delivery_threshold}
                onChange={e => setSettings(s => ({ ...s, free_delivery_threshold: e.target.value }))}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label>Standard Delivery Fee (MWK)</Label>
              <Input
                type="number"
                value={settings.delivery_fee}
                onChange={e => setSettings(s => ({ ...s, delivery_fee: e.target.value }))}
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <Label>Express Delivery Fee (MWK)</Label>
              <Input
                type="number"
                value={settings.express_delivery_fee}
                onChange={e => setSettings(s => ({ ...s, express_delivery_fee: e.target.value }))}
                placeholder="8500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">WhatsApp Settings</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={e => setSettings(s => ({ ...s, whatsapp_number: e.target.value }))}
                placeholder="+265..."
              />
            </div>

            <div className="space-y-2">
              <Label>Default Message</Label>
              <Input
                value={settings.whatsapp_default_message}
                onChange={e => setSettings(s => ({ ...s, whatsapp_default_message: e.target.value }))}
                placeholder="Hi! I'd like to place an order."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">PayChangu Payment Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <Input
                type="password"
                value={settings.paychangu_public_key}
                onChange={e => setSettings(s => ({ ...s, paychangu_public_key: e.target.value }))}
                placeholder="PUB-..."
              />
              <p className="text-xs text-muted-foreground">Used client-side for HTML Checkout form.</p>
            </div>

            <div className="space-y-2">
              <Label>Secret Key</Label>
              <Input
                type="password"
                value={settings.paychangu_secret_key}
                onChange={e => setSettings(s => ({ ...s, paychangu_secret_key: e.target.value }))}
                placeholder="SEC-..."
              />
              <p className="text-xs text-muted-foreground">Used server-side for API verification. Never exposed to client.</p>
            </div>

            <div className="space-y-2">
              <Label>Webhook Key</Label>
              <Input
                type="password"
                value={settings.paychangu_webhook_key}
                onChange={e => setSettings(s => ({ ...s, paychangu_webhook_key: e.target.value }))}
                placeholder="WHK-..."
              />
              <p className="text-xs text-muted-foreground">Used to verify incoming webhook callbacks from PayChangu.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;