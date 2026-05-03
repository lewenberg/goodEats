import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect } from "react";

const formSchema = z.object({
    searchQuery: z.string({
        required_error: "Restaurant name is required",
    }),
})

export type SearchForm = z.infer<typeof formSchema>;

type Props = {
    onSubmit: (formData: SearchForm) => void
    placeHolder: string;
    onReset?: () => void;
    searchQuery?: string;
}

const SearchBar = ({ onSubmit, onReset, placeHolder, searchQuery }: Props) => {
    const form = useForm<SearchForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            searchQuery,
        }
    });

    useEffect(() => {
        form.reset({ searchQuery })
    }, [form, searchQuery]);

    const handleReset = () => {
        form.reset({
            searchQuery: "",
        });
        if (onReset) {
            onReset();
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={`restaurant-panel-soft flex flex-col items-stretch justify-between gap-3 rounded-[1.5rem] p-3 sm:flex-row sm:items-center 
                ${form.formState.errors.searchQuery && "border-red-500"}`}>
                <Search
                    strokeWidth={2.5}
                    className="ml-1 hidden text-[#f05d3b] md:block"
                />
                <FormField
                    control={form.control}
                    name="searchQuery"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input
                                    {...field}
                                    className="h-12 rounded-full border-2 border-slate-950 bg-white px-4 text-base font-bold shadow-none focus-visible:ring-0 sm:text-lg"
                                    placeholder={placeHolder} />
                            </FormControl>
                        </FormItem>)}
                />
                <Button
                    onClick={handleReset}
                    type="button"
                    className="rounded-full border-2 border-slate-950 bg-white font-black text-slate-950 hover:bg-amber-50">
                    Reset
                </Button>

                <Button
                    type="submit"
                    className="rounded-full border-2 border-slate-950 bg-[#17201e] font-black text-amber-50 shadow-[3px_3px_0_#f05d3b] hover:bg-emerald-900">
                    Search
                </Button>
            </form>
        </Form>
    )
}

export default SearchBar;
