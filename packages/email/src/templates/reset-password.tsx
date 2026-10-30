import { Button, Text } from "@react-email/components"

import { EmailLayout } from "./layout"

type ResetPasswordEmailProps = {
  userName: string
  url: string
}

export function ResetPasswordEmail({
  userName,
  url,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview="Reset your Starboard password"
      heading="Reset your password"
    >
      <Text style={paragraph}>Hi {userName || "there"},</Text>
      <Text style={paragraph}>
        We received a request to reset your Starboard password. Click the button
        below to choose a new one.
      </Text>
      <Button href={url} style={button}>
        Reset password
      </Button>
      <Text style={muted}>
        This link expires soon. If you did not request a reset, you can ignore
        this email.
      </Text>
    </EmailLayout>
  )
}

export default ResetPasswordEmail

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
