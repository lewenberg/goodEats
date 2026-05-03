import { appApi } from "@/api/AppApi";
import { AuthUser, useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuItem, Order, Restaurant, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Clock,
  Minus,
  Plus,
  ReceiptText,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  UserRound,
  Utensils,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CartLine = { item: MenuItem; quantity: number };
type OrderDraft = Record<string, CartLine>;

const EMPTY_RESTAURANTS: Restaurant[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_USERS: User[] = [];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);

const blankRestaurant = (): Partial<Restaurant> => ({
  restaurantName: "",
  city: "New York",
  country: "USA",
  ownerId: null,
  deliveryPrice: 299,
  estimatedDeliveryTime: 30,
  cuisines: ["American"],
  imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
  menuItems: [{ _id: `item-${Date.now()}`, name: "Signature Plate", price: 1299, description: "House favorite" }],
  isActive: true,
});

const roleConfig = {
  admin: { icon: Shield, label: "Full system control", color: "bg-slate-950 text-white" },
  owner: { icon: Store, label: "Menu and order control", color: "bg-emerald-700 text-white" },
  customer: { icon: UserRound, label: "Browse and order", color: "bg-amber-500 text-slate-950" },
};

const menuItemSchema = z.object({
  _id: z.string().min(1),
  name: z.string().trim().min(2, "Menu item names need at least 2 characters"),
  description: z.string().trim().optional(),
  price: z.coerce.number().int().positive("Menu item prices must be greater than 0"),
});

const restaurantFormSchema = z.object({
  _id: z.string().optional(),
  restaurantName: z.string().trim().min(2, "Restaurant name needs at least 2 characters"),
  city: z.string().trim().min(2, "City is required"),
  country: z.string().trim().min(2, "Country is required"),
  ownerId: z.string().nullable().optional(),
  deliveryPrice: z.coerce.number().int().nonnegative("Delivery price cannot be negative"),
  estimatedDeliveryTime: z.coerce.number().int().positive("ETA must be greater than 0"),
  cuisines: z.array(z.string().trim().min(1)).min(1, "Add at least one cuisine"),
  imageUrl: z.string().trim().url("Image must be a valid URL"),
  menuItems: z.array(menuItemSchema).min(1, "Add at least one menu item"),
  isActive: z.boolean().optional(),
});

const appQueryKeys = {
  restaurants: (token: string) => ["app", "restaurants", token] as const,
  orders: (token: string) => ["app", "orders", token] as const,
  users: (token: string, role?: string) => ["app", "users", token, role] as const,
};

const HomePage = () => {
  const { user, accounts, loginAs, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [cart, setCart] = useState<OrderDraft>({});
  const [query, setQuery] = useState("");
  const [restaurantForm, setRestaurantForm] = useState<Partial<Restaurant>>(blankRestaurant());

  const token = getAccessToken();
  const restaurantsQuery = useQuery({
    queryKey: appQueryKeys.restaurants(token),
    queryFn: () => appApi.getRestaurants(token),
    enabled: Boolean(token),
  });
  const ordersQuery = useQuery({
    queryKey: appQueryKeys.orders(token),
    queryFn: () => appApi.getOrders(token),
    enabled: Boolean(token),
  });
  const usersQuery = useQuery({
    queryKey: appQueryKeys.users(token, user?.role),
    queryFn: () => appApi.getUsers(token),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const restaurants = restaurantsQuery.data ?? EMPTY_RESTAURANTS;
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const users = usersQuery.data ?? EMPTY_USERS;
  const selectedRestaurant = restaurants.find((restaurant) => restaurant._id === selectedRestaurantId);
  const cartLines = Object.values(cart);
  const subtotal = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const delivery = selectedRestaurant ? selectedRestaurant.deliveryPrice : 0;
  const total = subtotal + delivery;

  const ownerOptions = accounts.filter((account) => account.role === "owner");
  const visibleRestaurants = useMemo(() => {
    const search = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      if (!restaurant.isActive && user?.role === "customer") return false;
      if (!search) return true;
      return [restaurant.restaurantName, restaurant.city, ...restaurant.cuisines]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [query, restaurants, user?.role]);

  const refreshAppData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["app", "restaurants"] }),
      queryClient.invalidateQueries({ queryKey: ["app", "orders"] }),
      queryClient.invalidateQueries({ queryKey: ["app", "users"] }),
    ]);
  };

  const saveRestaurantMutation = useMutation({
    mutationFn: (payload: z.infer<typeof restaurantFormSchema>) => {
      if (payload._id) return appApi.updateRestaurant(token, payload._id, payload);
      return appApi.createRestaurant(token, payload);
    },
    onSuccess: async (_, payload) => {
      toast.success(payload._id ? "Restaurant updated" : "Restaurant created");
      setRestaurantForm(blankRestaurant());
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id: string) => appApi.deleteRestaurant(token, id),
    onSuccess: async () => {
      toast.success("Restaurant removed");
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!user || !selectedRestaurant) throw new Error("Select a restaurant before ordering");
      return appApi.createOrder(token, {
        restaurantId: selectedRestaurant._id,
        items: cartLines.map((line) => ({ menuItemId: line.item._id, quantity: line.quantity })),
        deliveryName: user.name,
        deliveryAddress: "Saved demo address",
      });
    },
    onSuccess: async (order) => {
      setCart({});
      toast.success(`Order ${order.orderId} placed`);
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      appApi.updateOrderStatus(token, orderId, status),
    onSuccess: async () => {
      toast.success("Order status updated");
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  useEffect(() => {
    if (!selectedRestaurantId && visibleRestaurants[0]) {
      setSelectedRestaurantId(visibleRestaurants[0]._id);
    }
  }, [selectedRestaurantId, visibleRestaurants]);

  const editRestaurant = (restaurant: Restaurant) => {
    setRestaurantForm({ ...restaurant });
    setSelectedRestaurantId(restaurant._id);
  };

  const addMenuItem = () => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: [
        ...(current.menuItems || []),
        { _id: `item-${Date.now()}`, name: "New menu item", price: 1099, description: "Freshly added" },
      ],
    }));
  };

  const updateMenuItem = (index: number, patch: Partial<MenuItem>) => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: (current.menuItems || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const removeMenuItem = (index: number) => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: (current.menuItems || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveRestaurant = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const parsed = restaurantFormSchema.safeParse({
      ...restaurantForm,
      cuisines: (restaurantForm.cuisines || []).map((cuisine) => cuisine.trim()).filter(Boolean),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the restaurant form");
      return;
    }

    saveRestaurantMutation.mutate(parsed.data);
  };

  const deleteRestaurant = async (id: string) => {
    if (!token) return;
    deleteRestaurantMutation.mutate(id);
  };

  const addToCart = (item: MenuItem) => {
    setCart((current) => ({
      ...current,
      [item._id]: { item, quantity: (current[item._id]?.quantity || 0) + 1 },
    }));
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const line = current[itemId];
      if (!line) return current;
      const quantity = line.quantity + delta;
      if (quantity <= 0) {
        const rest = { ...current };
        delete rest[itemId];
        return rest;
      }
      return { ...current, [itemId]: { ...line, quantity } };
    });
  };

  const placeOrder = async () => {
    if (!user || !token || !selectedRestaurant) return;
    createOrderMutation.mutate();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  if (!user) {
    return <LoginPage accounts={accounts} onLogin={loginAs} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="restaurant-panel relative isolate grid min-h-[520px] overflow-hidden rounded-[2rem] bg-[#17201e] text-amber-50 sm:rounded-[2.5rem] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="absolute left-5 top-5 hidden h-24 w-24 rounded-full border-2 border-amber-50/30 sm:block" />
        <div className="absolute bottom-8 left-[44%] hidden h-3 w-40 -rotate-12 bg-[#f6c54e] lg:block" />
        <div className="relative z-10 flex flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-amber-50/70 bg-amber-50 px-3 py-1 text-xs font-black uppercase text-slate-950">
              <Utensils className="h-4 w-4 text-[#f05d3b]" />
              Live demo workspace
            </div>
            <h1 className="font-display max-w-4xl text-5xl font-black leading-[0.9] tracking-normal sm:text-7xl lg:text-8xl">
              Run restaurants, manage menus, and order dinner from one place.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-amber-50/75 sm:text-lg">
              A full restaurant operating table for admins and owners, with a customer ordering lane that stays thumb-friendly.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric icon={Store} label="Restaurants" value={restaurants.length} />
            <Metric icon={ClipboardList} label="Orders" value={orders.length} />
            <Metric icon={UserRound} label="Demo users" value={accounts.length} />
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden border-t-2 border-amber-50/20 lg:border-l-2 lg:border-t-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop"
            className="h-full min-h-[360px] w-full object-cover"
            alt="Prepared restaurant dishes"
          />
          <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["kitchen", "orders", "menus"].map((label) => (
              <span key={label} className="rounded-full border-2 border-slate-950 bg-amber-50 px-3 py-2 text-center text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#17201e]">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {user.role === "customer" ? (
        <CustomerExperience
          restaurants={visibleRestaurants}
          selectedRestaurant={selectedRestaurant}
          selectedRestaurantId={selectedRestaurantId}
          setSelectedRestaurantId={(id) => {
            setSelectedRestaurantId(id);
            setCart({});
          }}
          query={query}
          setQuery={setQuery}
          cartLines={cartLines}
          subtotal={subtotal}
          delivery={delivery}
          total={total}
          addToCart={addToCart}
          changeQuantity={changeQuantity}
          placeOrder={placeOrder}
          orders={orders}
        />
      ) : (
        <ManagementExperience
          role={user.role}
          restaurants={restaurants}
          users={users}
          ownerOptions={ownerOptions}
          restaurantForm={restaurantForm}
          setRestaurantForm={setRestaurantForm}
          saveRestaurant={saveRestaurant}
          isSaving={saveRestaurantMutation.isPending}
          editRestaurant={editRestaurant}
          deleteRestaurant={deleteRestaurant}
          addMenuItem={addMenuItem}
          updateMenuItem={updateMenuItem}
          removeMenuItem={removeMenuItem}
          orders={orders}
          updateOrderStatus={updateOrderStatus}
        />
      )}
    </div>
  );
};

const LoginPage = ({ accounts, onLogin }: { accounts: AuthUser[]; onLogin: (userId: string) => void }) => (
  <div className="mx-auto flex min-h-[72vh] w-full max-w-6xl items-center">
    <section className="restaurant-panel grid w-full overflow-hidden rounded-[2rem] bg-card lg:grid-cols-[0.82fr_1.18fr]">
      <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-[#17201e] p-6 text-amber-50 sm:p-8">
        <div className="absolute -right-16 top-10 h-44 w-44 rounded-full border-[22px] border-[#f05d3b]" />
        <div className="absolute bottom-14 right-10 h-5 w-40 -rotate-12 bg-[#f6c54e]" />
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-50 bg-[#f05d3b] shadow-[4px_4px_0_#f6c54e]">
            <ChefHat className="h-7 w-7" />
          </div>
          <p className="mt-8 text-xs font-black uppercase text-[#f6c54e]">GoodEats access</p>
          <h1 className="font-display mt-4 max-w-md text-6xl font-black leading-[0.9] sm:text-7xl">Choose your workspace.</h1>
        </div>

        <div className="grid gap-3">
          <Step label="Admin" title="Full system access" />
          <Step label="Owner" title="Restaurant menu tools" />
          <Step label="Customer" title="Ordering workspace" />
        </div>
      </div>

      <div className="flex min-h-[560px] flex-col">
        <div className="border-b-2 border-slate-950 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-amber-50">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-slate-500">Sign in</p>
              <p className="font-display text-xl font-black text-slate-950">GoodEats Restaurant OS</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center p-4 sm:p-6 md:p-8">
          <div className="divide-y-2 divide-slate-950 overflow-hidden rounded-[1.5rem] border-2 border-slate-950 bg-white">
            {accounts.map((account) => {
              const config = roleConfig[account.role];
              const Icon = config.icon;

              return (
                <button
                  key={account.userId}
                  type="button"
                  onClick={() => onLogin(account.userId)}
                  className="group grid w-full grid-cols-[auto_1fr] items-center gap-4 px-4 py-4 text-left transition hover:bg-[#f6c54e] focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2 sm:grid-cols-[auto_1fr_auto]"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black text-slate-950">{account.name}</span>
                    <span className="block truncate text-sm font-medium text-slate-500">{account.email}</span>
                  </span>
                  <span className="hidden items-center gap-3 text-xs font-black uppercase text-slate-500 sm:flex">
                    <span className="rounded-full border border-slate-950 bg-card px-2 py-1 text-slate-950">{account.role}</span>
                    <ChevronRight className="h-4 w-4 text-slate-950" />
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-5 flex w-full items-center gap-4 rounded-full border-2 border-transparent px-4 py-4 text-left font-black text-slate-700 transition hover:border-slate-950 hover:bg-card"
            onClick={() => toast.info("Manual account entry is a placeholder in this demo.")}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-950">
              <UserRound className="h-5 w-5" />
            </span>
            Use another account
          </button>
        </div>
      </div>
    </section>
  </div>
);

const CustomerExperience = ({
  restaurants,
  selectedRestaurant,
  selectedRestaurantId,
  setSelectedRestaurantId,
  query,
  setQuery,
  cartLines,
  subtotal,
  delivery,
  total,
  addToCart,
  changeQuantity,
  placeOrder,
  orders,
}: {
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant;
  selectedRestaurantId: string;
  setSelectedRestaurantId: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  cartLines: CartLine[];
  subtotal: number;
  delivery: number;
  total: number;
  addToCart: (item: MenuItem) => void;
  changeQuantity: (itemId: string, delta: number) => void;
  placeOrder: () => void;
  orders: Order[];
}) => (
  <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
    <aside className="restaurant-panel-soft h-fit rounded-[1.5rem] p-4 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="ink-pill"><Sparkles className="h-3.5 w-3.5" />Eat</span>
        <span className="text-xs font-black uppercase text-slate-500">{restaurants.length} open</span>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-full border-2 border-slate-950 bg-white pl-11 font-bold" placeholder="Search restaurants" />
      </div>
      <div className="scrollbar-thin mt-4 flex gap-3 overflow-x-auto pb-2 lg:max-h-[58vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant._id}
            onClick={() => setSelectedRestaurantId(restaurant._id)}
            className={`min-w-[230px] rounded-[1.25rem] border-2 p-3 text-left transition lg:min-w-0 ${
              selectedRestaurantId === restaurant._id ? "border-slate-950 bg-[#f6c54e] shadow-[4px_4px_0_#17201e]" : "border-slate-950 bg-white hover:bg-amber-50"
            }`}
          >
            <span className="font-display block text-xl font-black leading-tight">{restaurant.restaurantName}</span>
            <span className="mt-1 block truncate text-sm font-semibold text-slate-600">{restaurant.city} / {restaurant.cuisines.join(", ")}</span>
          </button>
        ))}
      </div>
    </aside>

    <section className="space-y-5">
      {selectedRestaurant ? (
        <>
          <div className="restaurant-panel overflow-hidden rounded-[2rem] bg-card">
            <div className="relative">
              <img src={selectedRestaurant.imageUrl} className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[460px]" alt={selectedRestaurant.restaurantName} />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border-2 border-slate-950 bg-card/95 p-4 shadow-[5px_5px_0_#17201e] backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-[#f05d3b]">Now serving</p>
                    <h2 className="font-display text-4xl font-black leading-none sm:text-6xl">{selectedRestaurant.restaurantName}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-black text-slate-900">
                    <span className="rounded-full border-2 border-slate-950 bg-white px-3 py-2"><Clock className="mr-1 inline h-4 w-4 text-emerald-800" />{selectedRestaurant.estimatedDeliveryTime} min</span>
                    <span className="rounded-full border-2 border-slate-950 bg-[#f6c54e] px-3 py-2"><BadgeDollarSign className="mr-1 inline h-4 w-4" />{money(selectedRestaurant.deliveryPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {selectedRestaurant.menuItems.map((item) => (
              <div key={item._id} className="restaurant-panel-soft grid gap-4 rounded-[1.5rem] p-4">
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight">{item.name}</h3>
                  <p className="mt-1 min-h-10 text-sm font-semibold text-slate-500">{item.description}</p>
                  <p className="mt-3 text-lg font-black text-emerald-900">{money(item.price)}</p>
                </div>
                <Button onClick={() => addToCart(item)} className="h-11 rounded-full border-2 border-slate-950 bg-[#17201e] text-amber-50 shadow-[3px_3px_0_#f05d3b] hover:bg-emerald-900"><Plus className="h-4 w-4" />Add</Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No restaurant selected" />
      )}
    </section>

    <aside className="space-y-4 lg:col-span-2 xl:sticky xl:top-24 xl:col-span-1 xl:h-fit">
      <div className="restaurant-panel-soft rounded-[1.5rem] p-4">
        <h2 className="font-display flex items-center gap-2 text-3xl font-black"><ShoppingBag className="h-5 w-5 text-[#f05d3b]" />Cart</h2>
        <div className="mt-4 space-y-3">
          {cartLines.length === 0 ? (
            <p className="text-sm text-slate-500">Select a menu item to start an order.</p>
          ) : (
            cartLines.map((line) => (
              <div key={line.item._id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                <div>
                  <p className="font-bold">{line.item.name}</p>
                  <p className="text-sm text-slate-500">{money(line.item.price * line.quantity)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-2 border-slate-950" onClick={() => changeQuantity(line.item._id, -1)}><Minus /></Button>
                  <span className="w-6 text-center font-bold">{line.quantity}</span>
                  <Button variant="outline" size="icon" className="rounded-full border-2 border-slate-950" onClick={() => changeQuantity(line.item._id, 1)}><Plus /></Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-5 space-y-2 border-t-2 border-slate-950 pt-4 text-sm">
          <PriceRow label="Subtotal" value={subtotal} />
          <PriceRow label="Delivery" value={cartLines.length ? delivery : 0} />
          <PriceRow label="Total" value={cartLines.length ? total : 0} strong />
        </div>
        <Button disabled={cartLines.length === 0} onClick={placeOrder} className="mt-4 h-12 w-full rounded-full border-2 border-slate-950 bg-[#f05d3b] font-black text-white shadow-[3px_3px_0_#17201e] hover:bg-[#d94f32]">
          <CheckCircle2 className="h-4 w-4" />
          Place order
        </Button>
      </div>
      <OrderList orders={orders} />
    </aside>
  </div>
);

const ManagementExperience = ({
  role,
  restaurants,
  users,
  ownerOptions,
  restaurantForm,
  setRestaurantForm,
  saveRestaurant,
  isSaving,
  editRestaurant,
  deleteRestaurant,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  orders,
  updateOrderStatus,
}: {
  role: "admin" | "owner";
  restaurants: Restaurant[];
  users: User[];
  ownerOptions: AuthUser[];
  restaurantForm: Partial<Restaurant>;
  setRestaurantForm: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
  saveRestaurant: (event: FormEvent) => void;
  isSaving: boolean;
  editRestaurant: (restaurant: Restaurant) => void;
  deleteRestaurant: (id: string) => void;
  addMenuItem: () => void;
  updateMenuItem: (index: number, patch: Partial<MenuItem>) => void;
  removeMenuItem: (index: number) => void;
  orders: Order[];
  updateOrderStatus: (orderId: string, status: string) => void;
}) => (
  <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {restaurants.map((restaurant) => (
          <div key={restaurant._id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <img src={restaurant.imageUrl} className="h-40 w-full object-cover" alt={restaurant.restaurantName} />
            <div className="space-y-3 p-4">
              <div>
                <h3 className="text-xl font-black">{restaurant.restaurantName}</h3>
                <p className="text-sm text-slate-500">{restaurant.city} • {restaurant.cuisines.join(", ")}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-1">{restaurant.menuItems.length} menu items</span>
                <span className="rounded bg-slate-100 px-2 py-1">{restaurant.ownerId || "admin-owned"}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => editRestaurant(restaurant)}>Edit</Button>
                {role === "admin" ? (
                  <Button variant="destructive" onClick={() => deleteRestaurant(restaurant._id)}><Trash2 />Remove</Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <OrderList orders={orders} onStatus={updateOrderStatus} />
      {role === "admin" ? (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-xl font-black">Users</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {users.map((managedUser) => (
              <div key={managedUser.userId} className="rounded bg-slate-50 p-3">
                <p className="font-bold">{managedUser.name}</p>
                <p className="text-sm text-slate-500">{managedUser.email} • {managedUser.role}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>

    <form onSubmit={saveRestaurant} className="h-fit space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-2xl font-black">{restaurantForm._id ? "Edit restaurant" : "Add restaurant"}</h2>
        {role === "owner" ? <p className="mt-1 text-sm text-slate-500">Owners can change menu details, but the restaurant name stays locked.</p> : null}
      </div>

      <Field label="Restaurant name">
        <Input
          disabled={role === "owner"}
          value={restaurantForm.restaurantName || ""}
          onChange={(event) => setRestaurantForm((current) => ({ ...current, restaurantName: event.target.value }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <Input value={restaurantForm.city || ""} onChange={(event) => setRestaurantForm((current) => ({ ...current, city: event.target.value }))} />
        </Field>
        <Field label="Country">
          <Input value={restaurantForm.country || ""} onChange={(event) => setRestaurantForm((current) => ({ ...current, country: event.target.value }))} />
        </Field>
      </div>
      <Field label="Cuisines">
        <Input
          value={(restaurantForm.cuisines || []).join(", ")}
          onChange={(event) => setRestaurantForm((current) => ({ ...current, cuisines: event.target.value.split(",").map((value) => value.trim()) }))}
        />
      </Field>
      {role === "admin" ? (
        <Field label="Owner">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={restaurantForm.ownerId || ""}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, ownerId: event.target.value || null }))}
          >
            <option value="">No owner</option>
            {ownerOptions.map((owner) => <option key={owner.userId} value={owner.userId}>{owner.name}</option>)}
          </select>
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Delivery price">
          <Input type="number" value={restaurantForm.deliveryPrice || 0} onChange={(event) => setRestaurantForm((current) => ({ ...current, deliveryPrice: Number(event.target.value) }))} />
        </Field>
        <Field label="ETA minutes">
          <Input type="number" value={restaurantForm.estimatedDeliveryTime || 0} onChange={(event) => setRestaurantForm((current) => ({ ...current, estimatedDeliveryTime: Number(event.target.value) }))} />
        </Field>
      </div>
      <Field label="Image URL">
        <Input value={restaurantForm.imageUrl || ""} onChange={(event) => setRestaurantForm((current) => ({ ...current, imageUrl: event.target.value }))} />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black">Menu</h3>
          <Button type="button" variant="outline" onClick={addMenuItem}><Plus />Item</Button>
        </div>
        {(restaurantForm.menuItems || []).map((item, index) => (
          <div key={item._id} className="space-y-2 rounded-md bg-slate-50 p-3">
            <Input value={item.name} onChange={(event) => updateMenuItem(index, { name: event.target.value })} />
            <Input value={item.description || ""} onChange={(event) => updateMenuItem(index, { description: event.target.value })} />
            <div className="flex gap-2">
              <Input type="number" value={item.price} onChange={(event) => updateMenuItem(index, { price: Number(event.target.value) })} />
              <Button type="button" variant="outline" size="icon" onClick={() => removeMenuItem(index)}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button>
        {role === "admin" ? <Button type="button" variant="outline" onClick={() => setRestaurantForm(blankRestaurant())}>New</Button> : null}
      </div>
    </form>
  </div>
);

const Metric = ({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: number }) => (
  <div className="rounded-md bg-white/10 p-4">
    <Icon className="mb-3 h-5 w-5 text-emerald-300" />
    <p className="text-3xl font-black">{value}</p>
    <p className="text-sm font-semibold text-slate-300">{label}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const Step = ({ label, title }: { label: string; title: string }) => (
  <div className="rounded bg-white/10 p-3">
    <p className="font-black text-emerald-300">{label}</p>
    <p className="font-semibold">{title}</p>
  </div>
);

const PriceRow = ({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex justify-between ${strong ? "text-lg font-black" : ""}`}>
    <span>{label}</span>
    <span>{money(value)}</span>
  </div>
);

const EmptyState = ({ title }: { title: string }) => (
  <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{title}</div>
);

const OrderList = ({ orders, onStatus }: { orders: Order[]; onStatus?: (id: string, status: string) => void }) => (
  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="flex items-center gap-2 text-xl font-black"><ReceiptText className="h-5 w-5 text-emerald-700" />Orders</h2>
    <div className="mt-4 space-y-3">
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="rounded-md bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{order.restaurantName}</p>
                <p className="text-sm text-slate-500">{order.orderId} • {order.status}</p>
              </div>
              <p className="font-black">{money(order.total)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
            </p>
            {onStatus ? (
              <div className="mt-3 flex gap-2">
                {["Preparing", "Out for delivery", "Delivered"].map((status) => (
                  <Button key={status} variant="outline" size="sm" onClick={() => onStatus(order._id, status)}>{status}</Button>
                ))}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  </div>
);

export default HomePage;
