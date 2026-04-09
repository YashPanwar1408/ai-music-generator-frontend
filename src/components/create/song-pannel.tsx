/* eslint-disable @typescript-eslint/no-unused-vars */

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { ChevronDown, Loader2, Music, Plus } from "lucide-react"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"
import { toast } from "sonner"
import { generateSong, type GenerateRequest } from "~/actions/generation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const inspirationTags = [
    "80s synth-pop",
    "Acoustic ballad",
    "Epic movie score",
    "Lo-fi hip hop",
    "Driving rock anthem",
    "Summer beach vibe",
  ];
  
  const styleTags = [
    "Industrial rave",
    "Heavy bass",
    "Orchestral",
    "Electronic beats",
    "Funky guitar",
    "Soulful vocals",
    "Ambient pads",
  ];

const vocalLanguageOptions = [
    // Keep in sync with ACE-Step 1.5 VALID_LANGUAGES (ISO 639-1 + a few extras)
    { value: "unknown", label: "Auto (detect)" },
    { value: "en", label: "English (en)" },
    { value: "hi", label: "Hindi (hi)" },
    { value: "bn", label: "Bengali (bn)" },
    { value: "ta", label: "Tamil (ta)" },
    { value: "te", label: "Telugu (te)" },
    { value: "ur", label: "Urdu (ur)" },
    { value: "ar", label: "Arabic (ar)" },
    { value: "zh", label: "Chinese (zh)" },
    { value: "yue", label: "Cantonese (yue)" },
    { value: "ja", label: "Japanese (ja)" },
    { value: "ko", label: "Korean (ko)" },
    { value: "es", label: "Spanish (es)" },
    { value: "fr", label: "French (fr)" },
    { value: "de", label: "German (de)" },
    { value: "it", label: "Italian (it)" },
    { value: "pt", label: "Portuguese (pt)" },
    { value: "ru", label: "Russian (ru)" },
    { value: "az", label: "Azerbaijani (az)" },
    { value: "bg", label: "Bulgarian (bg)" },
    { value: "ca", label: "Catalan (ca)" },
    { value: "cs", label: "Czech (cs)" },
    { value: "da", label: "Danish (da)" },
    { value: "el", label: "Greek (el)" },
    { value: "fa", label: "Persian (fa)" },
    { value: "fi", label: "Finnish (fi)" },
    { value: "he", label: "Hebrew (he)" },
    { value: "hr", label: "Croatian (hr)" },
    { value: "ht", label: "Haitian Creole (ht)" },
    { value: "hu", label: "Hungarian (hu)" },
    { value: "id", label: "Indonesian (id)" },
    { value: "is", label: "Icelandic (is)" },
    { value: "la", label: "Latin (la)" },
    { value: "lt", label: "Lithuanian (lt)" },
    { value: "ms", label: "Malay (ms)" },
    { value: "ne", label: "Nepali (ne)" },
    { value: "nl", label: "Dutch (nl)" },
    { value: "no", label: "Norwegian (no)" },
    { value: "pa", label: "Punjabi (pa)" },
    { value: "pl", label: "Polish (pl)" },
    { value: "ro", label: "Romanian (ro)" },
    { value: "sa", label: "Sanskrit (sa)" },
    { value: "sk", label: "Slovak (sk)" },
    { value: "sr", label: "Serbian (sr)" },
    { value: "sv", label: "Swedish (sv)" },
    { value: "sw", label: "Swahili (sw)" },
    { value: "th", label: "Thai (th)" },
    { value: "tl", label: "Tagalog (tl)" },
    { value: "tr", label: "Turkish (tr)" },
    { value: "uk", label: "Ukrainian (uk)" },
    { value: "vi", label: "Vietnamese (vi)" },
] as const

