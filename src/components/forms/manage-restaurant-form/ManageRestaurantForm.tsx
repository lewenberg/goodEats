import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DetailsSection from "./DetailsSection";
import { Separator } from "@/components/ui/separator";
import CuisinesSection from "./CuisinesSection";
import MenuSection from "./MenuSection";
import ImageSection from "./ImageSection";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/types";
import { useEffect } from "react";

const formSchema = z.object({
  restaurantName: z.string({
    required_error: "restaurant name is required"
  }),

  city: z.string({
    required_error: "city name is required"
  }),

  country: z.string({
    required_error: "country name is required"
  }),

  deliveryPrice: z.coerce.number({
    required_error: "delivery price is required",
    invalid_type_error: "delivery price must be a number",
  }),

  estimatedDeliveryTime: z.coerce.number({
    required_error: "estimated delivery time is required",
    invalid_type_error: "delivery time must be a number",
  }),

  cuisines: z.array(z.string()).nonempty({
    message: "please select at least one item"
  }),

  menuItems: z.array(z.object({
    name: z.string().min(1, "name is required"),
    price: z.coerce.number().min(1, "price is required")
  })),

  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File, { message: "image is required" }),
}).refine((data) => data.imageUrl || data.imageFile, {
  message: "Either image URL or image file must be provided",
  path: ["imageFile"],
})

type RestaurantFormData = z.infer<typeof formSchema>;

type Props = {
  restaurant?: Restaurant;
  onSave: (restaurantFormData: FormData) => void;
  isLoading: boolean;
};

const ManageRestaurantForm = ({ onSave, isLoading, restaurant }: Props) => {
  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cuisines: [],
      menuItems: [{ name: "", price: 0 }],
    },
  });

  useEffect(() => {
    if (!restaurant) {
      return;
    }

    // price lowest domination of 100 = 100pence == 1GBP
    const deliveryPriceFormatted = parseInt(
      (restaurant.deliveryPrice).toFixed(2)
    );

    const menuItemsFormatted = restaurant.menuItems.map((item) => ({
      ...item,
      price: parseInt((item.price).toFixed(2)),
    }));

    const updatedRestaurant = {
      ...restaurant,
      deliveryPrice: deliveryPriceFormatted,
      menuItems: menuItemsFormatted,
    };

    form.reset(updatedRestaurant);
  }, [form, restaurant]);

  const onSubmit = (formDataJson: RestaurantFormData) => {
    //convert formDataJson to a new FormData object
    const formData = new FormData();

    formData.append("restaurantName", formDataJson.restaurantName);
    formData.append("city", formDataJson.city);
    formData.append("country", formDataJson.country);
    formData.append("deliveryPrice", (formDataJson.deliveryPrice).toString());
    formData.append("estimatedDeliveryTime", formDataJson.estimatedDeliveryTime.toString());

    formDataJson.cuisines.forEach((cuisine, index) => {
      formData.append(`cuisines[${index}]`, cuisine);
    });

    formDataJson.menuItems.forEach((menuItem, index) => {
      formData.append(`menuItems[${index}][name]`, menuItem.name);
      formData.append(`menuItems[${index}][price]`, (menuItem.price).toString());
    });

    if (formDataJson.imageFile) {
      formData.append(`imageFile`, formDataJson.imageFile);
    }

    onSave(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="restaurant-panel mx-auto max-w-6xl space-y-8 rounded-[2rem] p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-3 border-b-2 border-slate-950 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#f05d3b]">Owner command center</p>
            <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">Restaurant studio</h1>
          </div>
          <p className="max-w-md text-sm font-semibold text-slate-600">
            Shape the storefront, tune delivery details, and keep the menu ready for hungry people.
          </p>
        </div>
        <DetailsSection />
        <Separator />
        <CuisinesSection />
        <Separator />
        <MenuSection />
        <Separator />
        <ImageSection />
        {isLoading ? <LoadingButton /> : (
          <Button type="submit" className="h-12 rounded-full border-2 border-slate-950 bg-[#17201e] px-8 font-black text-amber-50 shadow-[3px_3px_0_#f05d3b] hover:bg-emerald-900">
            Submit
          </Button>
        )}
      </form>
    </Form>
  )
}

export default ManageRestaurantForm;
