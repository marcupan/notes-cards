"use client";
import {useState} from "react";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useAction} from "convex/react";
import {api} from "@/convex/_generated/api";
import {Id} from "@/convex/_generated/dataModel";
import {useAppStore} from "@/lib/store";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ToastProvider";
import {friendlyError} from "@/lib/errors";

const chineseRegex = /\p{Script=Han}/u; // at least one Han character
const FormSchema = z.object({
    originalWord: z
        .string()
        .min(1, "Enter a Chinese word")
        .max(20, "Keep it 20 characters or fewer")
        .refine((s) => chineseRegex.test(s), {
            message: "Please enter at least one Chinese character",
        })
        .transform((s) => s.trim()),
});

type FormValues = z.infer<typeof FormSchema>;

export default function CardNewForm() {
    const {selectedFolderId} = useAppStore();
    const generateCard = useAction(api.generateCard.generateCard);
    const {push} = useToast();
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(FormSchema)});

    const onSubmit = async (values: FormValues) => {
        if (!selectedFolderId) {
            push({type: "error", description: "Select a folder first"});
            return;
        }
        setLoading(true);
        try {
            await generateCard({
                originalWord: values.originalWord,
                folderId: selectedFolderId as Id<"folders">,
            });
            reset();
            push({type: "success", description: "Card generated"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <div className="flex gap-2">
                <Input placeholder="Enter Chinese word" {...register("originalWord")}/>
                <Button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</Button>
            </div>
            {errors.originalWord && (
                <span className="text-sm text-red-600">{errors.originalWord.message}</span>
            )}
        </form>
    );
}