export function SongPanel(){

    const [mode, setMode] = useState<"simple" | "custom">("simple")
    const [description, setDescription] = useState("")
    const [instrumental,setInstrumental] = useState(false)  
    const [vocalLanguage, setVocalLanguage] = useState("unknown")
    const [lyricsMode, setLyricsMode] = useState<"write" | "auto">("write")
    const [lyrics, setLyrics] = useState("")
    const [styleInput, setStyleInput] = useState("")
    const [loading, setLoading] = useState(false)

    const selectedVocalLanguage =
        vocalLanguageOptions.find((opt) => opt.value === vocalLanguage) ?? vocalLanguageOptions[0]

    const renderVocalLanguagePicker = () => (
        <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Vocal language</label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                        disabled={instrumental}
                    >
                        <span>{selectedVocalLanguage.label}</span>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    {vocalLanguageOptions.map((opt) => (
                        <DropdownMenuItem
                            key={opt.value}
                            onClick={() => setVocalLanguage(opt.value)}
                        >
                            {opt.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {instrumental && (
                <p className="text-muted-foreground text-xs">
                    Disabled for instrumental songs.
                </p>
            )}
        </div>
    )


    const handleInspirationTagClick = (tag: string) => {
        const currentTags = description.split(", ").map((s) => s.trim()).filter((s) => s)

        if(!currentTags.includes(tag)){
            if(description.trim() === ""){
                setDescription(tag)
            }else{
                setDescription(description + ", " + tag)
            }
        }   
    }

    const handleStyleTagClick = (tag: string) => {
        const currentStyle = styleInput.split(", ").map((s) => s.trim()).filter((s) => s)

        if(!currentStyle.includes(tag)){
            if(styleInput.trim() === ""){
                setStyleInput(tag)
            }else{
                setStyleInput(styleInput + ", " + tag)
            }
        }   
    }


    const handleCreate = async () => {
        if (mode === "simple" && !description.trim()){
            toast.error("Please describe your song before creating.")
            return
        }

        if (mode === "custom"){
            // Lyrics are compulsory, check them first
            if(!lyrics.trim() && lyricsMode === "auto"){
                toast.error("Please describe your lyrics")
                return
            }

            if(!lyrics.trim() && lyricsMode === "write"){
                toast.error("Please enter your lyrics")
                return
            }

            // Style is optional, no validation needed
        }

        // Generate Song
        let requestBody: GenerateRequest;
        const resolvedVocalLanguage = instrumental ? "unknown" : (vocalLanguage.trim() || "unknown")

        if (mode === "simple"){
            requestBody = {
                fullDescribedSong: description,
                instrumental,
                vocalLanguage: resolvedVocalLanguage,
            }
        }  else {
            const prompt = styleInput.trim();
            if (lyricsMode === "write"){
                requestBody = {
                    prompt,
                    lyrics,
                    instrumental,
                    vocalLanguage: resolvedVocalLanguage,
                }
            } else {
                requestBody = {
                    prompt, 
                    describedLyrics: lyrics,
                    instrumental,
                    vocalLanguage: resolvedVocalLanguage,
                }
            }
        }

        try {
            setLoading(true)
            await generateSong(requestBody)
            setDescription("")
            setLyrics("")
            setStyleInput("")
            setVocalLanguage("unknown")
        } catch (error) {
            toast.error("Failed to generate song")
        } finally{
            setLoading(false)
        }



    }

    return(
        <div
        className="bg-muted/30 flex w-full flex-col border-r lg:w-80 "
        >
            <div
            className="flex-1 overflow-y-auto p-4"
            >   
                <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as "simple" | "custom")}
                >
                    <TabsList
                    className="w-full"
                    >
                        <TabsTrigger
                        value="simple"
                        >
                            Simple
                        </TabsTrigger>
                        <TabsTrigger
                        value="custom"
                        >
                            Custom
                        </TabsTrigger>
                    </TabsList>
                    {/* --------------------- */}
                    <TabsContent
                    value="simple"
                    className="mt-6 space-y-6"
                    >
                        <div
                        className="flex flex-col gap-3"
                        >
                            <label 
                            className="text-sm font-medium">
                                Describe your song
                            </label>
                            <Textarea
                            placeholder="A dreamy lofi hip hop song, perfect for studying or relaxing."
                            className="min-h-30 resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Lyrics button & Instrumental Toggle */}
                        <div
                        className="flex items-center justify-between "
                        >
                            <Button
                            variant={`outline`}
                            size={`sm`}
                            onClick={() => setMode("custom")}
                            >
                                <Plus
                                className="mr-2"
                                /> 
                                Lyrics
                            </Button>
                            <div
                            className="flex items-center gap-2"
                            >
                                <label 
                                className="text-sm font-medium"
                                >
                                    Instrumental
                                </label>
                                <Switch
                                checked={instrumental}
                                onCheckedChange={setInstrumental}
                                />
                            </div>
                        </div>

                        {renderVocalLanguagePicker()}

                        <div
                        className="flex flex-col gap-3"
                        >
                            <label
                            className="text-sm font-medium"
                            >
                                Inspiration
                            </label>
                            <div
                            className="w-full overflow-x-auto whitespace-nowrap"
                            >
                                <div
                                className="flex gap-2 pb-2" 
                                >
                                    {inspirationTags.map((tag) => (
                                        <Button
                                        variant={`outline`}
                                        className="h-7 flex shrink-0 bg-transparent text-xs"
                                        size={`sm`}
                                        key={tag}
                                        onClick={() => handleInspirationTagClick(tag)}
                                        >
                                            <Plus
                                            className="mr-1"
                                            /> 
                                            {tag}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </TabsContent>
                    <TabsContent
                    value="custom"
                    >
                        <p>
                            Custom 
                        </p>
                    </TabsContent>

                    <TabsContent
                    value="custom"
                    className="mt-6 space-y-6"
                    >
                        <div
                        className="flex flex-col gap-3"
                        >
                            <div
                            className="flex items-center justify-between"
                            >
                                <label
                                className="text-sm font-medium"
                                >
                                    Lyrics
                                </label>
                                <div
                                className="flex items-center gap-1"
                                >
                                    <Button
                                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                                    className="h-7 text-xs"
                                    size={`sm`}
                                    onClick={() => {
                                        setLyricsMode(`auto`)
                                        setLyrics("")
                                    }}
                                    >
                                        Auto
                                    </Button>

                                    <Button
                                    variant={lyricsMode === "write" ? "secondary" : "ghost"}
                                    className="h-7 text-xs"
                                    size={`sm`}
                                    onClick={() => {
                                        setLyricsMode(`write`)
                                        setLyrics("")
                                    }}
                                    >
                                        Write
                                    </Button>
                                </div>
                            </div>
                        <Textarea 
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="min-h-25 resize-none "
                        placeholder={lyricsMode === "write" ? "Add your own lyrics here" : "Describe your lyrics, e.g., a sad song about lost love"}
                        />

                        </div>

                        <div
                            className="flex items-center justify-between"
                            >
                                <label 
                                className="text-sm font-medium"
                                >
                                    Instrumental
                                </label>
                                <Switch
                                checked={instrumental}
                                onCheckedChange={setInstrumental}
                                />
                            </div>

                        {renderVocalLanguagePicker()}

                        {/* Styles  */}
                        <div
                        className="flex flex-col gap-3"
                        >
                            <label
                            className="text-sm font-medium"
                            
                            >
                                Styles
                            </label>
                        <Textarea 
                        value={styleInput}
                        onChange={(e) => setStyleInput(e.target.value)}
                        className="min-h-15 resize-none "
                        placeholder="Enter style tags"
                        />
                        <div
                        className="w-full overflow-x-auto whitespace-nowrap"
                        >
                            <div
                            className="flex gap-2 pb-2"
                            >       
                                {
                                    styleTags.map((tag) => (
                                        <Badge
                                        variant={`secondary`}
                                        key={tag}
                                        className="hover:bg-secondary/50 flex shrink-0 cursor-pointer text-xs"
                                        onClick={() => handleStyleTagClick(tag)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))
                                }
                            </div>
                        </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            <div
            className="border-t p-4"
            >
                <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full cursor-pointer bg-linear-to-r from-orange-300 to-orange-500 font-medium text-white hover:from-orange-400 hover:to-orange-600 "
                >
                    {loading ?  <Loader2 className="animate-spin" /> : <Music />}
                    {loading ? "Creating... " : "Create"}
                </Button>
            </div>
        </div>
    )
}