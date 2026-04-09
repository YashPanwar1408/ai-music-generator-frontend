"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { inngest } from "~/inngest/client"
import { auth } from "~/lib/auth"
import { db } from "~/server/db"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "~/env"

export interface GenerateRequest {
    prompt?: string
    lyrics?: string
    fullDescribedSong?: string
    describedLyrics?: string
    instrumental?: boolean
    vocalLanguage?: string
}

function normalizeVocalLanguage(value?: string) {
    const normalized = (value ?? "").trim().toLowerCase()
    return normalized.length > 0 ? normalized : "unknown"
}

export async function  generateSong(generateRequest: GenerateRequest ) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session){
        redirect("/auth/sign-in")
    }

    // Two variants: turbo is tuned for ~8 steps; a slightly higher step count can
    // sometimes refine details while staying within turbo's intended range.
    await queueSong(generateRequest, 1, 8, session.user.id)
    await queueSong(generateRequest, 1, 12, session.user.id)
    
    revalidatePath("/create")

}

export async function queueSong(
    generateRequest: GenerateRequest,
    guidanceScale: number,
    inferStep: number,
    userId: string,
) {
    const instrumental = generateRequest.instrumental ?? false

    const promptTrimmed = generateRequest.prompt?.trim()
    const prompt = promptTrimmed && promptTrimmed.length > 0 ? promptTrimmed : undefined

    const lyricsTrimmed = generateRequest.lyrics?.trim()
    const lyrics = lyricsTrimmed && lyricsTrimmed.length > 0 ? lyricsTrimmed : undefined

    const describedLyricsTrimmed = generateRequest.describedLyrics?.trim()
    const describedLyrics =
        describedLyricsTrimmed && describedLyricsTrimmed.length > 0
            ? describedLyricsTrimmed
            : undefined

    const fullDescribedSongTrimmed = generateRequest.fullDescribedSong?.trim()
    const fullDescribedSong =
        fullDescribedSongTrimmed && fullDescribedSongTrimmed.length > 0
            ? fullDescribedSongTrimmed
            : undefined
    const vocalLanguage = instrumental
        ? "unknown"
        : normalizeVocalLanguage(generateRequest.vocalLanguage)

    let title = "Untitled"
    if (describedLyrics) title = describedLyrics
    if (fullDescribedSong) title = fullDescribedSong

    title = title.charAt(0).toUpperCase() + title.slice(1);

    const song = await db.song.create({
        data:{
            userId: userId,
            title: title,
            prompt,
            lyrics,
            describedLyrics,
            fullDescribedSong,
            instrumental,
            vocalLanguage,
            guidanceScale: guidanceScale,
            inferStep: inferStep,
            audioDuration: 180
        }
    })

    await inngest.send({
        name: "generate-song-event",
        data:{
            songId: song.id,
            userId: song.userId
        }
    })
}

export async function getPlayUrl(songId:string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session){
        redirect("/auth/sign-in")
    }

    const song = await db.song.findUniqueOrThrow({
        where:{
            id: songId,
            OR: [{
                userId: session.user.id
            },
            {
                published: true
            }
        ],
        s3Key: {
            not: null
        }
        },

        select:{
            s3Key: true
        }
    })
        
    await db.song.update({
        where:{
            id: songId
        },
        data:{
            listenCount: {
                increment: 1
            }
        }
    })

    return await getPresignedUrl(song.s3Key!)

}


export async function getPresignedUrl(key:string) {

    const s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
    });
    
    const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key
    })

    return await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
    })
}