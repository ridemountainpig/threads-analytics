"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { revokeOAuthClientAction } from "@/actions/oauth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RevokeAgentButtonProps {
  clientId: string;
  clientName: string;
  labels: {
    revoke: string;
    revokeConfirmTitle: string;
    revokeConfirmBody: string;
    revoked: string;
    revokeFailed: string;
    cancel: string;
  };
}

export default function RevokeAgentButton({
  clientId,
  clientName,
  labels,
}: RevokeAgentButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmRevoke() {
    startTransition(async () => {
      const revoked = await revokeOAuthClientAction(clientId).then(
        (result) => !result.error,
        () => false,
      );
      if (!revoked) {
        toast.error(labels.revokeFailed.replace("{client}", clientName));
        return;
      }
      setOpen(false);
      toast.success(labels.revoked.replace("{client}", clientName));
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground rounded-full"
        onClick={() => setOpen(true)}
      >
        {labels.revoke}
      </Button>

      {/* Focus lands on Cancel; the destructive action is never the default. */}
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{labels.revokeConfirmTitle.replace("{client}", clientName)}</DialogTitle>
            <DialogDescription>{labels.revokeConfirmBody}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {labels.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={confirmRevoke}
              disabled={pending}
            >
              {pending && (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none" />
              )}
              {labels.revoke}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
