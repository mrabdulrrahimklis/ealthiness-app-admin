import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/accept-invitation";
import { AlertCircle, CheckCircle, Smartphone, Building } from "lucide-react";
import { Button, Card } from "~/components/ui";
import { useMutation } from "@tanstack/react-query";
import { apiClient, type ApiError } from "~/lib/services/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Accept Invitation - Ealthiness Platform" },
    {
      name: "description",
      content: "Accept your invitation to join the Ealthiness platform",
    },
  ];
}

interface InvitationResponse {
  message: string;
  success: boolean;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const [invitationType, setInvitationType] = useState<string>("");

  const token = searchParams.get("token");
  const type = searchParams.get("type");

  useEffect(() => {
    if (type) {
      setInvitationType(type.toLowerCase());
    }
  }, [type]);

  const acceptInvitationMutation = useMutation({
    mutationFn: async (): Promise<InvitationResponse> => {
      if (!token) {
        throw new Error("Missing invitation token");
      }

      if (invitationType === "patient") {
        return apiClient.post(
          `/v1/therapy-sessions/patients/invite/accept?token=${token}`,
        );
      }

      if (invitationType === "psychologist_company") {
        return apiClient.post(
          `/v1/therapy-sessions/companies/invite/accept?token=${token}`,
        );
      }

      throw new Error("Invalid invitation type");
    },
    onError: (error: ApiError | any) => {
      console.error("Invitation acceptance failed:", error);
    },
  });

  const handleAcceptInvitation = () => {
    acceptInvitationMutation.mutate();
  };

  if (!token || !type) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B173A] mb-2">
            Invalid Invitation
          </h2>
          <p className="text-[#60646C] mb-6">
            This invitation link is invalid or missing required parameters.
            Please check the link or contact support.
          </p>
        </Card>
      </div>
    );
  }

  if (invitationType !== "patient" && invitationType !== "psychologist_company") {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B173A] mb-2">
            Unsupported Invitation Type
          </h2>
          <p className="text-[#60646C] mb-6">
            This invitation type "{type}" is not currently supported. Please
            contact support for assistance.
          </p>
        </Card>
      </div>
    );
  }

  if (acceptInvitationMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1B173A] mb-2">
              Invitation Accepted Successfully!
            </h1>
            <p className="text-[#60646C] mb-6">
              Your {invitationType === "psychologist_company" ? "company" : invitationType} invitation has been accepted. You can now
              log in to the mobile app and continue your{" "}
              {invitationType === "patient"
                ? "therapy sessions"
                : "company management activities"}
              .
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                  <Smartphone size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B173A] mb-1">
                    Mobile App Access
                  </h3>
                  <p className="text-sm text-[#60646C]">
                    Download the Ealthiness mobile app and log in with your
                    credentials to access your{" "}
                    {invitationType === "patient"
                      ? "therapy sessions and communicate with your psychologist"
                      : "company dashboard and manage your organization's wellness programs"}
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-1">
                  <Building size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B173A] mb-1">
                    Next Steps
                  </h3>
                  <p className="text-sm text-[#60646C]">
                    {invitationType === "patient"
                      ? "Your psychologist will provide further instructions and information about your therapy program through the mobile application."
                      : "You can now access your company's wellness dashboard and manage employee wellness programs through the mobile application."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E0E1E6] text-center">
            <p className="text-sm text-[#8E8E93]">
              Need help? Contact your psychologist or our support team for
              assistance.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white">
              <Smartphone size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1B173A] mb-2">
              {invitationType === "patient"
                ? "Patient Invitation"
                : "Company Invitation"}
            </h1>
            <p className="text-[#60646C] mb-6">
              You have been invited to join the Ealthiness platform as a{" "}
              {invitationType === "psychologist_company" ? "company" : invitationType}. Accept this invitation to{" "}
              {invitationType === "patient"
                ? "start your therapy journey"
                : "manage your company's wellness programs"}
              .
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <h3 className="font-semibold text-[#1B173A] mb-2">
              What happens after acceptance:
            </h3>
            <ul className="text-sm text-[#60646C] space-y-1">
              <li>• You'll gain access to the Ealthiness mobile app</li>
              {invitationType === "patient" ? (
                <>
                  <li>• You can communicate with your assigned psychologist</li>
                  <li>• Access your therapy sessions and progress tracking</li>
                  <li>• Receive personalized care recommendations</li>
                </>
              ) : (
                <>
                  <li>• You can manage your company's wellness programs</li>
                  <li>• Access employee wellness analytics and reports</li>
                  <li>
                    • Configure wellness initiatives for your organization
                  </li>
                </>
              )}
            </ul>
          </div>

          {acceptInvitationMutation.error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-red-600" />
                <h3 className="font-semibold text-red-800">Error</h3>
              </div>
              <div className="text-sm text-red-700 mt-2">
                {(() => {
                  const error = acceptInvitationMutation.error as ApiError;
                  if (error?.statusCode && error?.errors && error?.type) {
                    return (
                      <div className="space-y-1">
                        <p>
                          <strong>Status:</strong> {error.statusCode}
                        </p>
                        <p>
                          <strong>Error:</strong> {error.errors}
                        </p>
                        <p>
                          <strong>Type:</strong> {error.type}
                        </p>
                      </div>
                    );
                  }
                  return (
                    error?.message ||
                    "Failed to accept invitation. Please try again."
                  );
                })()}
              </div>
            </div>
          )}

          <Button
            onClick={handleAcceptInvitation}
            disabled={acceptInvitationMutation.isPending}
            className="w-full bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {acceptInvitationMutation.isPending
              ? "Accepting Invitation..."
              : "Accept Invitation"}
          </Button>

          <div className="mt-6 pt-4 border-t border-[#E0E1E6] text-center">
            <p className="text-sm text-[#8E8E93]">
              By accepting this invitation, you agree to{" "}
              {invitationType === "patient"
                ? "participate in the therapy program as outlined by your healthcare provider"
                : "manage your company's wellness programs according to the platform's terms of service"}
              .
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
