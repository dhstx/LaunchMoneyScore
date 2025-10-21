import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

interface EmailCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export function EmailCaptureDialog({ open, onClose, onSubmit }: EmailCaptureDialogProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubmit(email);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Get Your Report
          </DialogTitle>
          <DialogDescription>
            Enter your email to receive your detailed audit report and unlock exclusive insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Continue to Payment
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            We'll send you a copy of your report and occasional tips to optimize your website.
            No spam, unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

