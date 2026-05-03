import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

type Props = {
    cuisine: string;
    field: ControllerRenderProps<FieldValues, "cuisines">;
}

const CuisineCheckBox = ({ cuisine, field }: Props) => {
    return (
        <FormItem className="mt-2 flex flex-row items-center space-x-2 space-y-0 rounded-full border-2 border-slate-950 bg-white px-3 py-2">
            <FormControl>
                <Checkbox
                    className="border-2 border-slate-950 data-[state=checked]:bg-[#f05d3b] data-[state=checked]:text-white"
                    checked={field.value.includes(cuisine)}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            field.onChange([...field.value, cuisine]);
                        }
                        else {
                            field.onChange(
                                field.value.filter((value: string) => value !== cuisine)
                            );}
                    }} />
            </FormControl>
            <FormLabel className="text-sm font-black">{cuisine}</FormLabel>
        </FormItem >
    )
}

export default CuisineCheckBox;
