import { Button, Text } from "@react-email/components"

import { EmailLayout } from "./layout"

type VerifyEmailProps = {
  userName: string
  url: string
}

export function VerifyEmail({ userName, url }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your Starboard email address"
      heading="Verify your email"
    >
      <Text style={paragraph}>Hi {userName || "there"},</Text>
      <Text style={paragraph}>
        Confirm your email address to finish setting up your Starboard account.
      </Text>
      <Button href={url} style={button}>
        Verify email
      </Button>
      <Text style={muted}>
        If you did not create an account, you can ignore this email.
      </Text>
    </EmailLayout>
  )
}

export default VerifyEmail

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
