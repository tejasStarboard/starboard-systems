import { redirect } from "next/navigation"

/** Quote rules moved into Preferences → Quote (093); keep the old deep link alive. */
export default function QuoteRulesRedirectPage() {
  redirect("/settings/preferences#quote")
}
