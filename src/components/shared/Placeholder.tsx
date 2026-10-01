import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface PlaceholderProps {
  title: string;
  description: string;
  milestone?: string;
  icon?: typeof Construction;
}

export function Placeholder({ title, description, milestone, icon: Icon = Construction }: PlaceholderProps) {
  return (
    <div className="animate-fadeIn">
      <Card className="text-center py-16 px-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 flex items-center justify-center text-primary-300 mb-5">
          <Icon className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-50">{title}</h1>
        <p className="mt-3 text-ink-400 max-w-md mx-auto">{description}</p>
        {milestone && (
          <p className="mt-4 text-xs text-ink-500 font-semibold uppercase tracking-wide">{milestone}</p>
        )}
        <Link to="/" className="inline-block mt-6">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to home</Button>
        </Link>
      </Card>
    </div>
  );
}
