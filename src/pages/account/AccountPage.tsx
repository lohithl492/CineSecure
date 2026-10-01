import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, Input, Button, Badge } from '@/components/ui';
import { User as UserIcon, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div>
        <Badge tone="accent" variant="soft">Profile</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">Edit Profile</h1>
        <p className="mt-1 text-ink-400">Update your personal information.</p>
      </div>

      <Card>
        <CardHeader title="Personal information" subtitle="Visible across the platform" />
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full name" icon={<UserIcon className="h-4 w-4" />} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email address" icon={<Mail className="h-4 w-4" />} value={user.email} disabled />
          <Input label="Phone" icon={<Phone className="h-4 w-4" />} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-success-400 animate-fadeIn">Saved!</span>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle="Your CineSecure profile" action={<ShieldCheck className="h-5 w-5 text-success-400" />} />
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink-400">Account type</span>
          <Badge tone="primary" variant="soft">{user.role}</Badge>
        </div>
      </Card>
    </div>
  );
}
