import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

type Props = {
  index: number,
  removeMenuItem: () => void;
}

const MenuItemInput = ({ index, removeMenuItem }: Props) => {
  const { control } = useFormContext()
  return (
    <div className="grid gap-3 rounded-[1.25rem] border-2 border-slate-950 bg-white p-3 md:grid-cols-[1fr_170px_auto] md:items-end">
      <FormField control={control}
        name={`menuItems.${index}.name`}
        render={({ field }) =>
          <FormItem >
            <FormLabel className="flex item-center gap-1 font-black">
              Name 
            </FormLabel>
            <FormControl>
              <Input {...field}
                placeholder="Cheese Pizza"
                className="h-12 rounded-full border-2 border-slate-950 bg-card font-bold" />
            </FormControl>
            <FormMessage />
          </FormItem>} />

      <FormField control={control}
        name={`menuItems.${index}.price`}
        render={({ field }) =>
          <FormItem >
            <FormLabel className="flex item-center gap-1 font-black"> Price (₹) 
            </FormLabel>
            <FormControl>
              <Input {...field}
                placeholder="250"
                className="h-12 rounded-full border-2 border-slate-950 bg-card font-bold" />
            </FormControl>
            <FormMessage />
          </FormItem>} />
          <Button 
          type="button"
          onClick={removeMenuItem}
          className="h-12 rounded-full border-2 border-slate-950 bg-[#f05d3b] px-5 font-black text-white hover:bg-red-700">
            Remove
          </Button>
    </div>
  )
}

export default MenuItemInput;
