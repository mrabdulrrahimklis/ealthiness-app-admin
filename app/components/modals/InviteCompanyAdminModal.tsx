import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, X } from "lucide-react";
import { Button, Input } from "~/components/ui";
import { useInviteCompanyAdmin } from "~/hooks/useAuthApi";

interface InviteCompanyAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export const InviteCompanyAdminModal: React.FC<
  InviteCompanyAdminModalProps
> = ({ isOpen, onClose, companyId, companyName }) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inviteAdminMutation = useInviteCompanyAdmin();

  const handleClose = () => {
    setInviteEmail("");
    setErrorMessage("");
    onClose();
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail.trim()) return;

    setErrorMessage("");

    try {
      await inviteAdminMutation.mutateAsync({
        companyId,
        email: inviteEmail.trim(),
      });
      handleClose();
    } catch (error) {
      console.error("Failed to invite admin:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send invitation. Please try again.",
      );
    }
  };

  // Reset mutation state when modal opens
  useEffect(() => {
    if (isOpen) {
      inviteAdminMutation.reset();
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10000">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-[#1B173A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#5850DE] to-[#248FEC] text-white flex items-center justify-center">
              <Mail size={20} />
            </div>
            Invite Company Admin
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter admin email address"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !inviteAdminMutation.isPending) {
                  handleInviteAdmin();
                }
              }}
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>
              The admin will receive an invitation email to manage{" "}
              <strong>{companyName}</strong> company.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {inviteAdminMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Invitation sent successfully!
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleInviteAdmin}
              disabled={inviteAdminMutation.isPending || !inviteEmail.trim()}
              className="flex-1 bg-[#5850DE] hover:bg-[#4A42C7]"
            >
              {inviteAdminMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} className="mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={inviteAdminMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
