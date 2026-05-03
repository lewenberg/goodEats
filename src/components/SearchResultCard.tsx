import { Restaurant } from "@/types";
import { Link } from "react-router-dom";
import { AspectRatio } from "./ui/aspect-ratio";
import { Banknote, Clock, Dot } from "lucide-react";

type Props = {
    restaurant: Restaurant
}

const SearchResultCard = ({ restaurant }: Props) => {
    return (
        <Link to={`/detail/${restaurant._id}`}
            className="restaurant-panel-soft group grid gap-4 overflow-hidden rounded-[1.5rem] p-3 transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#17201e] md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
            <AspectRatio ratio={16 / 6}>
                <img
                    src={restaurant.imageUrl}
                    className="h-full w-full rounded-[1.15rem] border-2 border-slate-950 object-cover"
                    alt={restaurant.restaurantName} />
            </AspectRatio>
            <div className="flex min-w-0 flex-col justify-between gap-4 p-1">
                <h3 className="font-display text-4xl font-black leading-none tracking-normal group-hover:text-[#f05d3b]">{restaurant.restaurantName}</h3>
                <div id="card-content" className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="flex flex-row flex-wrap text-sm font-bold text-slate-600">
                        {restaurant.cuisines.map((item, index) => (
                            <span className="flex" key={`${restaurant._id}-${item}`}>
                                <span>{item}</span>
                                {index < restaurant.cuisines.length - 1 && <Dot />}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 md:flex-col">
                        <div className="inline-flex items-center rounded-full border-2 border-slate-950 bg-[#f6c54e] px-3 py-2 text-sm font-black text-slate-950">
                            <Clock className="h-4 w-4 text-slate-950"/> 
                            &nbsp;{restaurant.estimatedDeliveryTime} mins
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border-2 border-slate-950 bg-white px-3 py-2 text-sm font-black">
                            <Banknote className="h-4 w-4" />
                            Delivery from ₹{restaurant.deliveryPrice.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default SearchResultCard;
