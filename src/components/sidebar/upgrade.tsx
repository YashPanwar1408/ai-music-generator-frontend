"use client"

import { authClient } from "~/lib/auth-client"
import { Button } from "../ui/button"

export default function Upgrade(){

    const checkout = authClient.checkout as (options: { products: string[] }) => Promise<unknown>

    const upgrade = async() => {
        await checkout({
            products:[
                "4b89547e-3f66-49f4-bd84-01ff93cb9584",
                "173ca5f0-1378-442a-b445-56312fe9c565",
                "44cb33c6-6ab6-4ec3-84fd-a40bdf1a8361"
            ]
        })
    }

    return <Button
    variant={`outline`}
    size={`sm`}
    className="ml-2 cursor-pointer text-orange-400"
    onClick={upgrade}
    >       
        Upgrade
    </Button>

}