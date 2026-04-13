"use client";

import { Mail } from "lucide-react";

interface GmailPrivateAccountButtonProps {
  customerEmail: string;
  orderId: string;
  username: string;
  platform: string;
}

export default function GmailPrivateAccountButton({
  customerEmail,
  orderId,
  username,
  platform,
}: GmailPrivateAccountButtonProps) {
  const platformName = "TikTok";
  const subject = `Action Required: Your Order #${orderId} is on hold`;

  const body = `Hello,

Thank you for your order #${orderId} for the ${platformName} account @${username}.

We are ready to start your campaign, but your account is currently set to Private. We cannot deliver followers to a private account.

Please switch your account to Public in your ${platformName} settings, then reply to this email to let us know. We will start your boost immediately!

Best regards,
The Team`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={gmailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
      title="Send private account email via Gmail"
    >
      <Mail className="w-3.5 h-3.5" />
      <span>Private</span>
    </a>
  );
}
