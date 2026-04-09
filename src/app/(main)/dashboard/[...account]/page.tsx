import { DashboardAccountView } from "./view"

export default async function AccountPage({
    params
}: {
    params: Promise<{ account: string[]}>
}) {
    const { account } = await params
    const pathname = `/dashboard/${account?.join("/") || "settings"}`

    return <DashboardAccountView pathname={pathname} />
}