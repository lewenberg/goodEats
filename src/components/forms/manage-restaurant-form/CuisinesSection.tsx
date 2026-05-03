import { FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cuisineList } from "@/config/restaurant-options-config";
import { useFormContext } from "react-hook-form";
import CuisineCheckBox from "./CuisineCheckBox";

const CuisinesSection = () => {
  const {control} = useFormContext();
  return(
    <div className="space-y-4">
        <div>
            <h2 className="font-display text-4xl font-black">Cuisines</h2>
            <FormDescription className="text-base font-semibold">
                Select the cuisines that your restaurant serves
            </FormDescription>
        </div>
        <FormField control={control} name="cuisines"
        render={({field})=>(
            <FormItem>
                <div className="flex flex-wrap gap-3">
                    {cuisineList.map((cuisineItem)=> (
                        <CuisineCheckBox key={cuisineItem} cuisine={cuisineItem} field={field} />
                    ))}
                </div>
                <FormMessage/>
            </FormItem>
        )}/>
    </div>
  )
}

export default CuisinesSection;
