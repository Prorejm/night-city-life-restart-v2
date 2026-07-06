import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import CyberButton from '@/components/Common/CyberButton';
import type { EventBranch } from '@/types';

interface ModalEvent {
  title: string;
  description: string;
  branches?: EventBranch[];
}

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event: ModalEvent | null;
  onChoice?: (branchId: string) => void;
}

export default function EventModal({
  open,
  onClose,
  event,
  onChoice,
}: EventModalProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-neon-cyan/30 bg-black/90 backdrop-blur-md max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-neon-cyan text-lg tracking-wider">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {event.description}
        </DialogDescription>

        {event.branches && event.branches.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {event.branches.map((branch) => (
              <CyberButton
                key={branch.id}
                variant="primary"
                size="md"
                onClick={() => onChoice?.(branch.id)}
              >
                {branch.text}
              </CyberButton>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
