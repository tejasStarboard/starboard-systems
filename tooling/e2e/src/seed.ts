/**
 * Idempotent e2e fixture seed: verified user + org membership (owner).
 */
import { mkdirSync, writeFileSync } from "node:fs"

import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"

import { createDb } from "@starboard/lib-db"
import {
  account,
  member,
  organization,
  user,
} from "@starboard/lib-db/schema"

import { e2eCredentials, type E2eFixtures } from "./credentials"
import { loadWebEnv } from "./load-env"
import { authPaths } from "./paths"

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`
}

export async function seedE2e(): Promise<E2eFixtures> {
  loadWebEnv()
  const creds = e2eCredentials()
  const postgresUrl = process.env.POSTGRES_URL
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL is required to seed e2e fixtures")
  }

  const db = createDb(postgresUrl)
  const passwordHash = await hashPassword(creds.password)

  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, creds.email))
    .limit(1)

  let userId: string
  if (existingUsers[0]) {
    userId = existingUsers[0].id
    await db
      .update(user)
      .set({
        name: creds.name,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))

    const credential = accounts.find((row) => row.providerId === "credential")
    if (credential) {
      await db
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(account.id, credential.id))
    } else {
      await db.insert(account).values({
        id: newId("acc"),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    console.log(`e2e-seed: updated user ${creds.email} (${userId})`)
  } else {
    userId = newId("user")
    await db.insert(user).values({
      id: userId,
      name: creds.name,
      email: creds.email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await db.insert(account).values({
      id: newId("acc"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log(`e2e-seed: created user ${creds.email} (${userId})`)
  }

  const existingOrgs = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, creds.orgSlug))
    .limit(1)

  let organizationId: string
  if (existingOrgs[0]) {
    organizationId = existingOrgs[0].id
    await db
      .update(organization)
      .set({ name: creds.orgName, plan: "credit" })
      .where(eq(organization.id, organizationId))
    console.log(`e2e-seed: updated org ${creds.orgSlug} (${organizationId})`)
  } else {
    organizationId = newId("org")
    await db.insert(organization).values({
      id: organizationId,
      name: creds.orgName,
      slug: creds.orgSlug,
      createdAt: new Date(),
      plan: "credit",
    })
    console.log(`e2e-seed: created org ${creds.orgSlug} (${organizationId})`)
  }

  const memberships = await db
    .select()
    .from(member)
    .where(eq(member.userId, userId))

  const membership = memberships.find(
    (row) => row.organizationId === organizationId
  )
  if (!membership) {
    await db.insert(member).values({
      id: newId("member"),
      organizationId,
      userId,
      role: "owner",
      createdAt: new Date(),
    })
    console.log("e2e-seed: linked user as org owner")
  } else if (membership.role !== "owner") {
    await db
      .update(member)
      .set({ role: "owner" })
      .where(eq(member.id, membership.id))
  }

  const fixtures: E2eFixtures = {
    userId,
    organizationId,
    email: creds.email,
    orgSlug: creds.orgSlug,
  }

  const { authDir, fixtures: fixturesPath } = authPaths()
  mkdirSync(authDir, { recursive: true })
  writeFileSync(fixturesPath, `${JSON.stringify(fixtures, null, 2)}\n`, "utf8")

  return fixtures
}
