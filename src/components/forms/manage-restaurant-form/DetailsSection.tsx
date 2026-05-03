import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

const DetailsSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-display text-4xl font-black">Details</h2>
                <FormDescription className="text-base font-semibold">
                    Enter the details about your Restaurant
                </FormDescription>
            </div>
            <FormField
                control={control}
                name="restaurantName"
                render={({ field }) =>
                    <FormItem>
                        <FormLabel className="font-black">Name</FormLabel>
                        <FormControl><Input {...field} className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={control}
                    name="city"
                    render={({ field }) =>
                        <FormItem className="flex-1">
                            <FormLabel className="font-black">City</FormLabel>
                            <FormControl><Input {...field} className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold" />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>}
                />

                <FormField
                    control={control}
                    name="country"
                    render={({ field }) =>
                        <FormItem className="flex-1">
                            <FormLabel className="font-black">Country</FormLabel>
                            <FormControl><Input {...field} className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold"/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>}
                />
            </div>

            <FormField
                control={control}
                name="deliveryPrice"
                render={({ field }) =>
                    <FormItem>
                        <FormLabel className="font-black">Delivery Price (₹)</FormLabel>
                        <FormControl>
                            <Input {...field} 
                            className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold md:max-w-xs" 
                            placeholder="2.50"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>}
            />

            <FormField
                control={control}
                name="estimatedDeliveryTime"
                render={({ field }) =>
                    <FormItem>
                        <FormLabel className="font-black">Estimated Delivery Time (minutes)</FormLabel>
                        <FormControl>
                            <Input {...field} 
                            className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold md:max-w-xs"
                            placeholder="30"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>}
            />
        </div>
    )
}

export default DetailsSection;
