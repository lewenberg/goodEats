import { AspectRatio } from "@/components/ui/aspect-ratio";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

const ImageSection = () => {
    const { control, watch } = useFormContext();
    const existingImageUrl = watch("imageUrl")
    return (
        <div className="space-y-4">
            <div>
                <h2 className="font-display text-4xl font-black">Image</h2>
                <FormDescription className="max-w-3xl text-base font-semibold">
                    Add an image for your restaurant listing. Uploading a new image will replace the existing one.
                </FormDescription>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.65fr)_minmax(260px,0.35fr)]">
        {existingImageUrl && (
          <AspectRatio ratio={16 / 9}>
            <img
              src={existingImageUrl}
              className="h-full w-full rounded-[1.5rem] border-2 border-slate-950 object-cover shadow-[5px_5px_0_#17201e]"
            />
          </AspectRatio>
        )}
        <FormField
          control={control}
          name="imageFile"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="h-12 rounded-full border-2 border-slate-950 bg-white font-bold file:mr-4 file:rounded-full file:border-0 file:bg-[#f6c54e] file:px-4 file:py-2 file:font-black"
                  type="file"
                  accept=".jpg, .jpeg, .png"
                  onChange={(event) =>
                    field.onChange(
                      event.target.files ? event.target.files[0] : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
        </div>
    )
}

export default ImageSection;
