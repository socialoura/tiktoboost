"use client";

import { UserX } from "lucide-react";

interface GmailUsernameNotFoundButtonProps {
  customerEmail: string;
  orderId: string;
  username: string;
  platform: string;
}

export default function GmailUsernameNotFoundButton({
  customerEmail,
  orderId,
  username,
  platform,
}: GmailUsernameNotFoundButtonProps) {
  const platformName = "TikTok";
  const subject = `Action Required: Your Order #${orderId} - Account Not Found`;

  const body = `Hello,

Thank you for your order #${orderId}.

Unfortunately, we were unable to find the ${platformName} account @${username}. This could be because:
- The username was misspelled
- The account has been deleted or suspended
- The account name has changed

Could you please reply to this email with the correct ${platformName} username so we can start your campaign?

Best regards,
The Team`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={gmailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
      title="Send account not found email via Gmail"
    >
      <UserX className="w-3.5 h-3.5" />
      <span>Not Found</span>
    </a>
  );
}
