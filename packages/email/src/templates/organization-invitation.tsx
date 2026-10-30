import { Button, Text } from "@react-email/components"

import { EmailLayout } from "./layout"

type OrganizationInvitationEmailProps = {
  inviterName: string
  organizationName: string
  url: string
}

export function OrganizationInvitationEmail({
  inviterName,
  organizationName,
  url,
}: OrganizationInvitationEmailProps) {
  return (
    <EmailLayout
      preview={`Join ${organizationName} on Starboard`}
      heading="You're invited"
    >
      <Text style={paragraph}>
        {inviterName} invited you to join <strong>{organizationName}</strong> on
        Starboard.
      </Text>
      <Button href={url} style={button}>
        Accept invitation
      </Button>
      <Text style={muted}>
        If you were not expecting this invitation, you can ignore this email.
      </Text>
    </EmailLayout>
  )
}

export default OrganizationInvitationEmail

const paragraph = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

const button = {
  backgroundColor: "#111111",
  borderRadius: "0",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  margin: "16px 0",
  padding: "10px 16px",
  textDecoration: "none",
}

const muted = {
  color: "#737373",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
}
