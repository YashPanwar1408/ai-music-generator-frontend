 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "~/server/db";
import { inngest } from "./client";
import { env } from "~/env";

export const generateSong = inngest.createFunction(
  {
    id: "generate-song",
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    onFailure: async ({ event, error: _error }) => {
      await db.song.update({
        where: {
          id: event?.data?.event?.data?.songId,
        },
        data: {
          status: "failed",
        },
      });
    },
  },

  { event: "generate-song-event" },
  async ({ event, step }) => {
    const { songId } = event.data as {
      songId: string;
      userId: string;
    };

    const { userId, credits, endpoint, body } = await step.run(
      "check-credits",
      async () => {
        const song = await db.song.findUniqueOrThrow({
          where: {
            id: songId,
          },
          select: {
            user: {
              select: {
                id: true,
                credits: true,
              },
            },
            prompt: true,
            lyrics: true,
            fullDescribedSong: true,
            describedLyrics: true,
            instrumental: true,
            vocalLanguage: true,
            guidanceScale: true,
            inferStep: true,
            audioDuration: true,
            seed: true,
          },
        });

        type RequestBody = {
          guidance_scale?: number;
          infer_step?: number;
          audio_duration?: number;
          seed?: number;
          vocal_language?: string;
          full_described_song?: string;
          prompt?: string;
          lyrics?: string;
          described_lyrics?: string;
          instrumental?: boolean;
        };

        let endpoint = "";
        let body: RequestBody = {};

        const fullDescribedSong = song.fullDescribedSong?.trim() ?? "";
        const lyrics = song.lyrics?.trim() ?? "";
        const describedLyrics = song.describedLyrics?.trim() ?? "";
        const prompt = song.prompt?.trim() ?? "";

        const commonParams = {
          guidance_scale: song.guidanceScale ?? undefined,
          infer_step: song.inferStep ?? undefined,
          audio_duration: song.audioDuration ?? undefined,
          seed: song.seed ?? undefined,
          instrumental: song.instrumental ?? undefined,
          vocal_language: song.vocalLanguage ?? undefined,
        };

        // Description of a song
        if (fullDescribedSong.length > 0) {
          endpoint = env.GENERATE_FROM_DESCRIPTION;
          body = {
            full_described_song: fullDescribedSong,
            ...commonParams,
          };
        }

        // Custom Mode: Lyrics (+ optional prompt/styles)
        else if (lyrics.length > 0) {
          endpoint = env.GENERATE_WITH_LYRICS;
          body = {
            lyrics,
            prompt,
            ...commonParams,
          };
        }

        // Custom Mode: Described lyrics (+ optional prompt/styles)
        else if (describedLyrics.length > 0) {
          endpoint = env.GENERATE_FROM_DESCRIBED_LYRICS;
          body = {
            described_lyrics: describedLyrics,
            prompt,
            ...commonParams,
          };
        }

        if (!endpoint) {
          throw new Error(
            "Song has no valid generation inputs (missing description/lyrics/described lyrics).",
          );
        }

        return {
          userId: song.user.id,
          credits: song.user.credits,
          endpoint: endpoint,
          body: body,
        };
      },
    );

    if (credits > 0) {
      // generate the song
      await step.run("set-status-processing", async () => {
        return await db.song.update({
          where: {
            id: songId,
          },
          data: {
            status: "processing",
          },
        });
      });

      const response = await step.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Modal-Key": env.MODAL_KEY,
          "Modal-Secret": env.MODAL_SECRET,
        },
      });

      await step.run("update-song-result", async () => {
        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
          } catch {
            // ignore
          }
          console.error("Modal generation failed", {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            errorText,
          });
        }

        const responseData = response.ok
          ? ((await response.json()) as {
              s3_key: string;
              cover_image_s3_key: string;
              categories: string[];
            })
          : null;

        await db.song.update({
          where: {
            id: songId,
          },
          data: {
            s3Key: responseData?.s3_key,
            thumbnailS3Key: responseData?.cover_image_s3_key,
            status: response.ok ? "processed" : "failed",
          },
        });

        if (responseData && responseData.categories.length > 0) {
          await db.song.update({
            where: {
              id: songId,
            },
            data: {
              categories: {
                connectOrCreate: responseData.categories.map((categoryName) => ({
                  where: { name: categoryName },
                  create: { name: categoryName },
                })),
              },
            },
          });
        }
      });

      return await step.run("deduct-credits", async () => {
        if (!response.ok) return;

        return await db.user.update({
          where: {
            id: userId,
          },
          data: {
            credits: {
              decrement: 1,
            },
          },
        });
      });
    } else {
      // Set Song Status "not enough credits"
      await step.run("set-status-no-credits", async () => {
        return await db.song.update({
          where: {
            id: songId,
          },
          data: {
            status: "no credits",
          },
        });
      });
    }
  },
);
